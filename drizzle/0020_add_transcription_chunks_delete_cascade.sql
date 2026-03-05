PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transcription_chunks` (
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
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`transcription_id`) REFERENCES `transcriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_transcription_chunks`("id", "transcription_id", "chunk_index", "blob_url", "start_ms", "end_ms", "status", "transcript_text", "error_details", "created_at", "updated_at") SELECT "id", "transcription_id", "chunk_index", "blob_url", "start_ms", "end_ms", "status", "transcript_text", "error_details", "created_at", "updated_at" FROM `transcription_chunks`;--> statement-breakpoint
DROP TABLE `transcription_chunks`;--> statement-breakpoint
ALTER TABLE `__new_transcription_chunks` RENAME TO `transcription_chunks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_transcription_chunks_transcription_id` ON `transcription_chunks` (`transcription_id`);--> statement-breakpoint
CREATE INDEX `idx_transcription_chunks_status` ON `transcription_chunks` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_transcription_chunks_transcription_chunk` ON `transcription_chunks` (`transcription_id`,`chunk_index`);