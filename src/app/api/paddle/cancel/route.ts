import { auth } from "@clerk/nextjs/server";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { subscriptionId, cancellationReason } =
			(await request.json()) as {
				subscriptionId?: string;
				cancellationReason?: string;
			};

		if (!subscriptionId) {
			return Response.json(
				{ error: "Subscription ID is required" },
				{ status: 400 },
			);
		}

		const paddleApiKey = process.env.PADDLE_API_KEY;
		const paddleEnvironment =
			process.env.PADDLE_ENVIRONMENT || "sandbox";

		if (!paddleApiKey) {
			throw new Error("PADDLE_API_KEY is required");
		}

		const baseUrl =
			paddleEnvironment === "production"
				? "https://api.paddle.com"
				: "https://sandbox-api.paddle.com";

		const body: Record<string, string> = {
			effective_from: "next_billing_period",
		};
		if (cancellationReason) {
			body.cancellation_reason = cancellationReason;
		}

		const response = await fetch(
			`${baseUrl}/subscriptions/${subscriptionId}/cancel`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${paddleApiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Paddle API error: ${response.status} - ${errorText}`,
			);
		}

		const data = (await response.json()) as { data: unknown };

		logger.info("Subscription canceled", {
			subscriptionId,
			reason: cancellationReason,
		});

		return Response.json({
			success: true,
			subscription: data.data,
		});
	} catch (error) {
		logger.error("Failed to cancel subscription", {
			error: getErrorMessage(error),
		});

		return Response.json(
			{
				error: "Failed to cancel subscription",
				details: getErrorMessage(error),
			},
			{ status: 500 },
		);
	}
}
