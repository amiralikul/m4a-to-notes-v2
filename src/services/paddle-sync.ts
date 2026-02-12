import {
	SUBSCRIPTION_PLANS,
	SUBSCRIPTION_STATUS,
	SUBSCRIPTION_PROVIDERS,
	mapPaddleStatus,
	mapPaddlePriceToPlan,
	getPlanHierarchyValue,
} from "@/lib/constants/plans";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";
import { UsersService } from "./users";

interface CanonicalSubscription {
	id: string;
	customer_id: string;
	status: string;
	items?: Array<{
		name?: string;
		price?: {
			id?: string;
			unit_price?: { amount?: number };
		};
	}>;
	currency_code?: string;
	current_billing_period?: { ends_at?: string };
	scheduled_change?: {
		action: string;
		effective_at?: string;
		resume_at?: string;
	};
	canceled_at?: string;
}

interface EntitlementsMapping {
	plan: string;
	status: string;
	provider: string;
	meta: {
		subscriptionId: string;
		customerId: string;
		currency: string;
		name: string;
		priceId: string;
		unitPrice?: number;
		periodEnd?: string;
		scheduledChange?: {
			action: string;
			effectiveAt?: string;
			resumeAt?: string;
		};
		canceledAt?: string;
	};
	lastUpdated: string;
	source: string;
}

export class PaddleSyncService {
	private paddleApiKey: string;
	private paddleEnvironment: string;
	private businessPriceId: string;
	private logger: Logger;
	private users: UsersService;

	constructor(
		// biome-ignore lint: needed for generic DB type
		database: any,
		logger: Logger,
	) {
		this.paddleApiKey = process.env.PADDLE_API_KEY || "";
		this.paddleEnvironment = process.env.PADDLE_ENVIRONMENT || "sandbox";
		this.businessPriceId = process.env.BUSINESS_PRICE_ID || "";
		this.logger = logger;
		this.users = new UsersService(database, logger);

		if (!this.paddleApiKey) {
			throw new Error("PADDLE_API_KEY environment variable is required");
		}
	}

	async fetchCanonicalSubscription(
		subscriptionId: string,
	): Promise<CanonicalSubscription> {
		const baseUrl =
			this.paddleEnvironment === "production"
				? "https://api.paddle.com"
				: "https://sandbox-api.paddle.com";

		this.logger.info("Fetching canonical subscription from Paddle API", {
			subscriptionId,
			environment: this.paddleEnvironment,
		});

		const response = await fetch(
			`${baseUrl}/subscriptions/${subscriptionId}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.paddleApiKey}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			this.logger.error("Failed to fetch canonical subscription", {
				subscriptionId,
				status: response.status,
				error: errorText,
			});
			throw new Error(
				`Failed to fetch subscription ${subscriptionId}: ${response.status} - ${errorText}`,
			);
		}

		const data = (await response.json()) as {
			data: CanonicalSubscription;
		};
		return data.data;
	}

	async syncPaddleDataToKV(
		subscriptionId: string,
		eventType: string,
		_context: Record<string, unknown> = {},
	) {
		try {
			const canonicalSubscription =
				await this.fetchCanonicalSubscription(subscriptionId);

			this.logger.info("Fetched canonical subscription state", {
				subscriptionId,
				eventType,
				status: canonicalSubscription.status,
				customerId: canonicalSubscription.customer_id,
			});

			await this.updateEntitlements(canonicalSubscription);
		} catch (error: unknown) {
			this.logger.error("Canonical sync failed", {
				subscriptionId,
				eventType,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async updateEntitlements(
		canonicalSubscription: CanonicalSubscription,
	): Promise<void> {
		const customerId = canonicalSubscription.customer_id;
		const subscriptionId = canonicalSubscription.id;

		const currentEntitlements = await this.users.get(customerId);
		const expectedEntitlements =
			this.mapPaddleToEntitlements(canonicalSubscription);

		const saved = await this.users.set(customerId, {
			plan: expectedEntitlements.plan,
			status: expectedEntitlements.status,
			expiresAt: expectedEntitlements?.meta?.periodEnd,
			features: currentEntitlements?.features || [],
			limits: currentEntitlements?.limits || {},
		});

		this.logger.info("Entitlements updated from canonical state", {
			customerId,
			subscriptionId,
			plan: saved.plan,
			status: saved.status,
		});
	}

	mapPaddleToEntitlements(
		subscription: CanonicalSubscription,
	): EntitlementsMapping {
		let plan: string = SUBSCRIPTION_PLANS.FREE;
		let status: string = SUBSCRIPTION_STATUS.NONE;

		status = mapPaddleStatus(subscription.status);

		if (subscription.items && subscription.items.length > 0) {
			const priceId = subscription.items[0].price?.id || "";
			plan = mapPaddlePriceToPlan(priceId, this.businessPriceId || "");
		}

		if (status === SUBSCRIPTION_STATUS.CANCELED) {
			plan = SUBSCRIPTION_PLANS.FREE;
		}

		const meta: EntitlementsMapping["meta"] = {
			subscriptionId: subscription.id,
			customerId: subscription.customer_id,
			currency: subscription.currency_code || "USD",
			name: subscription.items?.[0]?.name || "Unknown",
			priceId: subscription.items?.[0]?.price?.id || "Unknown",
		};

		if (subscription.items?.[0]?.price) {
			meta.unitPrice = subscription.items[0].price?.unit_price?.amount;
		}

		if (subscription.current_billing_period?.ends_at) {
			meta.periodEnd = subscription.current_billing_period.ends_at;
		}

		if (subscription.scheduled_change) {
			meta.scheduledChange = {
				action: subscription.scheduled_change.action,
				effectiveAt: subscription.scheduled_change.effective_at,
				resumeAt: subscription.scheduled_change.resume_at,
			};
		}

		if (subscription.canceled_at) {
			meta.canceledAt = subscription.canceled_at;
		}

		return {
			plan,
			status,
			provider: SUBSCRIPTION_PROVIDERS.PADDLE,
			meta,
			lastUpdated: new Date().toISOString(),
			source: "canonical_api",
		};
	}

	detectConflicts(
		current: EntitlementsMapping | null,
		expected: EntitlementsMapping,
	) {
		if (!current) {
			return {
				hasConflict: false,
				details: {
					type: "no_existing_entitlements",
					expected,
					current: null,
				},
			};
		}

		const differences: Array<{
			field: string;
			current: unknown;
			expected: unknown;
		}> = [];

		if (current.plan !== expected.plan) {
			differences.push({
				field: "plan",
				current: current.plan,
				expected: expected.plan,
			});
		}

		if (current.status !== expected.status) {
			differences.push({
				field: "status",
				current: current.status,
				expected: expected.status,
			});
		}

		if (current.meta?.subscriptionId !== expected.meta?.subscriptionId) {
			differences.push({
				field: "subscriptionId",
				current: current.meta?.subscriptionId,
				expected: expected.meta?.subscriptionId,
			});
		}

		return {
			hasConflict: differences.length > 0,
			details: {
				type:
					differences.length > 0 ? "field_mismatch" : "no_differences",
				differences,
				expected,
				current,
			},
		};
	}

	resolveConflict(
		current: EntitlementsMapping,
		expected: EntitlementsMapping,
		conflictResult: {
			details: { differences: Array<{ field: string }> };
		},
	): EntitlementsMapping {
		const { differences } = conflictResult.details;

		const planDiff = differences.find((d) => d.field === "plan");
		if (planDiff) {
			const currentHierarchy = getPlanHierarchyValue(current.plan);
			const expectedHierarchy = getPlanHierarchyValue(expected.plan);

			if (expectedHierarchy >= currentHierarchy) {
				return expected;
			}
			return {
				...current,
				meta: {
					...current.meta,
					...expected.meta,
				},
				lastUpdated: new Date().toISOString(),
				source: "conflict_resolved",
			};
		}

		return expected;
	}
}
