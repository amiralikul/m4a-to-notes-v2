import { z } from "zod";
import { route } from "@/lib/route";
import { NotFoundError } from "@/lib/errors";
import { transcriptionsService, translationsService } from "@/services";

const paramsSchema = z.object({
	transcriptionId: z.string(),
	language: z.string(),
});

export const GET = route({
	auth: "required",
	params: paramsSchema,
	handler: async ({ userId, params }) => {
		const transcription = await transcriptionsService.findById(
			params.transcriptionId,
		);

		if (!transcription || transcription.userId !== userId) {
			throw new NotFoundError("Transcription not found");
		}

		const translation =
			await translationsService.findByTranscriptionAndLanguage(
				params.transcriptionId,
				params.language,
			);

		if (!translation) {
			throw new NotFoundError("Translation not found");
		}

		return { translation };
	},
});

export const DELETE = route({
	auth: "required",
	params: paramsSchema,
	handler: async ({ userId, params }) => {
		const transcription = await transcriptionsService.findById(
			params.transcriptionId,
		);

		if (!transcription || transcription.userId !== userId) {
			throw new NotFoundError("Transcription not found");
		}

		const translation =
			await translationsService.findByTranscriptionAndLanguage(
				params.transcriptionId,
				params.language,
			);

		if (!translation) {
			throw new NotFoundError("Translation not found");
		}

		await translationsService.delete(translation.id);

		return new Response(null, { status: 204 });
	},
});
