CREATE TABLE `transcription_chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`transcription_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`blob_url` text NOT NULL,
	`start_ms` integer NOT NULL,
	`end_ms` integer NOT NULL,
	`status` text NOT NULL,
	`transcript_text` text,
	`error_details` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_transcription_chunks_transcription_id` ON `transcription_chunks` (`transcription_id`);--> statement-breakpoint
CREATE INDEX `idx_transcription_chunks_status` ON `transcription_chunks` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_transcription_chunks_transcription_chunk` ON `transcription_chunks` (`transcription_id`,`chunk_index`);