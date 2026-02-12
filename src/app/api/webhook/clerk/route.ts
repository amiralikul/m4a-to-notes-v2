import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/errors";

export async function POST(request: Request) {
	try {
		const body = await request.text();
		const event = JSON.parse(body) as {
			type: string;
			data?: { id?: string };
		};

		logger.info("Received Clerk webhook", {
			eventType: event.type,
		});

		// TODO: Add Svix signature verification
		// TODO: Handle user.created, user.deleted events

		return Response.json({ received: true });
	} catch (error) {
		logger.error("Clerk webhook processing failed", {
			error: getErrorMessage(error),
		});
		return Response.json({ received: true }, { status: 200 });
	}
}
