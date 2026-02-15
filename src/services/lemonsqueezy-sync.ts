import {
	SUBSCRIPTION_PLANS,
	SUBSCRIPTION_STATUS,
	SUBSCRIPTION_PROVIDERS,
	mapLemonSqueezyStatus,
	mapLemonSqueezyVariantToPlan,
	getPlanHierarchyValue,
} from "@/lib/constants/plans";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";
import type { LemonSqueezySubscriptionAttributes } from "@/lib/types";
import { UsersService } from "./users";

interface EntitlementsMapping {
	plan: string;
	status: string;
	provider: string;
	meta: {
		subscriptionId: string;
		customerId: string;
		renewsAt?: string;
		endsAt?: string;
		variantId: string;
		productName: string;
	};
	lastUpdated: string;
	source: string;
}

export class LemonSqueezySyncService {
	private apiKey: string;
	private logger: Logger;
	private users: UsersService;

	constructor(
		// biome-ignore lint: needed for generic DB type
		database: any,
		logger: Logger,
	) {
		this.apiKey = process.env.LEMONSQUEEZY_API_KEY || "";
		this.logger = logger;
		this.users = new UsersService(database, logger);
	}

	private ensureApiKey(): void {
		if (!this.apiKey) {
			throw new Error("LEMONSQUEEZY_API_KEY environment variable is required");
		}
	}

	async fetchCanonicalSubscription(
		subscriptionId: string,
	): Promise<LemonSqueezySubscriptionAttributes> {
		this.ensureApiKey();

		this.logger.info("Fetching canonical subscription from Lemon Squeezy API", {
			subscriptionId,
		});

		const response = await fetch(
			`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					Accept: "application/vnd.api+json",
				},
				signal: AbortSignal.timeout(10_000),
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
			data: { attributes: LemonSqueezySubscriptionAttributes };
		};
		return data.data.attributes;
	}

	async syncSubscription(
		clerkUserId: string,
		subscriptionId: string,
		eventType: string,
	) {
		try {
			const subscription =
				await this.fetchCanonicalSubscription(subscriptionId);

			this.logger.info("Fetched canonical subscription state", {
				subscriptionId,
				eventType,
				status: subscription.status,
				customerId: subscription.customer_id,
			});

			const entitlements = this.mapToEntitlements(subscriptionId, subscription);

			await this.users.set(clerkUserId, {
				plan: entitlements.plan,
				status: entitlements.status,
				expiresAt: entitlements.meta.endsAt || entitlements.meta.renewsAt,
				features: [],
				limits: {},
				meta: entitlements.meta,
			});

			this.logger.info("Entitlements updated from canonical state", {
				clerkUserId,
				subscriptionId,
				plan: entitlements.plan,
				status: entitlements.status,
			});
		} catch (error: unknown) {
			this.logger.error("Canonical sync failed", {
				subscriptionId,
				eventType,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	mapToEntitlements(
		subscriptionId: string,
		subscription: LemonSqueezySubscriptionAttributes,
	): EntitlementsMapping {
		const status = mapLemonSqueezyStatus(subscription.status);
		let plan = mapLemonSqueezyVariantToPlan(
			String(subscription.variant_id),
		);

		if (status === SUBSCRIPTION_STATUS.NONE) {
			plan = SUBSCRIPTION_PLANS.FREE;
		}

		const meta: EntitlementsMapping["meta"] = {
			subscriptionId,
			customerId: String(subscription.customer_id),
			variantId: String(subscription.variant_id),
			productName: subscription.product_name,
		};

		if (subscription.renews_at) {
			meta.renewsAt = subscription.renews_at;
		}

		if (subscription.ends_at) {
			meta.endsAt = subscription.ends_at;
		}

		return {
			plan,
			status,
			provider: SUBSCRIPTION_PROVIDERS.LEMON_SQUEEZY,
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
					renewsAt: expected.meta.renewsAt,
					endsAt: expected.meta.endsAt,
				},
				lastUpdated: new Date().toISOString(),
				source: "conflict_resolved",
			};
		}

		return expected;
	}
}
