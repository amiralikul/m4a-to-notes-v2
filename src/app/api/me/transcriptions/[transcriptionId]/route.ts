import { z } from "zod";
import { route, type OwnerIdentity } from "@/lib/route";
import { NotFoundError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
	transcriptionsService,
	storageService,
} from "@/services";

function mapRenameResponse(transcription: Awaited<ReturnType<typeof transcriptionsService.updateDisplayName>>) {
	return {
		id: transcription.id,
		filename: transcription.filename,
		displayName: transcription.displayName,
		status: transcription.status,
		progress: transcription.progress,
		preview: transcription.preview,
		summaryStatus: transcription.summaryStatus,
		summaryUpdatedAt: transcription.summaryUpdatedAt,
		createdAt: transcription.createdAt,
		completedAt: transcription.completedAt,
		audioKey: transcription.audioKey,
		enableDiarization: transcription.enableDiarization,
	};
}

export const DELETE = route({
	auth: "optional",
	params: z.object({ transcriptionId: z.string() }),
	handler: async ({ userId, actorId, params }) => {
		const transcription = await transcriptionsService.findByIdForOwner(
			params.transcriptionId,
			{ userId, actorId } as OwnerIdentity,
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

		await transcriptionsService.delete(params.transcriptionId);

		return new Response(null, { status: 204 });
	},
});

export const PATCH = route({
	auth: "optional",
	params: z.object({ transcriptionId: z.string() }),
	body: z.object({ displayName: z.string() }),
	handler: async ({ userId, actorId, params, body }) => {
		const displayName = body.displayName.trim();

		if (displayName.length === 0) {
			return Response.json(
				{ error: "Display name cannot be empty" },
				{ status: 400 },
			);
		}

		const owner = { userId, actorId } as OwnerIdentity;
		const transcription = await transcriptionsService.findByIdForOwner(
			params.transcriptionId,
			owner,
		);

		if (!transcription) throw new NotFoundError("Transcription not found");

		const updated = await transcriptionsService.updateDisplayName(
			params.transcriptionId,
			displayName,
		);

		return mapRenameResponse(updated);
	},
});
