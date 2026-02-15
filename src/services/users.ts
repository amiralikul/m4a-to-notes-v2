import { eq } from "drizzle-orm";
import type { InsertUserEntitlement, UserEntitlement } from "@/db/schema";
import { userEntitlements } from "@/db/schema";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

// biome-ignore lint: needed for generic DB type
type Database = any;

export class UsersService {
	constructor(
		private db: Database,
		private logger: Logger,
	) {}

	async get(userId: string): Promise<UserEntitlement | null> {
		try {
			if (!userId) {
				throw new Error("User ID is required");
			}

			const result = await this.db
				.select()
				.from(userEntitlements)
				.where(eq(userEntitlements.userId, userId))
				.limit(1);

			const entitlements = result[0] || null;

			if (!entitlements) {
				this.logger.info("No entitlements found for user", { userId });
				return null;
			}

			this.logger.info("Retrieved user entitlements", {
				userId,
				plan: entitlements.plan,
				status: entitlements.status,
			});

			return entitlements;
		} catch (error) {
			this.logger.error("Failed to retrieve user entitlements", {
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async set(
		userId: string,
		entitlementsData: Omit<InsertUserEntitlement, "userId">,
	): Promise<UserEntitlement> {
		try {
			if (!userId) {
				throw new Error("User ID is required");
			}

			const existing = await this.get(userId);

			const entitlements: InsertUserEntitlement = {
				userId,
				plan: entitlementsData.plan || "free",
				status: entitlementsData.status || "none",
				expiresAt: entitlementsData.expiresAt,
				features: entitlementsData.features || [],
				limits: {
					...existing?.limits,
					...entitlementsData.limits,
				},
				meta: entitlementsData.meta ?? existing?.meta ?? {},
			};

			this._validateEntitlements(entitlements);

			const result = await this.db
				.insert(userEntitlements)
				.values(entitlements)
				.onConflictDoUpdate({
					target: userEntitlements.userId,
					set: entitlements,
				})
				.returning();

			const savedEntitlements = result[0];

			this.logger.info("Updated user entitlements", {
				userId,
				plan: savedEntitlements.plan,
				status: savedEntitlements.status,
			});

			return savedEntitlements;
		} catch (error) {
			this.logger.error("Failed to update user entitlements", {
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	// (#14) Return in-memory defaults without DB write
	async getWithDefaults(userId: string): Promise<UserEntitlement> {
		const entitlements = await this.get(userId);

		if (!entitlements) {
			return {
				userId,
				plan: "free",
				status: "none",
				expiresAt: null,
				features: [],
				limits: {},
				meta: {},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			} as UserEntitlement;
		}

		return entitlements;
	}

	async hasAccess(userId: string, feature = "basic"): Promise<boolean> {
		try {
			const entitlements = await this.getWithDefaults(userId);

			const hasActiveSubscription = ["trialing", "active"].includes(
				entitlements.status || "",
			);

			switch (feature) {
				case "basic":
					return true;
				case "pro":
					return entitlements.plan === "pro" && hasActiveSubscription;
				default:
					return false;
			}
		} catch (error) {
			this.logger.error("Failed to check user access", {
				userId,
				feature,
				error: getErrorMessage(error),
			});
			return false;
		}
	}

	async delete(userId: string): Promise<void> {
		try {
			if (!userId) {
				throw new Error("User ID is required");
			}

			await this.db
				.delete(userEntitlements)
				.where(eq(userEntitlements.userId, userId));

			this.logger.info("Deleted user entitlements", { userId });
		} catch (error) {
			this.logger.error("Failed to delete user entitlements", {
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	private _validateEntitlements(entitlements: InsertUserEntitlement): void {
		const validPlans = ["free", "pro"];
		const validStatuses = [
			"none",
			"trialing",
			"active",
			"past_due",
			"canceled",
		];

		if (entitlements.plan && !validPlans.includes(entitlements.plan)) {
			throw new Error(
				`Invalid plan: ${entitlements.plan}. Must be one of: ${validPlans.join(", ")}`,
			);
		}

		if (entitlements.status && !validStatuses.includes(entitlements.status)) {
			throw new Error(
				`Invalid status: ${entitlements.status}. Must be one of: ${validStatuses.join(", ")}`,
			);
		}
	}
}
