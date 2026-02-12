import { auth } from "@clerk/nextjs/server";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { customerId } = (await request.json()) as {
			customerId?: string;
		};

		if (!customerId) {
			return Response.json(
				{ error: "Customer ID is required" },
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

		const response = await fetch(
			`${baseUrl}/customers/${customerId}/portal-sessions`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${paddleApiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Paddle API error: ${response.status} - ${errorText}`,
			);
		}

		const data = (await response.json()) as {
			data?: { urls?: { general?: { overview?: string } } };
		};

		return Response.json({
			portalUrl: data.data?.urls?.general?.overview,
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
