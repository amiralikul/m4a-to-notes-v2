import { auth } from "@clerk/nextjs/server";
import { usersService } from "@/services";
import { PRICING_PLANS } from "@/lib/pricing";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

const PLAN_HIERARCHY: Record<string, number> = {
	free: 0,
	pro: 1,
	business: 2,
};

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { variantId, planKey } = (await request.json()) as {
			variantId?: string;
			planKey?: string;
		};

		if (!variantId) {
			return Response.json(
				{ error: "Variant ID is required" },
				{ status: 400 },
			);
		}

		const entitlements = await usersService.getWithDefaults(userId);

		let targetPlan = planKey;
		if (!targetPlan) {
			for (const [key, plan] of Object.entries(PRICING_PLANS)) {
				if (plan.monthlyVariantId === variantId || plan.yearlyVariantId === variantId) {
					targetPlan = key.toLowerCase();
					break;
				}
			}
		}

		if (!targetPlan || targetPlan === "unknown") {
			return Response.json(
				{ error: "Invalid variant ID or plan key" },
				{ status: 400 },
			);
		}

		const hasActiveSubscription = ["active", "trialing"].includes(
			entitlements.status || "",
		);
		const currentPlan = entitlements.plan || "free";
		const canUpgrade =
			(PLAN_HIERARCHY[targetPlan] ?? 0) >
			(PLAN_HIERARCHY[currentPlan] ?? 0);

		if (hasActiveSubscription && targetPlan === currentPlan) {
			return Response.json({
				valid: false,
				reason: "already_subscribed",
				message: `You already have an active ${currentPlan} subscription`,
				currentPlan,
				targetPlan,
				hasActiveSubscription,
			});
		}

		if (hasActiveSubscription && !canUpgrade) {
			return Response.json({
				valid: false,
				reason: "downgrade_not_allowed",
				message: `You cannot downgrade from ${currentPlan} to ${targetPlan}. Please cancel your current subscription first.`,
				currentPlan,
				targetPlan,
				hasActiveSubscription,
			});
		}

		const isUpgrade = hasActiveSubscription && canUpgrade;

		return Response.json({
			valid: true,
			reason: isUpgrade ? "valid_upgrade" : "valid_new_subscription",
			message: isUpgrade
				? `Valid upgrade from ${currentPlan} to ${targetPlan}`
				: `Valid new ${targetPlan} subscription`,
			currentPlan,
			targetPlan,
			hasActiveSubscription,
			isUpgrade,
		});
	} catch (error) {
		logger.error("Error validating purchase", {
			userId,
			error: getErrorMessage(error),
		});

		return Response.json(
			{
				valid: false,
				reason: "server_error",
				message: "Failed to validate purchase. Please try again.",
			},
			{ status: 500 },
		);
	}
}
