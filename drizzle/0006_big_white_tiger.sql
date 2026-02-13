ALTER TABLE `transcriptions` ADD `user_id` text;--> statement-breakpoint
CREATE INDEX `idx_transcriptions_user_id` ON `transcriptions` (`user_id`);