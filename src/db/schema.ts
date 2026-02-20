import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Jobs table - DEPRECATED: Use transcriptions table
export const jobs = sqliteTable("jobs", {
	id: text("id").primaryKey(),
	status: text("status", {
		enum: ["queued", "processing", "completed", "error"],
	}).notNull(),
	progress: integer("progress").default(0).notNull(),
	source: text("source", {
		enum: ["web", "telegram"],
	}).notNull(),
	objectKey: text("object_key").notNull(),
	fileName: text("file_name").notNull(),
	transcriptObjectKey: text("transcript_object_key"),
	transcriptPreview: text("transcript_preview"),
	errorCode: text("error_code"),
	errorMessage: text("error_message"),
	createdAt: text("created_at")
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at")
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	meta: text("meta", { mode: "json" }).$type<Record<string, unknown>>(),
	transcription: text("transcription"),
});

// Transcriptions table - primary table for transcription workflow
export const transcriptions = sqliteTable(
	"transcriptions",
	{
		id: text("id").primaryKey(),
		status: text("status", {
			enum: ["pending", "processing", "completed", "failed"],
		}).notNull(),
		progress: integer("progress").default(0).notNull(),
		audioKey: text("audio_key").notNull(),
		filename: text("filename").notNull(),
		source: text("source", {
			enum: ["web", "telegram"],
		}).notNull(),
		transcriptText: text("transcript_text"),
		preview: text("preview"),
		userMetadata: text("user_metadata", { mode: "json" }).$type<
			Record<string, unknown>
		>(),
		errorDetails: text("error_details", { mode: "json" }).$type<{
			code?: string;
			message?: string;
		}>(),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		startedAt: text("started_at"),
		completedAt: text("completed_at"),
		userId: text("user_id"),
		ownerId: text("owner_id"),
		summaryStatus: text("summary_status", {
			enum: ["pending", "processing", "completed", "failed"],
		}),
		summaryData: text("summary_data", { mode: "json" }).$type<
			TranscriptionSummaryData
		>(),
		summaryError: text("summary_error", { mode: "json" }).$type<{
			code?: string;
			message?: string;
		}>(),
		summaryProvider: text("summary_provider"),
		summaryModel: text("summary_model"),
		summaryUpdatedAt: text("summary_updated_at"),
		updatedAt: text("updated_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("idx_transcriptions_status").on(table.status),
		index("idx_transcriptions_created_at").on(table.createdAt),
		index("idx_transcriptions_user_id").on(table.userId),
		index("idx_transcriptions_owner_id").on(table.ownerId),
	],
);

export const trialDailyUsage = sqliteTable(
	"trial_daily_usage",
	{
		actorId: text("actor_id").notNull(),
		dayKey: text("day_key").notNull(),
		usedCount: integer("used_count").default(0).notNull(),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		uniqueIndex("idx_trial_daily_usage_actor_day").on(
			table.actorId,
			table.dayKey,
		),
	],
);

export const actors = sqliteTable(
	"actors",
	{
		id: text("id").primaryKey(),
		userId: text("user_id"),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
		lastSeenAt: text("last_seen_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		uniqueIndex("idx_actors_user_id").on(table.userId),
		index("idx_actors_last_seen_at").on(table.lastSeenAt),
	],
);

// Conversations table
export const conversations = sqliteTable(
	"conversations",
	{
		chatId: text("chat_id").primaryKey(),
		data: text("data", { mode: "json" })
			.$type<ConversationData>()
			.notNull(),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
		expiresAt: text("expires_at").notNull(),
	},
	(table) => [index("idx_conversations_expires_at").on(table.expiresAt)],
);

// User entitlements table
export const userEntitlements = sqliteTable("user_entitlements", {
	userId: text("user_id").primaryKey(),
	plan: text("plan"),
	status: text("status"),
	expiresAt: text("expires_at"),
	features: text("features", { mode: "json" }).$type<string[]>().notNull(),
	limits: text("limits", { mode: "json" })
		.$type<Record<string, number>>()
		.notNull(),
	meta: text("meta", { mode: "json" }).$type<Record<string, unknown>>(),
	createdAt: text("created_at")
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at")
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

// Billing subscriptions table - maps payment provider IDs to internal user IDs
export const billingSubscriptions = sqliteTable(
	"billing_subscriptions",
	{
		id: text("id").primaryKey(),
		provider: text("provider").notNull(),
		subscriptionId: text("subscription_id").notNull(),
		customerId: text("customer_id"),
		userId: text("user_id").notNull(),
		status: text("status"),
		currentPeriodEnd: text("current_period_end"),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		uniqueIndex("idx_billing_subs_provider_subscription").on(
			table.provider,
			table.subscriptionId,
		),
		index("idx_billing_subs_user_id").on(table.userId),
	],
);

// Type definitions for conversation data
export interface ConversationData {
	messages: Array<{
		id: string;
		type: "transcription" | "user_message" | "bot_response";
		content: string;
		audioFileId?: string;
		timestamp: string;
	}>;
	createdAt: string;
	updatedAt: string;
}

export interface TranscriptionSummaryActionItem {
	task: string;
	owner?: string;
	dueDate?: string;
}

export interface TranscriptionSummaryData {
	summary: string;
	keyPoints: string[];
	actionItems: TranscriptionSummaryActionItem[];
	keyTakeaways: string[];
}

// Type inference exports
export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
export type UpdateJob = Partial<Omit<Job, "id">>;

export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = typeof transcriptions.$inferInsert;
export type UpdateTranscription = Partial<Omit<Transcription, "id">>;

export type TrialDailyUsage = typeof trialDailyUsage.$inferSelect;
export type InsertTrialDailyUsage = typeof trialDailyUsage.$inferInsert;

export type Actor = typeof actors.$inferSelect;
export type InsertActor = typeof actors.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type UpdateConversation = Partial<Omit<Conversation, "chatId">>;

export type UserEntitlement = typeof userEntitlements.$inferSelect;
export type InsertUserEntitlement = typeof userEntitlements.$inferInsert;
export type UpdateUserEntitlement = Partial<Omit<UserEntitlement, "userId">>;

export type BillingSubscription = typeof billingSubscriptions.$inferSelect;
export type InsertBillingSubscription = typeof billingSubscriptions.$inferInsert;

// Translations table - stores translated versions of transcriptions
export const translations = sqliteTable(
	"translations",
	{
		id: text("id").primaryKey(),
		transcriptionId: text("transcription_id").notNull(),
		language: text("language").notNull(),
		status: text("status", {
			enum: ["pending", "processing", "completed", "failed"],
		}).notNull(),
		translatedText: text("translated_text"),
		translatedSummary: text("translated_summary", {
			mode: "json",
		}).$type<TranscriptionSummaryData>(),
		errorDetails: text("error_details", { mode: "json" }).$type<{
			code?: string;
			message: string;
		}>(),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		completedAt: text("completed_at"),
		updatedAt: text("updated_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		uniqueIndex("translations_transcription_language_idx").on(
			table.transcriptionId,
			table.language,
		),
		index("translations_transcription_id_idx").on(table.transcriptionId),
	],
);

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = typeof translations.$inferInsert;
export type UpdateTranslation = Partial<Omit<Translation, "id">>;
