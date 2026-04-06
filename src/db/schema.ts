import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
	"users",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull(),
		emailVerified: integer("email_verified", { mode: "boolean" })
			.notNull()
			.default(false),
		image: text("image"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessions = sqliteTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("sessions_token_unique").on(table.token),
		index("sessions_user_id_idx").on(table.userId),
	],
);

export const accounts = sqliteTable(
	"accounts",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		index("accounts_user_id_idx").on(table.userId),
		uniqueIndex("accounts_provider_account_unique").on(
			table.providerId,
			table.accountId,
		),
	],
);

export const verifications = sqliteTable(
	"verifications",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [index("verifications_identifier_idx").on(table.identifier)],
);

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
		displayName: text("display_name"),
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
		contentType: text("content_type"),
		enableDiarization: integer("enable_diarization", { mode: "boolean" }).default(false).notNull(),
		diarizationData: text("diarization_data", { mode: "json" }).$type<DiarizationSegment[] | null>(),
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

export const transcriptionChunks = sqliteTable(
	"transcription_chunks",
	{
		id: text("id").primaryKey(),
		transcriptionId: text("transcription_id")
			.notNull()
			.references(() => transcriptions.id, { onDelete: "cascade" }),
		chunkIndex: integer("chunk_index").notNull(),
		blobUrl: text("blob_url").notNull(),
		startMs: integer("start_ms").notNull(),
		endMs: integer("end_ms").notNull(),
		status: text("status", {
			enum: ["pending", "processing", "completed", "failed"],
		}).notNull(),
		transcriptText: text("transcript_text"),
		errorDetails: text("error_details", { mode: "json" }).$type<{
			code?: string;
			message?: string;
		}>(),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("idx_transcription_chunks_transcription_id").on(table.transcriptionId),
		index("idx_transcription_chunks_status").on(table.status),
		uniqueIndex("idx_transcription_chunks_transcription_chunk").on(
			table.transcriptionId,
			table.chunkIndex,
		),
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

export interface DiarizationSegment {
	speaker: string;   // "A", "B", etc.
	text: string;
	start: number;     // milliseconds
	end: number;       // milliseconds
}

export interface TranscriptionSummaryActionItem {
	task: string;
	owner?: string;
	dueDate?: string;
}

// Legacy format (pre-content-type summaries)
export interface LegacySummaryData {
	summary: string;
	keyPoints: string[];
	actionItems: TranscriptionSummaryActionItem[];
	keyTakeaways: string[];
}

// Rich item for action-item-like sections (task/owner/dueDate)
export interface SummaryRichItem {
	text: string;
	owner?: string | null;
	dueDate?: string | null;
}

// A single section in a flexible summary
export interface SummarySection {
	key: string;
	label: string;
	items: string[] | SummaryRichItem[];
}

// Flexible format with content-type-specific sections
export interface FlexibleSummaryData {
	contentType: string;
	summary: string;
	sections: SummarySection[];
}

export type TranscriptionSummaryData = FlexibleSummaryData | LegacySummaryData;

export function isFlexibleSummary(
	data: TranscriptionSummaryData,
): data is FlexibleSummaryData {
	return "contentType" in data && "sections" in data;
}

export interface JobAnalysisOneWeekPlanDay {
	day: number;
	title: string;
	tasks: string[];
}

export interface JobAnalysisResultData {
	compatibilityScore: number;
	compatibilitySummary: string;
	strengths: string[];
	gaps: string[];
	interviewQuestions: string[];
	interviewPreparation: string[];
	oneWeekPlan: JobAnalysisOneWeekPlanDay[];
}

export const jobAnalyses = sqliteTable(
	"job_analyses",
	{
		id: text("id").primaryKey(),
		userId: text("user_id"),
		status: text("status", {
			enum: ["queued", "processing", "completed", "failed"],
		}).notNull(),
		jobSourceType: text("job_source_type", {
			enum: ["url", "text"],
		}).notNull(),
		jobUrl: text("job_url"),
		resumeText: text("resume_text").notNull(),
		jobDescriptionInput: text("job_description_input"),
		resolvedJobDescription: text("resolved_job_description"),
		brightDataSnapshotId: text("brightdata_snapshot_id"),
		brightDataRawPayload: text("brightdata_raw_payload", {
			mode: "json",
		}).$type<unknown>(),
		resultData: text("result_data", { mode: "json" }).$type<JobAnalysisResultData>(),
		compatibilityScore: integer("compatibility_score"),
		modelProvider: text("model_provider"),
		modelName: text("model_name"),
		errorCode: text("error_code"),
		errorMessage: text("error_message"),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		startedAt: text("started_at"),
		completedAt: text("completed_at"),
		updatedAt: text("updated_at")
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("idx_job_analyses_user_id").on(table.userId),
		index("idx_job_analyses_status").on(table.status),
		index("idx_job_analyses_created_at").on(table.createdAt),
	],
);

// Type inference exports
export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
export type UpdateJob = Partial<Omit<Job, "id">>;

export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = typeof transcriptions.$inferInsert;
export type UpdateTranscription = Partial<Omit<Transcription, "id">>;

export type TranscriptionChunk = typeof transcriptionChunks.$inferSelect;
export type InsertTranscriptionChunk = typeof transcriptionChunks.$inferInsert;
export type UpdateTranscriptionChunk = Partial<
	Omit<TranscriptionChunk, "id" | "transcriptionId" | "chunkIndex">
>;

export type TrialDailyUsage = typeof trialDailyUsage.$inferSelect;
export type InsertTrialDailyUsage = typeof trialDailyUsage.$inferInsert;

export type Actor = typeof actors.$inferSelect;
export type InsertActor = typeof actors.$inferInsert;

export type UserEntitlement = typeof userEntitlements.$inferSelect;
export type InsertUserEntitlement = typeof userEntitlements.$inferInsert;
export type UpdateUserEntitlement = Partial<Omit<UserEntitlement, "userId">>;

export type AuthUser = typeof users.$inferSelect;
export type InsertAuthUser = typeof users.$inferInsert;

export type AuthSession = typeof sessions.$inferSelect;
export type InsertAuthSession = typeof sessions.$inferInsert;

export type AuthAccount = typeof accounts.$inferSelect;
export type InsertAuthAccount = typeof accounts.$inferInsert;

export type AuthVerification = typeof verifications.$inferSelect;
export type InsertAuthVerification = typeof verifications.$inferInsert;

export type BillingSubscription = typeof billingSubscriptions.$inferSelect;
export type InsertBillingSubscription = typeof billingSubscriptions.$inferInsert;

export type JobAnalysis = typeof jobAnalyses.$inferSelect;
export type InsertJobAnalysis = typeof jobAnalyses.$inferInsert;
export type UpdateJobAnalysis = Partial<Omit<JobAnalysis, "id">>;

// Translations table - stores translated versions of transcriptions
export const translations = sqliteTable(
	"translations",
	{
		id: text("id").primaryKey(),
		transcriptionId: text("transcription_id")
			.notNull()
			.references(() => transcriptions.id, { onDelete: "cascade" }),
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
	],
);

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = typeof translations.$inferInsert;
export type UpdateTranslation = Partial<Omit<Translation, "id">>;
