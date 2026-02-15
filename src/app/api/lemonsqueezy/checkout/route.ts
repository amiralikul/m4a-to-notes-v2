import { auth, currentUser } from "@clerk/nextjs/server";
import { usersService } from "@/services";
import { PRICING_PLANS } from "@/lib/pricing";
import { PLAN_HIERARCHY } from "@/lib/constants/plans";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

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

		const apiKey = process.env.LEMONSQUEEZY_API_KEY;
		const storeId = process.env.LEMONSQUEEZY_STORE_ID;

		if (!apiKey || !storeId) {
			throw new Error(
				"LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID are required",
			);
		}

		// Pre-purchase validation
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

			if (!targetPlan) {
			return Response.json(
				{ error: "Unknown plan/variant" },
				{ status: 400 },
			);
		}

		const hasActive = ["active", "trialing"].includes(
			entitlements.status || "",
		);
		const currentPlan = entitlements.plan || "free";

		if (hasActive && targetPlan === currentPlan) {
			return Response.json(
				{ error: "You already have this plan" },
				{ status: 400 },
			);
		}

		if (
			hasActive &&
			(PLAN_HIERARCHY[targetPlan] ?? 0) <=
				(PLAN_HIERARCHY[currentPlan] ?? 0)
		) {
			return Response.json(
				{ error: "Cannot downgrade. Cancel current subscription first." },
				{ status: 400 },
			);
		}

		const user = await currentUser();
		const userEmail = user?.primaryEmailAddress?.emailAddress;

		const checkoutData: Record<string, unknown> = {
			custom: { clerkUserId: userId },
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
							...(process.env.NEXT_PUBLIC_APP_URL
							? {
									product_options: {
										redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
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
									id: variantId,
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
				variantId,
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

		return Response.json({
			checkoutUrl: data.data.attributes.url,
		});
	} catch (error) {
		logger.error("Failed to create checkout", {
			userId,
			error: getErrorMessage(error),
		});

		return Response.json(
			{ error: "Failed to create checkout" },
			{ status: 500 },
		);
	}
}
