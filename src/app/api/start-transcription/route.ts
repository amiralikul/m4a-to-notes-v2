import { z } from "zod";
import { route } from "@/lib/route";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import {
	getUtcDayKey,
	TRIAL_DAILY_LIMIT,
} from "@/lib/trial-identity";
import {
	actorsService,
	transcriptionsService,
	trialUsageService,
	workflowService,
} from "@/services";
import { logger } from "@/lib/logger";

export const POST = route({
	auth: "optional",
	body: z.object({
		blobUrl: z.string(),
		filename: z.string(),
		enableDiarization: z.boolean().optional().default(false),
	}),
	handler: async ({ userId, actorId, body }) => {
		let resolvedActorId: string | null = actorId;

		if (userId) {
			resolvedActorId = await actorsService.getOrCreateForUser(userId);
		} else if (resolvedActorId) {
			const consumed = await trialUsageService.consumeSlot(
				resolvedActorId,
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
			audioKey: body.blobUrl,
			filename: body.filename,
			source: "web",
			userId: userId ?? undefined,
			ownerId: resolvedActorId ?? undefined,
			userMetadata: userId
				? { userId, actorId: resolvedActorId }
				: { actorId: resolvedActorId },
			enableDiarization: body.enableDiarization,
		});

		await workflowService.startTranscription(transcriptionId);

		logger.info("Transcription started", {
			transcriptionId,
			userId,
			actorId: resolvedActorId,
			filename: body.filename,
		});

		return Response.json(
			{ transcriptionId, status: "pending" },
			{ status: 201 },
		);
	},
});
