import { z } from "zod";
import { route, type OwnerIdentity } from "@/lib/route";
import { NotFoundError } from "@/lib/errors";
import { transcriptionsService } from "@/services";

export const GET = route({
	auth: "optional",
	params: z.object({ transcriptionId: z.string() }),
	handler: async ({ userId, actorId, params }) => {
		const status = await transcriptionsService.getStatusForOwner(
			params.transcriptionId,
			{ userId, actorId } as OwnerIdentity,
		);

		if (!status) throw new NotFoundError("Transcription not found");
		return status;
	},
});
