import { auth } from "@clerk/nextjs/server";
import { transcriptionsService, storageService } from "@/services";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ transcriptionId: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { transcriptionId } = await params;

	try {
		const transcription =
			await transcriptionsService.findById(transcriptionId);

		if (
			!transcription ||
			transcription.userId !== userId
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

		await transcriptionsService.delete(transcriptionId);

		return new Response(null, { status: 204 });
	} catch (error) {
		logger.error("Failed to delete transcription", {
			userId,
			transcriptionId,
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to delete transcription" },
			{ status: 500 },
		);
	}
}
