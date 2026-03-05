import { z } from "zod";
import { route, type OwnerIdentity } from "@/lib/route";
import { getErrorMessage, NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { transcriptionsService, workflowService } from "@/services";
import { TranscriptionStatus } from "@/services/transcriptions";

export const POST = route({
	auth: "optional",
	params: z.object({ transcriptionId: z.string() }),
	handler: async ({ userId, actorId, params }) => {
		const transcription = await transcriptionsService.findByIdForOwner(
			params.transcriptionId,
			{ userId, actorId } as OwnerIdentity,
		);

		if (!transcription) {
			throw new NotFoundError("Transcription not found");
		}

		if (
			transcription.status !== TranscriptionStatus.COMPLETED ||
			!transcription.transcriptText
		) {
			throw new ValidationError(
				"Cannot regenerate summary until transcription is completed",
			);
		}

		await transcriptionsService.markSummaryPending(params.transcriptionId);

		try {
			await workflowService.regenerateSummary(params.transcriptionId);
		} catch (error) {
			logger.error("Failed to enqueue summary regeneration", {
				transcriptionId: params.transcriptionId,
				error: getErrorMessage(error),
			});

			await transcriptionsService.update(params.transcriptionId, {
				summaryStatus: transcription.summaryStatus,
				summaryData: transcription.summaryData,
				summaryError: transcription.summaryError,
				summaryProvider: transcription.summaryProvider,
				summaryModel: transcription.summaryModel,
				summaryUpdatedAt: transcription.summaryUpdatedAt,
			});

			throw error;
		}

		return Response.json(
			{
				status: "queued",
				transcriptionId: params.transcriptionId,
				summaryStatus: "pending",
			},
			{ status: 202 },
		);
	},
});
