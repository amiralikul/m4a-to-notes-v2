import { z } from "zod";
import { route } from "@/lib/route";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { transcriptionsService, workflowService } from "@/services";
import { TranscriptionStatus } from "@/services/transcriptions";

export const POST = route({
	auth: "optional",
	params: z.object({ transcriptionId: z.string() }),
	handler: async ({ userId, actorId, params }) => {
		const transcription = await transcriptionsService.findByIdForOwner(
			params.transcriptionId,
			{ userId, actorId },
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
		await workflowService.regenerateSummary(params.transcriptionId);

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
