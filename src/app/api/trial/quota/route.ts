import { auth } from "@clerk/nextjs/server";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import {
	getUtcDayKey,
	resolveActorIdentity,
	TRIAL_DAILY_LIMIT,
} from "@/lib/trial-identity";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { actorsService, trialUsageService } from "@/services";

export async function GET() {
	const { userId } = await auth();
	let actorId: string | null = null;

	if (userId) {
		return Response.json(
			{
				limited: false,
				remaining: null,
				limit: null,
			},
			{
				headers: { "Cache-Control": "no-store" },
			},
		);
	}

	try {
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
					limited: true,
					remaining: 0,
					limit: TRIAL_DAILY_LIMIT,
				},
				{
					status: 429,
					headers: { "Cache-Control": "no-store" },
				},
			);
		}

		return Response.json(
			{
				limited: true,
				remaining,
				limit: TRIAL_DAILY_LIMIT,
			},
			{
				headers: { "Cache-Control": "no-store" },
			},
		);
	} catch (error) {
		logger.error("Failed to check trial quota", {
			actorId,
			error: getErrorMessage(error),
		});
		return Response.json(
			{
				error: "Failed to check trial quota",
				code: TRIAL_ERROR_CODES.QUOTA_CHECK_FAILED,
				limited: false,
				remaining: null,
				limit: TRIAL_DAILY_LIMIT,
			},
			{
				status: 500,
				headers: { "Cache-Control": "no-store" },
			},
		);
	}
}
