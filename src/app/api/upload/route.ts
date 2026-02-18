import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { BlobServiceRateLimited } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import { AUDIO_LIMITS } from "@/lib/validation";
import {
	getUtcDayKey,
	resolveActorIdentity,
	TRIAL_DAILY_LIMIT,
} from "@/lib/trial-identity";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { actorsService, trialUsageService } from "@/services";

export async function POST(request: Request) {
	const { userId } = await auth();
	let actorId: string | null = null;

	try {
		if (!userId) {
			const identity = await resolveActorIdentity();
			actorId = identity.actorId;
			await actorsService.ensureActor(actorId);
			const remaining = await trialUsageService.getRemaining(
				actorId,
				getUtcDayKey(),
			);
			if (remaining <= 0) {
				return Response.json(
					{
						error: `Daily free limit reached (${TRIAL_DAILY_LIMIT} files/day).`,
						code: TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED,
					},
					{ status: 429 },
				);
			}
		}

		const body = (await request.json()) as HandleUploadBody;
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
		if (error instanceof SyntaxError) {
			return Response.json(
				{
					error: "Invalid JSON",
					code: TRIAL_ERROR_CODES.INVALID_REQUEST,
				},
				{ status: 400 },
			);
		}
		if (error instanceof BlobServiceRateLimited) {
			return Response.json(
				{
					error: `Daily free limit reached (${TRIAL_DAILY_LIMIT} files/day).`,
					code: "rate_limited",
				},
				{ status: 429 },
			);
		}

		logger.error("Failed to generate upload token", {
			userId,
			actorId,
			error: getErrorMessage(error),
		});

		return Response.json(
			{
				error: error instanceof Error ? error.message : "Upload failed",
				code: TRIAL_ERROR_CODES.UPLOAD_FAILED,
			},
			{ status: 500 },
		);
	}
}
