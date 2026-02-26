import { z } from "zod";
import { route } from "@/lib/route";
import { NotFoundError } from "@/lib/errors";
import { transcriptionsService } from "@/services";

function sanitizeDownloadFilename(filename: string): string {
	const withoutExtension = filename.replace(/\.[^.]+$/, "");
	const basename = withoutExtension.split(/[\\/]/).pop() ?? "";
	const sanitized = basename
		.replace(/[\r\n"]/g, "")
		.replace(/[^a-zA-Z0-9._-]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 120);

	return sanitized || "transcript";
}

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

		const safeFilename = sanitizeDownloadFilename(transcription.filename);

		return new Response(transcription.transcriptText, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Content-Disposition": `attachment; filename="${safeFilename}.txt"`,
			},
		});
	},
});
