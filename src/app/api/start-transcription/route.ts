import { auth } from "@clerk/nextjs/server";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import {
	getUtcDayKey,
	resolveActorIdentity,
	TRIAL_DAILY_LIMIT,
} from "@/lib/trial-identity";
import {
	actorsService,
	transcriptionsService,
	trialUsageService,
	workflowService,
} from "@/services";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
	const { userId } = await auth();
	let actorId: string | null = null;
	let blobUrl: string;
	let filename: string;

	try {
		({ blobUrl, filename } = (await request.json()) as {
			blobUrl: string;
			filename: string;
		});
	} catch {
		return Response.json(
			{ error: "Invalid JSON", code: TRIAL_ERROR_CODES.INVALID_REQUEST },
			{ status: 400 },
		);
	}

	try {
		if (!blobUrl || !filename) {
			return Response.json(
				{ error: "blobUrl and filename are required" },
				{ status: 400 },
			);
		}

		if (userId) {
			actorId = await actorsService.getOrCreateForUser(userId);
		} else {
			const identity = await resolveActorIdentity();
			actorId = identity.actorId;
			await actorsService.ensureActor(actorId);
			const consumed = await trialUsageService.consumeSlot(
				actorId,
				getUtcDayKey(),
			);
			if (!consumed) {
				return Response.json(
					{
						error: `Daily free limit reached (${TRIAL_DAILY_LIMIT} files/day).`,
						code: TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED,
					},
					{ status: 429 },
				);
			}
		}

		const transcriptionId = await transcriptionsService.create({
			audioKey: blobUrl,
			filename,
			source: "web",
			userId: userId ?? undefined,
			ownerId: actorId ?? undefined,
			userMetadata: userId ? { userId, actorId } : { actorId },
		});

		await workflowService.startTranscription(transcriptionId);

		logger.info("Transcription started", {
			transcriptionId,
			userId,
			actorId,
			filename,
		});

		return Response.json(
			{ transcriptionId, status: "pending" },
			{ status: 201 },
		);
	} catch (error) {
		logger.error("Failed to start transcription", {
			userId,
			actorId,
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to start transcription" },
			{ status: 500 },
		);
	}
}
