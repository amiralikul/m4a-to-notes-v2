import { auth } from "@clerk/nextjs/server";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
	transcriptionsService,
	translationsService,
	workflowService,
} from "@/services";
import { TranscriptionStatus, SummaryStatus } from "@/services/transcriptions";
import { isValidLanguage } from "@/lib/constants/languages";

export async function GET(
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

		if (!transcription || transcription.userId !== userId) {
			return Response.json(
				{ error: "Transcription not found" },
				{ status: 404 },
			);
		}

		const translationsList =
			await translationsService.findByTranscriptionId(transcriptionId);

		return Response.json({ translations: translationsList });
	} catch (error) {
		logger.error("Failed to list translations", {
			userId,
			transcriptionId,
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to list translations" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ transcriptionId: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { transcriptionId } = await params;

	try {
		const body = (await request.json()) as { language?: string };
		const { language } = body;

		if (!language || !isValidLanguage(language)) {
			return Response.json(
				{ error: "Invalid or unsupported language code" },
				{ status: 400 },
			);
		}

		const transcription =
			await transcriptionsService.findById(transcriptionId);

		if (!transcription || transcription.userId !== userId) {
			return Response.json(
				{ error: "Transcription not found" },
				{ status: 404 },
			);
		}

		if (
			transcription.status !== TranscriptionStatus.COMPLETED ||
			!transcription.transcriptText
		) {
			return Response.json(
				{ error: "Transcription must be completed before translating" },
				{ status: 400 },
			);
		}

		if (transcription.summaryStatus !== SummaryStatus.COMPLETED) {
			return Response.json(
				{ error: "Summary must be completed before translating" },
				{ status: 400 },
			);
		}

		let translationId: string;
		try {
			translationId = await translationsService.create(
				transcriptionId,
				language,
			);
		} catch (insertError) {
			const msg = getErrorMessage(insertError);
			if (msg.includes("UNIQUE constraint")) {
				const existing =
					await translationsService.findByTranscriptionAndLanguage(
						transcriptionId,
						language,
					);
				if (existing) {
					return Response.json(
						{ translation: existing },
						{ status: 200 },
					);
				}
			}
			throw insertError;
		}

		await workflowService.requestTranslation(
			translationId,
			transcriptionId,
			language,
		);

		return Response.json(
			{
				status: "queued",
				translationId,
				transcriptionId,
				language,
			},
			{ status: 202 },
		);
	} catch (error) {
		logger.error("Failed to request translation", {
			userId,
			transcriptionId,
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to request translation" },
			{ status: 500 },
		);
	}
}
