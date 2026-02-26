import { z } from "zod";
import { route } from "@/lib/route";
import { NotFoundError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
	transcriptionsService,
	translationsService,
	storageService,
} from "@/services";

export const DELETE = route({
	auth: "optional",
	params: z.object({ transcriptionId: z.string() }),
	handler: async ({ userId, actorId, params }) => {
		const transcription = await transcriptionsService.findByIdForOwner(
			params.transcriptionId,
			{ userId, actorId },
		);

		if (!transcription) throw new NotFoundError("Transcription not found");

		if (transcription.audioKey) {
			try {
				await storageService.deleteObject(transcription.audioKey);
			} catch (blobError) {
				logger.warn("Failed to delete audio blob", {
					transcriptionId: params.transcriptionId,
					audioKey: transcription.audioKey,
					error: getErrorMessage(blobError),
				});
			}
		}

		await translationsService.deleteByTranscriptionId(
			params.transcriptionId,
		);
		await transcriptionsService.delete(params.transcriptionId);

		return new Response(null, { status: 204 });
	},
});
