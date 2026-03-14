import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { AppDatabase } from "@/db/types";
import * as schema from "@/db/schema";

export function createTestDb(): AppDatabase {
	const sqlite = new Database(":memory:");
	sqlite.pragma("foreign_keys = ON");

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
			owner_id TEXT,
			summary_status TEXT,
			summary_data TEXT,
			summary_error TEXT,
			summary_provider TEXT,
			summary_model TEXT,
			summary_updated_at TEXT,
			content_type TEXT,
			enable_diarization INTEGER DEFAULT 0 NOT NULL,
			diarization_data TEXT,
			updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
		);

		CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
		CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at);
		CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON transcriptions(user_id);
		CREATE INDEX IF NOT EXISTS idx_transcriptions_owner_id ON transcriptions(owner_id);

		CREATE TABLE IF NOT EXISTS transcription_chunks (
			id TEXT PRIMARY KEY NOT NULL,
			transcription_id TEXT NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
			chunk_index INTEGER NOT NULL,
			blob_url TEXT NOT NULL,
			start_ms INTEGER NOT NULL,
			end_ms INTEGER NOT NULL,
			status TEXT NOT NULL,
			transcript_text TEXT,
			error_details TEXT,
			created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
		);

		CREATE INDEX IF NOT EXISTS idx_transcription_chunks_transcription_id
		ON transcription_chunks(transcription_id);
		CREATE INDEX IF NOT EXISTS idx_transcription_chunks_status
		ON transcription_chunks(status);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_transcription_chunks_transcription_chunk
		ON transcription_chunks(transcription_id, chunk_index);

		CREATE TABLE IF NOT EXISTS translations (
			id TEXT PRIMARY KEY NOT NULL,
			transcription_id TEXT NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
			language TEXT NOT NULL,
			status TEXT NOT NULL,
			translated_text TEXT,
			translated_summary TEXT,
			error_details TEXT,
			created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			completed_at TEXT,
			updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
		);

		CREATE UNIQUE INDEX IF NOT EXISTS translations_transcription_language_idx
		ON translations(transcription_id, language);

		CREATE TABLE IF NOT EXISTS trial_daily_usage (
			actor_id TEXT NOT NULL,
			day_key TEXT NOT NULL,
			used_count INTEGER DEFAULT 0 NOT NULL,
			created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
		);

		CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_daily_usage_actor_day
		ON trial_daily_usage(actor_id, day_key);

		CREATE TABLE IF NOT EXISTS actors (
			id TEXT PRIMARY KEY NOT NULL,
			user_id TEXT,
			created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
			last_seen_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
		);

		CREATE UNIQUE INDEX IF NOT EXISTS idx_actors_user_id ON actors(user_id);
		CREATE INDEX IF NOT EXISTS idx_actors_last_seen_at ON actors(last_seen_at);

		CREATE TABLE IF NOT EXISTS user_entitlements (
			user_id TEXT PRIMARY KEY NOT NULL,
			plan TEXT,
			status TEXT,
			expires_at TEXT,
			features TEXT NOT NULL,
			limits TEXT NOT NULL,
			meta TEXT,
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
