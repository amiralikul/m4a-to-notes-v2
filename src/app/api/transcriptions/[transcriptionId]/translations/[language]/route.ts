import { auth } from "@clerk/nextjs/server";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { transcriptionsService, translationsService } from "@/services";

export async function GET(
	_request: Request,
	{
		params,
	}: { params: Promise<{ transcriptionId: string; language: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { transcriptionId, language } = await params;

	try {
		const transcription =
			await transcriptionsService.findById(transcriptionId);

		if (!transcription || transcription.userId !== userId) {
			return Response.json(
				{ error: "Transcription not found" },
				{ status: 404 },
			);
		}

		const translation =
			await translationsService.findByTranscriptionAndLanguage(
				transcriptionId,
				language,
			);

		if (!translation) {
			return Response.json(
				{ error: "Translation not found" },
				{ status: 404 },
			);
		}

		return Response.json({ translation });
	} catch (error) {
		logger.error("Failed to get translation", {
			userId,
			transcriptionId,
			language,
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to get translation" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: Request,
	{
		params,
	}: { params: Promise<{ transcriptionId: string; language: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { transcriptionId, language } = await params;

	try {
		const transcription =
			await transcriptionsService.findById(transcriptionId);

		if (!transcription || transcription.userId !== userId) {
			return Response.json(
				{ error: "Transcription not found" },
				{ status: 404 },
			);
		}

		const translation =
			await translationsService.findByTranscriptionAndLanguage(
				transcriptionId,
				language,
			);

		if (!translation) {
			return Response.json(
				{ error: "Translation not found" },
				{ status: 404 },
			);
		}

		await translationsService.delete(translation.id);

		return new Response(null, { status: 204 });
	} catch (error) {
		logger.error("Failed to delete translation", {
			userId,
			transcriptionId,
			language,
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to delete translation" },
			{ status: 500 },
		);
	}
}
