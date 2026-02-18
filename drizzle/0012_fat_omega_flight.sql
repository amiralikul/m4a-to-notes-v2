CREATE TABLE `__new_trial_daily_usage` (
	`actor_id` text NOT NULL,
	`day_key` text NOT NULL,
	`used_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_trial_daily_usage` (
	`actor_id`,
	`day_key`,
	`used_count`,
	`created_at`,
	`updated_at`
)
SELECT
	COALESCE(`actor_id`, `anon_id`),
	`day_key`,
	`used_count`,
	`created_at`,
	`updated_at`
FROM `trial_daily_usage`;
--> statement-breakpoint
DROP TABLE `trial_daily_usage`;
--> statement-breakpoint
ALTER TABLE `__new_trial_daily_usage` RENAME TO `trial_daily_usage`;
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_trial_daily_usage_actor_day` ON `trial_daily_usage` (`actor_id`,`day_key`);
