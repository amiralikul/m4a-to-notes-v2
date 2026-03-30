import { asc, eq } from "drizzle-orm";
import { transcriptionChunks, transcriptions } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

const MAX_FALLBACK_TRANSCRIPT_CHARS = 4_000;

export type TranscriptionChatRetrievedChunk = {
	id: string;
	text: string;
	startMs: number;
	endMs: number;
	chunkIndex: number;
	score: number;
};

export class TranscriptionChatRetrievalService {
	constructor(
		private db: AppDatabase,
		private logger: Logger,
	) {}

	async findRelevantChunks(
		transcriptionId: string,
		latestUserQuery: string,
		limit = 5,
	): Promise<TranscriptionChatRetrievedChunk[]> {
		try {
			const normalizedQuery = normalizeText(latestUserQuery);
			if (!normalizedQuery) return [];

			const queryTokens = tokenize(normalizedQuery);
			if (queryTokens.length === 0) return [];

			const chunks = await this.db
				.select()
				.from(transcriptionChunks)
				.where(eq(transcriptionChunks.transcriptionId, transcriptionId))
				.orderBy(asc(transcriptionChunks.chunkIndex));

			const scoredChunks = chunks
				.filter(
					(chunk) =>
						typeof chunk.transcriptText === "string" &&
						chunk.transcriptText.trim().length > 0,
				)
				.map((chunk) => {
					const normalizedText = normalizeText(chunk.transcriptText ?? "");
					const chunkTokens = tokenize(normalizedText);
					const overlapCount = countQueryTokenOverlap(
						queryTokens,
						new Set(chunkTokens),
					);
					const exactPhraseBonus = hasContiguousPhraseMatch(
						queryTokens,
						chunkTokens,
					)
						? 1
						: 0;

					return {
						id: chunk.id,
						text: chunk.transcriptText ?? "",
						startMs: chunk.startMs,
						endMs: chunk.endMs,
						chunkIndex: chunk.chunkIndex,
						score: overlapCount + exactPhraseBonus,
					};
				})
				.filter((chunk) => chunk.score > 0);

			if (scoredChunks.length === 0) {
				const transcriptionRows = await this.db
					.select()
					.from(transcriptions)
					.where(eq(transcriptions.id, transcriptionId))
					.limit(1);

				const transcription = transcriptionRows[0];
				if (!transcription?.transcriptText?.trim()) {
					return [];
				}

				const normalizedText = normalizeText(transcription.transcriptText);
				const transcriptTokens = tokenize(normalizedText);
				const score =
					countQueryTokenOverlap(queryTokens, new Set(transcriptTokens)) +
					(hasContiguousPhraseMatch(queryTokens, transcriptTokens) ? 1 : 0);

				if (score <= 0) {
					return [];
				}

				return [
					{
						id: transcription.id,
						text: createFallbackTranscriptExcerpt(
							transcription.transcriptText,
							queryTokens,
						),
						startMs: 0,
						endMs: 0,
						chunkIndex: 0,
						score,
					},
				];
			}

			return scoredChunks
				.sort((left, right) => {
					if (right.score !== left.score) {
						return right.score - left.score;
					}

					if (left.chunkIndex !== right.chunkIndex) {
						return left.chunkIndex - right.chunkIndex;
					}

					return left.id.localeCompare(right.id);
				})
				.slice(0, Math.max(0, limit));
		} catch (error) {
			this.logger.error("Failed to retrieve transcription chat chunks", {
				transcriptionId,
				queryLength: latestUserQuery.length,
				queryTokenCount: tokenize(normalizeText(latestUserQuery)).length,
				limit,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}
}

function normalizeText(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function tokenize(value: string): string[] {
	return value.match(/[\p{L}\p{N}]+/gu) ?? [];
}

function countQueryTokenOverlap(
	queryTokens: string[],
	chunkTokens: Set<string>,
): number {
	let count = 0;
	for (const token of new Set(queryTokens)) {
		if (chunkTokens.has(token)) {
			count += 1;
		}
	}
	return count;
}

function hasContiguousPhraseMatch(
	queryTokens: string[],
	chunkTokens: string[],
): boolean {
	if (queryTokens.length === 0 || queryTokens.length > chunkTokens.length) {
		return false;
	}

	for (let index = 0; index <= chunkTokens.length - queryTokens.length; index++) {
		let matches = true;

		for (let offset = 0; offset < queryTokens.length; offset++) {
			if (chunkTokens[index + offset] !== queryTokens[offset]) {
				matches = false;
				break;
			}
		}

		if (matches) {
			return true;
		}
	}

	return false;
}

function createFallbackTranscriptExcerpt(
	transcriptText: string,
	queryTokens: string[],
): string {
	if (transcriptText.length <= MAX_FALLBACK_TRANSCRIPT_CHARS) {
		return transcriptText;
	}

	const excerptBodyLength = MAX_FALLBACK_TRANSCRIPT_CHARS - 6;
	const anchorIndex = findTranscriptAnchorIndex(transcriptText, queryTokens);
	let start = Math.max(0, anchorIndex - Math.floor(excerptBodyLength / 2));
	let end = Math.min(transcriptText.length, start + excerptBodyLength);
	start = Math.max(0, end - excerptBodyLength);
	end = Math.min(transcriptText.length, start + excerptBodyLength);

	const prefix = start > 0 ? "..." : "";
	const suffix = end < transcriptText.length ? "..." : "";

	return `${prefix}${transcriptText.slice(start, end).trim()}${suffix}`;
}

function findTranscriptAnchorIndex(
	transcriptText: string,
	queryTokens: string[],
): number {
	const normalizedTranscriptText = transcriptText.toLowerCase();

	for (const token of queryTokens) {
		const tokenIndex = normalizedTranscriptText.indexOf(token.toLowerCase());
		if (tokenIndex >= 0) {
			return tokenIndex;
		}
	}

	return 0;
}
