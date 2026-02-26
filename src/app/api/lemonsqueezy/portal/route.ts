import { z } from "zod";
import { route } from "@/lib/route";
import { ForbiddenError } from "@/lib/errors";
import { billingSubscriptionsService } from "@/services";

export const POST = route({
	auth: "required",
	body: z.object({ subscriptionId: z.string() }),
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

		return {
			portalUrl: data.data.attributes.urls.customer_portal,
		};
	},
});
