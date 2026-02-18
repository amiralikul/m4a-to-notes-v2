import { auth } from "@clerk/nextjs/server";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import {
	getUtcDayKey,
	resolveActorIdentity,
	TRIAL_DAILY_LIMIT,
} from "@/lib/trial-identity";
import { actorsService, trialUsageService } from "@/services";

export async function GET() {
	const { userId } = await auth();

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

	const { actorId } = await resolveActorIdentity();
	await actorsService.ensureActor(actorId);
	const remaining = await trialUsageService.getRemaining(actorId, getUtcDayKey());

	if (remaining <= 0) {
		return Response.json(
			{
				error: "Daily free limit reached (3 files/day).",
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
}
