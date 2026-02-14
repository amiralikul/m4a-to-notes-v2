import { and, eq } from "drizzle-orm";
import { billingSubscriptions } from "@/db/schema";
import type { BillingSubscription, InsertBillingSubscription } from "@/db/schema";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

// biome-ignore lint: needed for generic DB type
type Database = any;

export class BillingSubscriptionsService {
	constructor(
		private db: Database,
		private logger: Logger,
	) {}

	async upsert(data: InsertBillingSubscription): Promise<BillingSubscription> {
		try {
			const result = await this.db
				.insert(billingSubscriptions)
				.values(data)
				.onConflictDoUpdate({
					target: billingSubscriptions.id,
					set: {
						status: data.status,
						customerId: data.customerId,
						currentPeriodEnd: data.currentPeriodEnd,
						updatedAt: new Date().toISOString(),
					},
				})
				.returning();

			return result[0];
		} catch (error) {
			this.logger.error("Failed to upsert billing subscription", {
				error: getErrorMessage(error),
				subscriptionId: data.subscriptionId,
			});
			throw error;
		}
	}

	async getUserIdBySubscriptionId(
		provider: string,
		subscriptionId: string,
	): Promise<string | null> {
		try {
			const result = await this.db
				.select({ userId: billingSubscriptions.userId })
				.from(billingSubscriptions)
				.where(
					and(
						eq(billingSubscriptions.provider, provider),
						eq(billingSubscriptions.subscriptionId, subscriptionId),
					),
				)
				.limit(1);

			return result[0]?.userId ?? null;
		} catch (error) {
			this.logger.error("Failed to look up user by subscription ID", {
				error: getErrorMessage(error),
				provider,
				subscriptionId,
			});
			return null;
		}
	}

	async verifyOwnership(
		userId: string,
		subscriptionId: string,
		provider: string,
	): Promise<boolean> {
		try {
			const result = await this.db
				.select({ userId: billingSubscriptions.userId })
				.from(billingSubscriptions)
				.where(
					and(
						eq(billingSubscriptions.provider, provider),
						eq(billingSubscriptions.subscriptionId, subscriptionId),
					),
				)
				.limit(1);

			return result[0]?.userId === userId;
		} catch (error) {
			this.logger.error("Failed to verify subscription ownership", {
				error: getErrorMessage(error),
				userId,
				subscriptionId,
			});
			return false;
		}
	}
}
