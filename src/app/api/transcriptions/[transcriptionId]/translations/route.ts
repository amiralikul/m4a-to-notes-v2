import { z } from "zod";
import { route } from "@/lib/route";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
	transcriptionsService,
	translationsService,
	workflowService,
} from "@/services";
import {
	TranscriptionStatus,
	SummaryStatus,
} from "@/services/transcriptions";
import { TranslationStatus } from "@/services/translations";
import { isValidLanguage } from "@/lib/constants/languages";

function getErrorCode(error: unknown): string | null {
	if (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof (error as { code?: unknown }).code === "string"
	) {
		return (error as { code: string }).code;
	}

	return null;
}

export const GET = route({
	auth: "required",
	params: z.object({ transcriptionId: z.string() }),
	handler: async ({ userId, params }) => {
		const transcription = await transcriptionsService.findByIdForOwner(
			params.transcriptionId,
			{ userId, actorId: null },
		);

		if (!transcription) {
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

		const transcription = await transcriptionsService.findByIdForOwner(
			params.transcriptionId,
			{ userId, actorId: null },
		);

		if (!transcription) {
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
			const errorCode = getErrorCode(insertError);
			if (errorCode?.startsWith("SQLITE_CONSTRAINT")) {
				const existing =
					await translationsService.findByTranscriptionAndLanguage(
						params.transcriptionId,
						body.language,
					);
				if (existing) {
					if (
						existing.status === TranslationStatus.PENDING ||
						existing.status === TranslationStatus.PROCESSING ||
						existing.status === TranslationStatus.COMPLETED
					) {
						return { translation: existing };
					}

					if (existing.status === TranslationStatus.FAILED) {
						await translationsService.resetForRetry(existing.id);
					}

					translationId = existing.id;
				} else {
					throw insertError;
				}
			} else {
				throw insertError;
			}
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
