import { z } from "zod";
import { route } from "@/lib/route";
import { ForbiddenError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { billingSubscriptionsService } from "@/services";
import { env } from "@/env";

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

		const apiKey = env.LEMONSQUEEZY_API_KEY;
		if (!apiKey) {
			throw new Error("LEMONSQUEEZY_API_KEY is required");
		}

		let response: Response;
		try {
			response = await fetch(
				`https://api.lemonsqueezy.com/v1/subscriptions/${body.subscriptionId}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						Accept: "application/vnd.api+json",
					},
					signal: AbortSignal.timeout(10_000),
				},
			);
		} catch (error) {
			if (
				error instanceof Error &&
				(error.name === "AbortError" || error.name === "TimeoutError")
			) {
				logger.error("Lemon Squeezy portal request timed out", {
					subscriptionId: body.subscriptionId,
				});
				return Response.json({ error: "Upstream timeout" }, { status: 504 });
			}
			throw error;
		}

		if (!response.ok) {
			const errorText = await response.text();
			logger.error("Lemon Squeezy portal request failed", {
				subscriptionId: body.subscriptionId,
				status: response.status,
				error: errorText,
			});
			return Response.json(
				{ error: "Upstream service error" },
				{ status: 502 },
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
