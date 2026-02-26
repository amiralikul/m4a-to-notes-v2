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

		if (!transcription) throw new NotFoundError("Transcription not found");

		const detail = await transcriptionsService.getDetail(
			params.transcriptionId,
		);
		if (!detail) throw new NotFoundError("Transcription not found");

		return detail;
	},
});
