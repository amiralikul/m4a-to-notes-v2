import { asc, eq } from "drizzle-orm";
import { transcriptionChunks, transcriptions } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

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
				});

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
						text: transcription.transcriptText,
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
				latestUserQuery,
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
