ALTER TABLE `transcriptions` ADD `enable_diarization` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `transcriptions` ADD `diarization_data` text;