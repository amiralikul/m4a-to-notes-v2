import { convertToModelMessages, streamText, type UIMessage } from "ai";
import type { TranscriptionChatRetrievedChunk } from "@/services/transcription-chat-retrieval";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";
import { createAnthropicClient } from "./providers/anthropic.client";

export interface TranscriptionChatAiServiceConfig {
	apiKey: string;
	model: string;
	baseUrl?: string;
	maxRetries?: number;
}

export class TranscriptionChatAiService {
	readonly model: string;
	readonly provider = "anthropic";
	private readonly apiKey: string;
	private readonly maxRetries: number;
	private readonly logger: Logger;
	private readonly anthropicClient: ReturnType<typeof createAnthropicClient>;

	constructor(config: TranscriptionChatAiServiceConfig, logger: Logger) {
		this.apiKey = config.apiKey;
		this.model = config.model;
		this.maxRetries = config.maxRetries ?? 2;
		this.logger = logger;
		this.anthropicClient = createAnthropicClient({
			apiKey: config.apiKey,
			baseURL: config.baseUrl,
		});
	}

	async streamResponse(input: {
		messages: UIMessage[];
		retrievedChunks: TranscriptionChatRetrievedChunk[];
		abortSignal?: AbortSignal;
		requestId?: string;
		idempotencyKey?: string;
	}) {
		if (!this.apiKey) {
			throw new Error("ANTHROPIC_API_KEY is not configured");
		}

		const modelMessages = await convertToModelMessages(
			input.messages.map((message) => {
				return Object.fromEntries(
					Object.entries(message).filter(([key]) => key !== "id"),
				) as Omit<typeof message, "id">;
			}),
		);
		const startedAt = Date.now();

		try {
			return streamText({
				model: this.anthropicClient(this.model),
				messages: modelMessages,
				system: buildTranscriptChatSystemPrompt(input.retrievedChunks),
				temperature: 0.2,
				maxRetries: this.maxRetries,
				abortSignal: input.abortSignal,
				onError: ({ error }) => {
					this.logger.error("Transcription chat stream failed", {
						model: this.model,
						requestId: input.requestId,
						idempotencyKey: input.idempotencyKey,
						error: getErrorMessage(error),
					});
				},
				onFinish: ({ finishReason, totalUsage }) => {
					this.logger.info("Transcription chat stream completed", {
						model: this.model,
						requestId: input.requestId,
						idempotencyKey: input.idempotencyKey,
						durationMs: Date.now() - startedAt,
						finishReason,
						totalUsage,
						retrievedChunkCount: input.retrievedChunks.length,
					});
				},
			});
		} catch (error) {
			this.logger.error("Failed to start transcription chat stream", {
				model: this.model,
				requestId: input.requestId,
				idempotencyKey: input.idempotencyKey,
				durationMs: Date.now() - startedAt,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}
}

function buildTranscriptChatSystemPrompt(
	retrievedChunks: TranscriptionChatRetrievedChunk[],
): string {
	const transcriptContext =
		retrievedChunks.length > 0
			? retrievedChunks
					.map(
						(chunk) =>
							`[${formatTimestampRange(chunk.startMs, chunk.endMs)}] "${chunk.text}"`,
					)
					.join("\n\n")
			: "No relevant transcript chunks were retrieved for this question.";

	return [
		"You answer questions about a transcription using the provided transcript context first.",
		"For transcript-specific claims, quote the transcript exactly when possible and cite at least one timestamp range.",
		"Never fabricate transcript quotes or timestamps. If the transcript does not support the answer, say that clearly.",
		"You may use general knowledge only as supplemental context, and you must label it as supplemental when you do.",
		"Prefer concise, direct answers grounded in the transcript context.",
		"",
		"Transcript context:",
		transcriptContext,
	].join("\n");
}

function formatTimestampRange(startMs: number, endMs: number): string {
	return `${formatTimestamp(startMs)}-${formatTimestamp(endMs)}`;
}

function formatTimestamp(valueMs: number): string {
	const totalSeconds = Math.max(0, Math.floor(valueMs / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	}

	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
