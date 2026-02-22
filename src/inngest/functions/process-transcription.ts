import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import { INNGEST_EVENTS } from "../events";
import {
	transcriptionsService,
	storageService,
	transcriptionAiService,
} from "@/services";
import { sendTelegramMessage } from "@/services/telegram";
import { TranscriptionStatus } from "@/services/transcriptions";
import { getErrorMessage } from "@/lib/errors";
export const processTranscription = inngest.createFunction(
	{
		id: "process-transcription",
		retries: 4,
		concurrency: { limit: 5 },
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

		// Step 2: Transcribe audio
		await step.run("mark-transcription-progress-started", async () => {
			await transcriptionsService.updateProgress(transcriptionId, 20);
		});

		const transcriptText = await (async () => {
			if (transcriptionAiService.provider === "groq") {
				const text = await step.ai.wrap(
					"transcribe-audio",
					transcriptionAiService.transcribeAudioFromUrl.bind(
						transcriptionAiService,
					),
					t.audioKey,
				);

				if (!text.trim()) {
					throw new NonRetriableError("No speech detected in audio");
				}

				return text;
			}

			const text = await step.ai.wrap("transcribe-audio", async () => {
				logger.info("Downloading audio file", {
					transcriptionId,
					audioKey: t.audioKey,
				});
				const audioBuffer = await storageService.downloadContent(t.audioKey);

				logger.info("Starting Whisper transcription", {
					transcriptionId,
					fileSize: audioBuffer.byteLength,
				});

				return transcriptionAiService.transcribeAudio(audioBuffer);
			});

			if (!text.trim()) {
				throw new NonRetriableError("No speech detected in audio");
			}

			return text;
		})();

		await step.run("mark-transcription-progress-finished", async () => {
			await transcriptionsService.updateProgress(transcriptionId, 90);
		});

		// Step 3: Save result
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

		// Step 4: Trigger summary generation in a separate pipeline.
		await step.sendEvent("request-summary", {
			id: `summary-requested-${transcriptionId}`,
			name: INNGEST_EVENTS.TRANSCRIPTION_COMPLETED,
			data: { transcriptionId },
		});

		// Step 5: Notify Telegram if source is telegram
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
