import { z } from "zod";
import { route } from "@/lib/route";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { billingSubscriptionsService } from "@/services";

export const POST = route({
	auth: "required",
	body: z.object({
		subscriptionId: z.string(),
		cancellationReason: z.string().optional(),
	}),
	handler: async ({ userId, body }) => {
		const isOwner = await billingSubscriptionsService.verifyOwnership(
			userId,
			body.subscriptionId,
			"lemonsqueezy",
		);

		if (!isOwner) throw new ForbiddenError();

		const apiKey = process.env.LEMONSQUEEZY_API_KEY;
		if (!apiKey) {
			throw new Error("LEMONSQUEEZY_API_KEY is required");
		}

		const response = await fetch(
			`https://api.lemonsqueezy.com/v1/subscriptions/${body.subscriptionId}`,
			{
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/vnd.api+json",
					Accept: "application/vnd.api+json",
				},
				body: JSON.stringify({
					data: {
						type: "subscriptions",
						id: body.subscriptionId,
						attributes: {
							cancelled: true,
						},
					},
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Lemon Squeezy API error: ${response.status} - ${errorText}`,
			);
		}

		const data = (await response.json()) as { data: unknown };

		logger.info("Subscription canceled", {
			subscriptionId: body.subscriptionId,
			reason: body.cancellationReason,
		});

		return {
			success: true,
			subscription: data.data,
		};
	},
});
