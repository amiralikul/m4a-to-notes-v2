import { route } from "@/lib/route";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import {
	getUtcDayKey,
	TRIAL_DAILY_LIMIT,
} from "@/lib/trial-identity";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { trialUsageService } from "@/services";

export const GET = route({
	auth: "optional",
	handler: async ({ userId, actorId }) => {
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
			const remaining = await trialUsageService.getRemaining(
				actorId!,
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
	},
});
