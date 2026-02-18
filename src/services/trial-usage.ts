import { and, eq, sql } from "drizzle-orm";
import { trialDailyUsage } from "@/db/schema";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";
import { TRIAL_DAILY_LIMIT } from "@/lib/trial-identity";

// biome-ignore lint: needed for generic DB type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = any;

export class TrialUsageService {
	constructor(
		private db: Database,
		private logger: Logger,
	) {}

	async getRemaining(actorId: string, dayKey: string): Promise<number> {
		try {
			const result = await this.db
				.select({ usedCount: trialDailyUsage.usedCount })
				.from(trialDailyUsage)
				.where(
					and(
						eq(trialDailyUsage.actorId, actorId),
						eq(trialDailyUsage.dayKey, dayKey),
					),
				)
				.limit(1);

			const usedCount = result[0]?.usedCount ?? 0;
			return Math.max(0, TRIAL_DAILY_LIMIT - usedCount);
		} catch (error) {
			this.logger.error("Failed to get trial usage remaining", {
				actorId,
				dayKey,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async consumeSlot(actorId: string, dayKey: string): Promise<boolean> {
		try {
			const remaining = await this.getRemaining(actorId, dayKey);
			if (remaining <= 0) {
				return false;
			}

			const now = new Date().toISOString();
			await this.db
				.insert(trialDailyUsage)
				.values({
					actorId,
					dayKey,
					usedCount: 1,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: [trialDailyUsage.actorId, trialDailyUsage.dayKey],
					set: {
						usedCount: sql`${trialDailyUsage.usedCount} + 1`,
						updatedAt: now,
					},
				});

			return true;
		} catch (error) {
			this.logger.error("Failed to consume trial slot", {
				actorId,
				dayKey,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}
}
