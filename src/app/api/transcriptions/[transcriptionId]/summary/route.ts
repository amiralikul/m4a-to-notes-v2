import { z } from "zod";
import { route } from "@/lib/route";
import { NotFoundError } from "@/lib/errors";
import { transcriptionsService } from "@/services";

export const GET = route({
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
			!transcription.summaryStatus ||
			transcription.summaryStatus === "pending"
		) {
			throw new NotFoundError("Summary not yet available");
		}

		return {
			transcriptionId: transcription.id,
			summaryStatus: transcription.summaryStatus,
			summaryData: transcription.summaryData,
			summaryError: transcription.summaryError,
			summaryProvider: transcription.summaryProvider,
			summaryModel: transcription.summaryModel,
			summaryUpdatedAt: transcription.summaryUpdatedAt,
		};
	},
});
