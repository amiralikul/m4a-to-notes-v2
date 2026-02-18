import { eq } from "drizzle-orm";
import { actors } from "@/db/schema";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

// biome-ignore lint: needed for generic DB type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = any;

export class ActorsService {
	constructor(
		private db: Database,
		private logger: Logger,
	) {}

	async ensureActor(actorId: string): Promise<void> {
		try {
			const now = new Date().toISOString();
			await this.db
				.insert(actors)
				.values({
					id: actorId,
					lastSeenAt: now,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: actors.id,
					set: {
						lastSeenAt: now,
						updatedAt: now,
					},
				});
		} catch (error) {
			this.logger.error("Failed to ensure actor", {
				actorId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async findByUserId(userId: string): Promise<{ id: string } | null> {
		try {
			const result = await this.db
				.select({ id: actors.id })
				.from(actors)
				.where(eq(actors.userId, userId))
				.limit(1);
			return result[0] ?? null;
		} catch (error) {
			this.logger.error("Failed to find actor by userId", {
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async getOrCreateForUser(userId: string): Promise<string> {
		const actorId = crypto.randomUUID();
		try {
			const now = new Date().toISOString();
			await this.db
				.insert(actors)
				.values({
					id: actorId,
					userId,
					lastSeenAt: now,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoNothing({ target: actors.userId });

			const resolvedActor = await this.findByUserId(userId);
			if (!resolvedActor) {
				throw new Error("Failed to resolve actor after upsert");
			}

			await this.ensureActor(resolvedActor.id);
			return resolvedActor.id;
		} catch (error) {
			this.logger.error("Failed to create actor for user", {
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}
}
