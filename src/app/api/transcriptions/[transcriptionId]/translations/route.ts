import { z } from "zod";
import { route } from "@/lib/route";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/errors";
import {
	transcriptionsService,
	translationsService,
	workflowService,
} from "@/services";
import {
	TranscriptionStatus,
	SummaryStatus,
} from "@/services/transcriptions";
import { isValidLanguage } from "@/lib/constants/languages";

export const GET = route({
	auth: "required",
	params: z.object({ transcriptionId: z.string() }),
	handler: async ({ userId, params }) => {
		const transcription = await transcriptionsService.findById(
			params.transcriptionId,
		);

		if (!transcription || transcription.userId !== userId) {
			throw new NotFoundError("Transcription not found");
		}

		const translationsList =
			await translationsService.findByTranscriptionId(
				params.transcriptionId,
			);

		return { translations: translationsList };
	},
});

export const POST = route({
	auth: "required",
	params: z.object({ transcriptionId: z.string() }),
	body: z.object({ language: z.string() }),
	handler: async ({ userId, params, body }) => {
		if (!isValidLanguage(body.language)) {
			throw new ValidationError("Invalid or unsupported language code");
		}

		const transcription = await transcriptionsService.findById(
			params.transcriptionId,
		);

		if (!transcription || transcription.userId !== userId) {
			throw new NotFoundError("Transcription not found");
		}

		if (
			transcription.status !== TranscriptionStatus.COMPLETED ||
			!transcription.transcriptText
		) {
			throw new ValidationError(
				"Transcription must be completed before translating",
			);
		}

		if (transcription.summaryStatus !== SummaryStatus.COMPLETED) {
			throw new ValidationError(
				"Summary must be completed before translating",
			);
		}

		let translationId: string;
		try {
			translationId = await translationsService.create(
				params.transcriptionId,
				body.language,
			);
		} catch (insertError) {
			const msg = getErrorMessage(insertError);
			if (msg.includes("UNIQUE constraint")) {
				const existing =
					await translationsService.findByTranscriptionAndLanguage(
						params.transcriptionId,
						body.language,
					);
				if (existing) {
					return { translation: existing };
				}
			}
			throw insertError;
		}

		await workflowService.requestTranslation(
			translationId,
			params.transcriptionId,
			body.language,
		);

		return Response.json(
			{
				status: "queued",
				translationId,
				transcriptionId: params.transcriptionId,
				language: body.language,
			},
			{ status: 202 },
		);
	},
});
