ALTER TABLE `job_analyses` ADD `user_id` text;--> statement-breakpoint
CREATE INDEX `idx_job_analyses_user_id` ON `job_analyses` (`user_id`);