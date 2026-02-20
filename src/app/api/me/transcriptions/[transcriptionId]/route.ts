import { auth } from "@clerk/nextjs/server";
import { resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService, transcriptionsService, translationsService, storageService } from "@/services";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ transcriptionId: string }> },
) {
	const { userId } = await auth();
	let actorId: string | null = null;
	let transcriptionId: string | null = null;

	try {
		const paramsPromise = params;
		if (!userId) {
			const [identity, resolvedParams] = await Promise.all([
				resolveActorIdentity(),
				paramsPromise,
			]);
			actorId = identity.actorId;
			await actorsService.ensureActor(actorId);
			transcriptionId = resolvedParams.transcriptionId;
		} else {
			const resolvedParams = await paramsPromise;
			transcriptionId = resolvedParams.transcriptionId;
		}

		const transcription =
			await transcriptionsService.findById(transcriptionId);
		const transcriptionActorId =
			typeof transcription?.ownerId === "string"
				? transcription.ownerId
				: null;
		const isOwner = userId
			? transcription?.userId === userId
			: transcription?.userId === null && transcriptionActorId === actorId;

		if (
			!transcription ||
			!isOwner
		) {
			return Response.json(
				{ error: "Transcription not found" },
				{ status: 404 },
			);
		}

		if (transcription.audioKey) {
			try {
				await storageService.deleteObject(transcription.audioKey);
			} catch (blobError) {
				logger.warn("Failed to delete audio blob", {
					transcriptionId,
					audioKey: transcription.audioKey,
					error: getErrorMessage(blobError),
				});
			}
		}

		await translationsService.deleteByTranscriptionId(transcriptionId);
		await transcriptionsService.delete(transcriptionId);

		return new Response(null, { status: 204 });
	} catch (error) {
		logger.error("Failed to delete transcription", {
			userId,
			actorId,
			transcriptionId,
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to delete transcription" },
			{ status: 500 },
		);
	}
}
