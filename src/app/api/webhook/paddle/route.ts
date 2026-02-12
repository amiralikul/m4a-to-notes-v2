import { db } from "@/db";
import { PaddleSyncService } from "@/services/paddle-sync";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

async function verifyWebhookSignature(
	body: string,
	signature: string,
	secret: string,
): Promise<boolean> {
	if (!signature || !secret) return false;

	try {
		const parts = signature.split(";");
		let ts: string | undefined;
		let h1: string | undefined;

		for (const part of parts) {
			const [key, value] = part.split("=");
			if (key === "ts") ts = value;
			if (key === "h1") h1 = value;
		}

		if (!ts || !h1) return false;

		const payload = `${ts}:${body}`;
		const encoder = new TextEncoder();
		const keyData = encoder.encode(secret);
		const messageData = encoder.encode(payload);

		const key = await crypto.subtle.importKey(
			"raw",
			keyData,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);

		const signatureBuffer = await crypto.subtle.sign(
			"HMAC",
			key,
			messageData,
		);
		const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		return h1 === expectedSignature;
	} catch {
		return false;
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.text();
		const signature = request.headers.get("paddle-signature") || "";

		logger.info("Received Paddle webhook", {
			hasSignature: !!signature,
		});

		const webhookSecret =
			process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET;
		if (
			webhookSecret &&
			!(await verifyWebhookSignature(body, signature, webhookSecret))
		) {
			logger.warn("Invalid webhook signature");
			return Response.json({ error: "Invalid signature" }, { status: 401 });
		}

		const event = JSON.parse(body) as {
			event_type: string;
			event_id?: string;
			data?: { subscriptionId?: string };
		};

		logger.info("Processing webhook event", {
			eventType: event.event_type,
			eventId: event.event_id,
		});

		const subscriptionId = event.data?.subscriptionId;

		if (
			event.event_type === "transaction.completed" &&
			subscriptionId
		) {
			const syncService = new PaddleSyncService(db, logger);
			await syncService.syncPaddleDataToKV(
				subscriptionId,
				event.event_type,
			);

			logger.info("Webhook processed with canonical sync", {
				subscriptionId,
				eventType: event.event_type,
			});
		}

		return Response.json({ received: true });
	} catch (error) {
		logger.error("Webhook processing failed", {
			error: getErrorMessage(error),
		});

		return Response.json(
			{ received: true, error: "Processing failed but acknowledged" },
			{ status: 200 },
		);
	}
}
