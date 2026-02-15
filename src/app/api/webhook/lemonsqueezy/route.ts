import crypto from "node:crypto";
import { db } from "@/db";
import { LemonSqueezySyncService } from "@/services/lemonsqueezy-sync";
import { BillingSubscriptionsService } from "@/services/billing-subscriptions";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { LemonSqueezyWebhook } from "@/lib/types";
import { WEBHOOK_EVENT_TYPES } from "@/lib/constants/plans";

function verifySignature(
	body: string,
	signature: string,
	secret: string,
): boolean {
	if (!signature || !secret) return false;

	try {
		const hmac = crypto.createHmac("sha256", secret);
		hmac.update(body);
		const digest = hmac.digest("hex");

		if (signature.length !== digest.length) return false;
		return crypto.timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(digest),
		);
	} catch {
		return false;
	}
}

const HANDLED_EVENTS = [
	WEBHOOK_EVENT_TYPES.SUBSCRIPTION_CREATED,
	WEBHOOK_EVENT_TYPES.SUBSCRIPTION_UPDATED,
	WEBHOOK_EVENT_TYPES.SUBSCRIPTION_CANCELLED,
	WEBHOOK_EVENT_TYPES.SUBSCRIPTION_EXPIRED,
];

export async function POST(request: Request) {
	try {
		const body = await request.text();
		const signature = request.headers.get("x-signature") || "";

		logger.info("Received Lemon Squeezy webhook", {
			hasSignature: !!signature,
		});

		const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
		if (!webhookSecret) {
			logger.error("LEMONSQUEEZY_WEBHOOK_SECRET not configured");
			return Response.json(
				{ error: "Webhook secret not configured" },
				{ status: 500 },
			);
		}

		if (!verifySignature(body, signature, webhookSecret)) {
			logger.warn("Invalid webhook signature");
			return Response.json({ error: "Invalid signature" }, { status: 401 });
		}

		const event = JSON.parse(body) as LemonSqueezyWebhook;
		const eventName = event.meta.event_name;
		const subscriptionId = event.data.id;

		logger.info("Processing webhook event", {
			eventName,
			subscriptionId,
		});

		let clerkUserId = event.meta.custom_data?.clerkUserId;

		const billingService = new BillingSubscriptionsService(db, logger);

		if (!clerkUserId) {
			clerkUserId =
				(await billingService.getUserIdBySubscriptionId(
					"lemonsqueezy",
					subscriptionId,
				)) ?? undefined;
		}

		if (!clerkUserId) {
			logger.error("Cannot resolve user for subscription event", {
				eventName,
				subscriptionId,
			});
			return Response.json({ received: true });
		}

		// Upsert billing subscription mapping for future lookups
		await billingService.upsert({
			id: `ls_${subscriptionId}`,
			provider: "lemonsqueezy",
			subscriptionId,
			customerId: String(event.data.attributes.customer_id),
			userId: clerkUserId,
			status: event.data.attributes.status,
			currentPeriodEnd:
				event.data.attributes.renews_at || event.data.attributes.ends_at,
		});

		if ((HANDLED_EVENTS as readonly string[]).includes(eventName)) {
			const syncService = new LemonSqueezySyncService(db, logger);
			await syncService.syncSubscription(
				clerkUserId,
				subscriptionId,
				eventName,
			);

			logger.info("Webhook processed with canonical sync", {
				subscriptionId,
				eventName,
			});
		}

		return Response.json({ received: true });
	} catch (error) {
		logger.error("Webhook processing failed", {
			error: getErrorMessage(error),
		});

		return Response.json(
			{ error: "Processing failed" },
			{ status: 500 },
		);
	}
}
