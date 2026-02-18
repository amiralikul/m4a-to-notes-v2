CREATE TABLE `trial_daily_usage` (
	`anon_id` text NOT NULL,
	`day_key` text NOT NULL,
	`used_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_trial_daily_usage_anon_day` ON `trial_daily_usage` (`anon_id`,`day_key`);