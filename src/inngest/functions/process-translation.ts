import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import { INNGEST_EVENTS } from "../events";
import {
	textAiService,
	transcriptionsService,
	translationsService,
} from "@/services";
import { TranscriptionStatus, SummaryStatus } from "@/services/transcriptions";
import { TranslationStatus } from "@/services/translations";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { SUPPORTED_LANGUAGES } from "@/lib/constants/languages";
import type { LanguageCode } from "@/lib/constants/languages";

export const processTranslation = inngest.createFunction(
	{
		id: "process-translation",
		retries: 3,
		concurrency: { limit: 5 },
		idempotency: "event.data.translationId",
		timeouts: { finish: "10m" },
		onFailure: async ({ event, error }) => {
			const translationId = event.data.event.data.translationId;

			logger.error("Translation failed after all retries (DLQ)", {
				translationId,
				error: getErrorMessage(error),
			});

			try {
				await translationsService.markFailed(
					translationId,
					"MAX_RETRIES_EXCEEDED",
					getErrorMessage(error),
				);
			} catch (dbError) {
				logger.error("Failed to mark translation as failed in DLQ handler", {
					translationId,
					error: getErrorMessage(dbError),
				});
			}
		},
	},
	{ event: INNGEST_EVENTS.TRANSLATION_REQUESTED },
	async ({ event, step }) => {
		const { translationId, transcriptionId, language } = event.data;

		const fetchResult = await step.run("fetch-data", async () => {
			const translation = await translationsService.findById(translationId);
			if (!translation) {
				throw new NonRetriableError(
					`Translation not found: ${translationId}`,
				);
			}

			if (translation.status === TranslationStatus.COMPLETED) {
				return { status: "skipped" as const };
			}

			const transcription =
				await transcriptionsService.findById(transcriptionId);
			if (!transcription) {
				throw new NonRetriableError(
					`Transcription not found: ${transcriptionId}`,
				);
			}

			if (
				transcription.status !== TranscriptionStatus.COMPLETED ||
				!transcription.transcriptText
			) {
				throw new NonRetriableError(
					`Transcription not completed: ${transcriptionId}`,
				);
			}

			if (
				transcription.summaryStatus !== SummaryStatus.COMPLETED ||
				!transcription.summaryData
			) {
				throw new NonRetriableError(
					`Summary not completed for transcription: ${transcriptionId}`,
				);
			}

			await translationsService.markStarted(translationId);

			return {
				status: "proceed" as const,
				transcriptText: transcription.transcriptText,
				summaryData: transcription.summaryData,
			};
		});

		if (fetchResult.status === "skipped") {
			return { status: "skipped", translationId };
		}

		const languageName =
			SUPPORTED_LANGUAGES[language as LanguageCode] || language;

		const translatedText = await step.run("translate-text", async () => {
			return textAiService.translateText(
				fetchResult.transcriptText,
				languageName,
			);
		});

		const translatedSummary = await step.run(
			"translate-summary",
			async () => {
				return textAiService.translateSummary(
					fetchResult.summaryData,
					languageName,
				);
			},
		);

		await step.run("save-translation", async () => {
			await translationsService.markCompleted(
				translationId,
				translatedText,
				translatedSummary,
			);
		});

		return {
			status: "completed",
			translationId,
			transcriptionId,
			language,
		};
	},
);
