import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

export function createTestDb() {
	const sqlite = new Database(":memory:");

	// Apply schema (inline DDL matching the migrations)
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS jobs (
			id TEXT PRIMARY KEY NOT NULL,
			status TEXT NOT NULL,
			progress INTEGER DEFAULT 0 NOT NULL,
			source TEXT NOT NULL,
			object_key TEXT NOT NULL,
			file_name TEXT NOT NULL,
			transcript_object_key TEXT,
			transcript_preview TEXT,
			error_code TEXT,
			error_message TEXT,
			created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			meta TEXT,
			transcription TEXT
		);

		CREATE TABLE IF NOT EXISTS transcriptions (
			id TEXT PRIMARY KEY NOT NULL,
			status TEXT NOT NULL,
			progress INTEGER DEFAULT 0 NOT NULL,
			audio_key TEXT NOT NULL,
			filename TEXT NOT NULL,
			source TEXT NOT NULL,
			transcript_text TEXT,
			preview TEXT,
			user_metadata TEXT,
			error_details TEXT,
			created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			started_at TEXT,
			completed_at TEXT,
			user_id TEXT,
			updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
		);

		CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
		CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at);
		CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON transcriptions(user_id);

		CREATE TABLE IF NOT EXISTS conversations (
			chat_id TEXT PRIMARY KEY NOT NULL,
			data TEXT NOT NULL,
			created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			expires_at TEXT NOT NULL
		);

		CREATE INDEX IF NOT EXISTS idx_conversations_expires_at ON conversations(expires_at);

		CREATE TABLE IF NOT EXISTS user_entitlements (
			user_id TEXT PRIMARY KEY NOT NULL,
			plan TEXT,
			status TEXT,
			expires_at TEXT,
			features TEXT NOT NULL,
			limits TEXT NOT NULL,
			meta TEXT DEFAULT '{}',
			created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
		);

		CREATE TABLE IF NOT EXISTS billing_subscriptions (
			id TEXT PRIMARY KEY NOT NULL,
			provider TEXT NOT NULL,
			subscription_id TEXT NOT NULL,
			customer_id TEXT,
			user_id TEXT NOT NULL,
			status TEXT,
			current_period_end TEXT,
			created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
		);

		CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_subs_provider_subscription
		ON billing_subscriptions(provider, subscription_id);

		CREATE INDEX IF NOT EXISTS idx_billing_subs_user_id ON billing_subscriptions(user_id);
	`);

	return drizzle(sqlite, { schema });
}
