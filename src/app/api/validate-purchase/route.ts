import { z } from "zod";
import { route } from "@/lib/route";
import { ValidationError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { usersService } from "@/services";
import { PRICING_PLANS, findPlanKeyByVariantId } from "@/lib/pricing";
import { PLAN_HIERARCHY } from "@/lib/constants/plans";

export const POST = route({
	auth: "required",
	body: z.object({
		variantId: z.string(),
		planKey: z.string().optional(),
	}),
	handler: async ({ userId, body }) => {
		try {
			const entitlements = await usersService.getWithDefaults(userId);

			const providedPlanKey = body.planKey?.trim().toUpperCase();
			if (providedPlanKey && !(providedPlanKey in PRICING_PLANS)) {
				throw new ValidationError("Invalid variant ID or plan key");
			}
			const derivedPlanKey = findPlanKeyByVariantId(body.variantId);
			if (!derivedPlanKey) {
				throw new ValidationError("Invalid variant ID or plan key");
			}
			if (providedPlanKey && providedPlanKey !== derivedPlanKey) {
				throw new ValidationError("planKey does not match variantId");
			}

			const targetPlan = derivedPlanKey.toLowerCase();

			const hasActiveSubscription = ["active", "trialing"].includes(
				entitlements.status || "",
			);
			const currentPlan = entitlements.plan || "free";
			const canUpgrade =
				(PLAN_HIERARCHY[targetPlan] ?? 0) >
				(PLAN_HIERARCHY[currentPlan] ?? 0);

			if (hasActiveSubscription && targetPlan === currentPlan) {
				return {
					valid: false,
					reason: "already_subscribed",
					message: `You already have an active ${currentPlan} subscription`,
					currentPlan,
					targetPlan,
					hasActiveSubscription,
				};
			}

			if (hasActiveSubscription && !canUpgrade) {
				return {
					valid: false,
					reason: "downgrade_not_allowed",
					message: `You cannot downgrade from ${currentPlan} to ${targetPlan}. Please cancel your current subscription first.`,
					currentPlan,
					targetPlan,
					hasActiveSubscription,
				};
			}

			const isUpgrade = hasActiveSubscription && canUpgrade;

			return {
				valid: true,
				reason: isUpgrade ? "valid_upgrade" : "valid_new_subscription",
				message: isUpgrade
					? `Valid upgrade from ${currentPlan} to ${targetPlan}`
					: `Valid new ${targetPlan} subscription`,
				currentPlan,
				targetPlan,
				hasActiveSubscription,
				isUpgrade,
			};
		} catch (error) {
			if (error instanceof ValidationError) throw error;

			logger.error("Error validating purchase", {
				userId,
				error: getErrorMessage(error),
			});

			return Response.json(
				{
					valid: false,
					reason: "server_error",
					message:
						"Failed to validate purchase. Please try again.",
				},
				{ status: 500 },
			);
		}
	},
});
