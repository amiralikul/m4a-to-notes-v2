CREATE TABLE `translations` (
	`id` text PRIMARY KEY NOT NULL,
	`transcription_id` text NOT NULL,
	`language` text NOT NULL,
	`status` text NOT NULL,
	`translated_text` text,
	`translated_summary` text,
	`error_details` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`completed_at` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `translations_transcription_language_idx` ON `translations` (`transcription_id`,`language`);--> statement-breakpoint
CREATE INDEX `translations_transcription_id_idx` ON `translations` (`transcription_id`);