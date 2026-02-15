import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { BillingSubscriptionsService } from "@/services/billing-subscriptions";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { subscriptionId } = (await request.json()) as {
			subscriptionId?: string;
		};

		if (!subscriptionId) {
			return Response.json(
				{ error: "Subscription ID is required" },
				{ status: 400 },
			);
		}

		// IDOR prevention: verify the subscription belongs to this user
		const billingService = new BillingSubscriptionsService(db, logger);
		const isOwner = await billingService.verifyOwnership(
			userId,
			subscriptionId,
			"lemonsqueezy",
		);

		if (!isOwner) {
			return Response.json(
				{ error: "Forbidden" },
				{ status: 403 },
			);
		}

		const apiKey = process.env.LEMONSQUEEZY_API_KEY;
		if (!apiKey) {
			throw new Error("LEMONSQUEEZY_API_KEY is required");
		}

		// Fetch fresh portal URL (expires after 24 hours, never cache)
		const response = await fetch(
			`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					Accept: "application/vnd.api+json",
				},
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Lemon Squeezy API error: ${response.status} - ${errorText}`,
			);
		}

		const data = (await response.json()) as {
			data: {
				attributes: {
					urls: { customer_portal: string };
				};
			};
		};

		return Response.json({
			portalUrl: data.data.attributes.urls.customer_portal,
		});
	} catch (error) {
		logger.error("Failed to generate customer portal URL", {
			error: getErrorMessage(error),
		});

		return Response.json(
			{ error: "Failed to generate portal URL" },
			{ status: 500 },
		);
	}
}
