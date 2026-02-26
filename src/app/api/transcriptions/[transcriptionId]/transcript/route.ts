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

		if (!transcription.transcriptText) {
			throw new NotFoundError("Transcript not yet available");
		}

		return new Response(transcription.transcriptText, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Content-Disposition": `attachment; filename="${transcription.filename.replace(/\.[^.]+$/, "")}.txt"`,
			},
		});
	},
});
