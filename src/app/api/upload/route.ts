import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import { AUDIO_LIMITS } from "@/lib/validation";
import { getUtcDayKey, resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService, trialUsageService } from "@/services";

export async function POST(request: Request) {
	const { userId } = await auth();

	if (!userId) {
		const { actorId } = await resolveActorIdentity();
		await actorsService.ensureActor(actorId);
		const remaining = await trialUsageService.getRemaining(
			actorId,
			getUtcDayKey(),
		);
		if (remaining <= 0) {
			return Response.json(
				{
					error: "Daily free limit reached (3 files/day).",
					code: TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED,
				},
				{ status: 429 },
			);
		}
	}

	const body = (await request.json()) as HandleUploadBody;

	try {
		const jsonResponse = await handleUpload({
			body,
			request,
			token:
				process.env.BLOB_READ_WRITE_TOKEN ||
				process.env.M4A_TO_NOTES_READ_WRITE_TOKEN,
			onBeforeGenerateToken: async () => {
				return {
					allowedContentTypes: [...AUDIO_LIMITS.VALID_MIME_TYPES],
					maximumSizeInBytes: AUDIO_LIMITS.MAX_FILE_SIZE,
					addRandomSuffix: true,
				};
			},
			onUploadCompleted: async () => {
				// Note: this callback does not work on localhost
			},
		});

		return Response.json(jsonResponse);
	} catch (error) {
		return Response.json(
			{ error: error instanceof Error ? error.message : "Upload failed" },
			{ status: 400 },
		);
	}
}
