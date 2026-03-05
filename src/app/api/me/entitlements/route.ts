import { route } from "@/lib/route";
import { usersService } from "@/services";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const GET = route({
	auth: "required",
	handler: async ({ userId }) => {
		try {
			const entitlements = await usersService.getWithDefaults(userId);

			return {
				entitlements: {
					userId: entitlements.userId,
					plan: entitlements.plan,
					status: entitlements.status,
					expiresAt: entitlements.expiresAt,
					features: entitlements.features,
					limits: entitlements.limits,
					meta: entitlements.meta || {},
					updatedAt: entitlements.updatedAt,
				},
			};
		} catch (error) {
			logger.error("Error fetching user entitlements", {
				userId,
				error: getErrorMessage(error),
			});

			return Response.json(
				{
					entitlements: {
						userId,
						plan: "free",
						status: "none",
						expiresAt: null,
						features: [],
						limits: {},
						meta: {},
						updatedAt: new Date().toISOString(),
					},
				},
				{ status: 500 },
			);
		}
	},
});
