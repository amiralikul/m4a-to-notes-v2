import { z } from "zod";
import { route } from "@/lib/route";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { usersService } from "@/services";
import { findPlanKeyByVariantId } from "@/lib/pricing";
import { PLAN_HIERARCHY } from "@/lib/constants/plans";
import { getServerSession } from "@/lib/auth-server";
import { env } from "@/env";

export const POST = route({
	auth: "required",
	body: z.object({
		variantId: z.string(),
		planKey: z.string().optional(),
	}),
	handler: async ({ userId, body }) => {
		const apiKey = env.LEMONSQUEEZY_API_KEY;
		const storeId = env.LEMONSQUEEZY_STORE_ID;

		if (!apiKey || !storeId) {
			throw new Error(
				"LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID are required",
			);
		}

		const entitlements = await usersService.getWithDefaults(userId);
		const derivedPlanKey = findPlanKeyByVariantId(body.variantId);
		if (!derivedPlanKey) {
			throw new ValidationError("Unknown plan/variant");
		}
		const targetPlan = derivedPlanKey.toLowerCase();
		if (
			body.planKey &&
			body.planKey.toLowerCase() !== targetPlan
		) {
			throw new ValidationError(
				"Provided planKey does not match selected variant",
			);
		}

		const hasActive = ["active", "trialing"].includes(
			entitlements.status || "",
		);
		const currentPlan = entitlements.plan || "free";

		if (hasActive && targetPlan === currentPlan) {
			throw new ValidationError("You already have this plan");
		}

		if (
			hasActive &&
			(PLAN_HIERARCHY[targetPlan] ?? 0) <=
				(PLAN_HIERARCHY[currentPlan] ?? 0)
		) {
			throw new ValidationError(
				"Cannot downgrade. Cancel current subscription first.",
			);
		}

		const session = await getServerSession();
		const userEmail = session?.user.email;

		const checkoutData: Record<string, unknown> = {
			custom: { userId },
		};
		if (userEmail) {
			checkoutData.email = userEmail;
		}

		const response = await fetch(
			"https://api.lemonsqueezy.com/v1/checkouts",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/vnd.api+json",
					Accept: "application/vnd.api+json",
				},
				body: JSON.stringify({
					data: {
						type: "checkouts",
						attributes: {
							checkout_data: checkoutData,
							checkout_options: {
								embed: true,
							},
							...(env.NEXT_PUBLIC_APP_URL
								? {
										product_options: {
											redirect_url: `${env.NEXT_PUBLIC_APP_URL}/checkout/success`,
										},
									}
								: {}),
						},
						relationships: {
							store: {
								data: {
									type: "stores",
									id: storeId,
								},
							},
							variant: {
								data: {
									type: "variants",
									id: body.variantId,
								},
							},
						},
					},
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			logger.error("Lemon Squeezy checkout API error", {
				status: response.status,
				error: errorText,
				variantId: body.variantId,
				storeId,
			});
			return Response.json(
				{ error: "Upstream service error" },
				{ status: 502 },
			);
		}

		const data = (await response.json()) as {
			data: { attributes: { url: string } };
		};

		return {
			checkoutUrl: data.data.attributes.url,
		};
	},
});
