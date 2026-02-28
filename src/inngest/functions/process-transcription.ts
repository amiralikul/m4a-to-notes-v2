import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import { INNGEST_EVENTS } from "../events";
import {
	transcriptionsService,
	transcriptionChunksService,
	transcriptionAiService,
	assemblyAiService,
} from "@/services";
import { sendTelegramMessage } from "@/services/telegram";
import { TranscriptionStatus } from "@/services/transcriptions";
import { getErrorMessage } from "@/lib/errors";
import { mergeChunkTranscripts } from "@/lib/transcript-merge";
import { TranscriptionChunkStatus } from "@/services/transcription-chunks";

export const processTranscription = inngest.createFunction(
	{
		id: "process-transcription",
		retries: 4,
		concurrency: { limit: 5 },
		throttle: { limit: 30, period: "1m" },
		idempotency: "event.data.transcriptionId",
		timeouts: { finish: "4h" },
		onFailure: async ({ event, error, logger }) => {
			const transcriptionId =
				event.data.event.data.transcriptionId;
			logger.error("Transcription failed after all retries (DLQ)", {
				transcriptionId,
				error: getErrorMessage(error),
			});

			try {
				await transcriptionsService.markFailed(
					transcriptionId,
					"MAX_RETRIES_EXCEEDED",
					getErrorMessage(error),
				);
			} catch (dbError) {
				logger.error("Failed to mark transcription as failed in DLQ handler", {
					transcriptionId,
					error: getErrorMessage(dbError),
				});
			}
		},
	},
	{ event: INNGEST_EVENTS.TRANSCRIPTION_REQUESTED },
	async ({ event, step, logger }) => {
		const { transcriptionId } = event.data;

		// Step 1: Fetch transcription and check idempotency
		const transcription = await step.run(
			"fetch-transcription",
			async () => {
				const t = await transcriptionsService.findById(transcriptionId);
				if (!t) {
					throw new NonRetriableError(
						`Transcription not found: ${transcriptionId}`,
					);
				}

				if (t.status === TranscriptionStatus.COMPLETED) {
					return { status: "skipped" as const, transcription: t };
				}
				if (t.status === TranscriptionStatus.FAILED) {
					return { status: "skipped" as const, transcription: t };
				}

				await transcriptionsService.markStarted(transcriptionId, 5);
				return { status: "proceed" as const, transcription: t };
			},
		);

		if (transcription.status === "skipped") {
			return { status: "skipped", transcriptionId };
		}

		const { transcription: t } = transcription;

		const chunks = await step.run("fetch-transcription-chunks", async () =>
			transcriptionChunksService.findByTranscriptionId(transcriptionId),
		);
		const isChunked = chunks.length > 0;

		if (!t.enableDiarization && transcriptionAiService.provider !== "groq") {
			throw new NonRetriableError(
				'URL-based transcription requires TRANSCRIPTION_PROVIDER="groq"',
			);
		}

		let transcriptText: string;

		if (isChunked) {
			if (t.enableDiarization) {
				throw new NonRetriableError(
					"Diarization is not supported for chunked transcriptions",
				);
			}

			await step.run("validate-transcription-chunks", async () => {
				const uniqueIndices = new Set<number>();
				for (const chunk of chunks) {
					if (chunk.endMs <= chunk.startMs) {
						throw new NonRetriableError(
							`Invalid chunk timing for chunk ${chunk.chunkIndex}`,
						);
					}
					if (uniqueIndices.has(chunk.chunkIndex)) {
						throw new NonRetriableError(
							`Duplicate chunk index ${chunk.chunkIndex}`,
						);
					}
					uniqueIndices.add(chunk.chunkIndex);
				}
			});

			await step.run("mark-chunked-progress-start", async () => {
				await transcriptionsService.updateProgress(transcriptionId, 20);
			});

			for (let i = 0; i < chunks.length; i++) {
				const chunk = chunks[i];

				await step.run(`transcribe-chunk-${chunk.chunkIndex}`, async () => {
					await transcriptionChunksService.markProcessing(
						chunk.id,
						transcriptionId,
					);

					try {
						const chunkText =
							await transcriptionAiService.transcribeAudioFromUrl(
								chunk.blobUrl,
							);

						if (!chunkText.trim()) {
							throw new NonRetriableError(
								`No speech detected in chunk ${chunk.chunkIndex}`,
							);
						}

						await transcriptionChunksService.markCompleted(
							chunk.id,
							transcriptionId,
							chunkText,
						);
					} catch (error) {
						await transcriptionChunksService.markFailed(
							chunk.id,
							transcriptionId,
							"CHUNK_TRANSCRIPTION_FAILED",
							getErrorMessage(error),
						);
						throw error;
					}

					const progress = Math.min(
						20 + Math.round(((i + 1) / chunks.length) * 70),
						90,
					);
					await transcriptionsService.updateProgress(transcriptionId, progress);
				});
			}

			transcriptText = await step.run("merge-chunk-transcripts", async () => {
				const chunkRows = await transcriptionChunksService.findByTranscriptionId(
					transcriptionId,
				);
				const failedChunk = chunkRows.find(
					(chunk) => chunk.status === TranscriptionChunkStatus.FAILED,
				);
				if (failedChunk) {
					throw new NonRetriableError(
						failedChunk.errorDetails?.message ||
							`Chunk ${failedChunk.chunkIndex} failed`,
					);
				}

				const missingChunk = chunkRows.find(
					(chunk) =>
						chunk.status !== TranscriptionChunkStatus.COMPLETED ||
						!chunk.transcriptText?.trim(),
				);
				if (missingChunk) {
					throw new Error(
						`Chunk ${missingChunk.chunkIndex} is not completed yet`,
					);
				}

				return mergeChunkTranscripts(
					chunkRows.map((chunk) => ({
						chunkIndex: chunk.chunkIndex,
						text: chunk.transcriptText || "",
					})),
				);
			});

			if (!transcriptText.trim()) {
				throw new NonRetriableError("No speech detected in audio");
			}

			await step.run("save-chunked-result", async () => {
				const preview =
					transcriptText.substring(0, 150) +
					(transcriptText.length > 150 ? "..." : "");

				await transcriptionsService.markCompleted(
					transcriptionId,
					preview,
					transcriptText,
				);
			});
		} else if (t.enableDiarization) {
			// Diarization path: submit to AssemblyAI, then poll with step.sleep
			const assemblyJobId = await step.run("submit-diarization", async () => {
				await transcriptionsService.updateProgress(transcriptionId, 20);
				return assemblyAiService.submit(t.audioKey);
			});

			let done = false;
			let finalError: string | null = null;
			let completedText = "";

			for (let i = 0; i < 20; i++) {
				if (i > 0) {
					await step.sleep(`poll-wait-${i}`, "30s");
				}

				const pollState = await step.run(`poll-and-save-${i}`, async () => {
					const progress = Math.min(20 + (i + 1) * 3, 90);
					await transcriptionsService.updateProgress(transcriptionId, progress);

					const result = await assemblyAiService.getTranscript(assemblyJobId);
					if (result.status === "completed") {
						if (!result.text.trim()) {
							return { done: true as const, error: "No speech detected in audio", text: "" };
						}
						const preview =
							result.text.substring(0, 150) +
							(result.text.length > 150 ? "..." : "");
						await transcriptionsService.markCompleted(
							transcriptionId,
							preview,
							result.text,
							result.segments,
						);
						return { done: true as const, text: result.text };
					}

					if (result.status === "error") {
						return { done: true as const, error: result.error, text: "" };
					}

					return { done: false as const, text: "" };
				});

				if (pollState.done) {
					done = true;
					finalError = "error" in pollState ? (pollState.error ?? null) : null;
					completedText = pollState.text;
					break;
				}
			}

			if (!done) {
				throw new NonRetriableError("Diarization timed out after 10 minutes");
			}
			if (finalError) {
				throw new NonRetriableError(finalError);
			}

			transcriptText = completedText;
		} else {
			// Standard path: Groq/OpenAI Whisper
			transcriptText = await step.run("transcribe-audio", async () => {
				await transcriptionsService.updateProgress(transcriptionId, 20);

				const text = await transcriptionAiService.transcribeAudioFromUrl(
					t.audioKey,
				);

				if (!text.trim()) {
					throw new NonRetriableError("No speech detected in audio");
				}

				await transcriptionsService.updateProgress(transcriptionId, 90);
				return text;
			});

			await step.run("save-result", async () => {
				const preview =
					transcriptText.substring(0, 150) +
					(transcriptText.length > 150 ? "..." : "");

				await transcriptionsService.markCompleted(
					transcriptionId,
					preview,
					transcriptText,
				);
			});
		}

		// Trigger summary generation in a separate pipeline
		await step.sendEvent("request-summary", {
			id: `summary-requested-${transcriptionId}`,
			name: INNGEST_EVENTS.TRANSCRIPTION_COMPLETED,
			data: { transcriptionId },
		});

		// Notify Telegram if source is telegram
		if (t.source === "telegram" && t.userMetadata) {
			await step.run("notify-telegram", async () => {
				const chatId = (t.userMetadata as Record<string, unknown>)
					?.chatId as string | undefined;
				const botToken = process.env.TELEGRAM_BOT_TOKEN;

				if (!chatId || !botToken) {
					logger.warn(
						"Cannot notify Telegram: missing chatId or botToken",
						{ transcriptionId },
					);
					return;
				}

				const message =
					transcriptText.length > 4000
						? `${transcriptText.substring(0, 4000)}...\n\n(Transcription truncated. Full text available in the web app.)`
						: transcriptText;

				await sendTelegramMessage(chatId, message, botToken);
				logger.info("Telegram notification sent", {
					transcriptionId,
					chatId,
				});
			});
		}

		return {
			status: "completed",
			transcriptionId,
			transcriptionLength: transcriptText.length,
		};
	},
);
