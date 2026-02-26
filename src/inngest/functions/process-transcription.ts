import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import { INNGEST_EVENTS } from "../events";
import {
	transcriptionsService,
	storageService,
	transcriptionAiService,
	assemblyAiService,
} from "@/services";
import { sendTelegramMessage } from "@/services/telegram";
import { TranscriptionStatus } from "@/services/transcriptions";
import { getErrorMessage } from "@/lib/errors";
export const processTranscription = inngest.createFunction(
	{
		id: "process-transcription",
		retries: 4,
		concurrency: { limit: 5 },
		throttle: { limit: 30, period: "1m" },
		idempotency: "event.data.transcriptionId",
		timeouts: { finish: "15m" },
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

		let transcriptText: string;

		if (t.enableDiarization) {
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

				const text =
					transcriptionAiService.provider === "groq"
						? await transcriptionAiService.transcribeAudioFromUrl(t.audioKey)
						: await (async () => {
								logger.info("Downloading audio file", {
									transcriptionId,
									audioKey: t.audioKey,
								});
								const audioBuffer = await storageService.downloadContent(
									t.audioKey,
								);

								logger.info("Starting Whisper transcription", {
									transcriptionId,
									fileSize: audioBuffer.byteLength,
								});
								return transcriptionAiService.transcribeAudio(audioBuffer);
							})();

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
