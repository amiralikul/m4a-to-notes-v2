import { NonRetriableError } from "inngest";
import { INNGEST_EVENTS } from "../events";
import { inngest } from "../client";
import {
	textAiService,
	transcriptionsService,
} from "@/services";
import {
	SummaryStatus,
	TranscriptionStatus,
} from "@/services/transcriptions";
import { getErrorMessage } from "@/lib/errors";
export const processSummary = inngest.createFunction(
	{
		id: "process-summary",
		retries: 3,
		concurrency: { limit: 5 },
		idempotency: "event.data.transcriptionId",
		timeouts: { finish: "10m" },
		onFailure: async ({ event, error, logger }) => {
			const transcriptionId =
				event.data.event.data.transcriptionId;

			logger.error("Summary generation failed after all retries (DLQ)", {
				transcriptionId,
				error: getErrorMessage(error),
			});

			try {
				await transcriptionsService.markSummaryFailed(
					transcriptionId,
					"MAX_RETRIES_EXCEEDED",
					getErrorMessage(error),
					textAiService.provider,
					textAiService.model,
				);
			} catch (dbError) {
				logger.error("Failed to mark summary as failed in DLQ handler", {
					transcriptionId,
					error: getErrorMessage(dbError),
				});
			}
		},
	},
	{ event: INNGEST_EVENTS.TRANSCRIPTION_COMPLETED },
	async ({ event, step, logger }) => {
		const { transcriptionId } = event.data;

		const transcriptionResult = await step.run(
			"fetch-transcription",
			async () => {
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
						`Transcript not available for summary: ${transcriptionId}`,
					);
				}

				if (
					transcription.summaryStatus === SummaryStatus.COMPLETED &&
					transcription.summaryData
				) {
					return {
						status: "skipped" as const,
						transcription,
					};
				}

				await transcriptionsService.markSummaryStarted(
					transcriptionId,
					textAiService.provider,
					textAiService.model,
				);

				return {
					status: "proceed" as const,
					transcription,
				};
			},
		);

		if (transcriptionResult.status === "skipped") {
			return {
				status: "skipped",
				transcriptionId,
			};
		}

		const summary = await step.run("generate-summary", async () => {
			return textAiService.generateSummary(
				transcriptionResult.transcription.transcriptText as string,
			);
		});

		await step.run("save-summary", async () => {
			await transcriptionsService.markSummaryCompleted(
				transcriptionId,
				summary,
				textAiService.provider,
				textAiService.model,
			);
		});

		return {
			status: "completed",
			transcriptionId,
			keyPoints: summary.keyPoints.length,
			actionItems: summary.actionItems.length,
		};
	},
);
