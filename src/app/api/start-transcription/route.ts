import { auth } from "@clerk/nextjs/server";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import { getUtcDayKey, resolveActorIdentity } from "@/lib/trial-identity";
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

	try {
		const { blobUrl, filename } = (await request.json()) as {
			blobUrl: string;
			filename: string;
		};

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
						error: "Daily free limit reached (3 files/day).",
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
