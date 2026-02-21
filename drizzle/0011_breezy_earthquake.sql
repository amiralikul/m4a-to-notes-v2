CREATE TABLE `actors` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`last_seen_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_actors_user_id` ON `actors` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_actors_last_seen_at` ON `actors` (`last_seen_at`);--> statement-breakpoint
ALTER TABLE `transcriptions` ADD `owner_id` text;--> statement-breakpoint
CREATE INDEX `idx_transcriptions_owner_id` ON `transcriptions` (`owner_id`);--> statement-breakpoint
ALTER TABLE `trial_daily_usage` ADD `actor_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_trial_daily_usage_actor_day` ON `trial_daily_usage` (`actor_id`,`day_key`);--> statement-breakpoint
INSERT OR IGNORE INTO `actors` (`id`, `created_at`, `updated_at`, `last_seen_at`)
SELECT DISTINCT
	`anon_id`,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
FROM `trial_daily_usage`
WHERE `anon_id` IS NOT NULL;--> statement-breakpoint
INSERT OR IGNORE INTO `actors` (`id`, `created_at`, `updated_at`, `last_seen_at`)
SELECT DISTINCT
	json_extract(`user_metadata`, '$.anonId'),
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
FROM `transcriptions`
WHERE json_extract(`user_metadata`, '$.anonId') IS NOT NULL;--> statement-breakpoint
INSERT OR IGNORE INTO `actors` (`id`, `created_at`, `updated_at`, `last_seen_at`)
SELECT DISTINCT
	json_extract(`user_metadata`, '$.actorId'),
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
FROM `transcriptions`
WHERE json_extract(`user_metadata`, '$.actorId') IS NOT NULL;--> statement-breakpoint
UPDATE `trial_daily_usage`
SET `actor_id` = `anon_id`
WHERE `actor_id` IS NULL;--> statement-breakpoint
UPDATE `transcriptions`
SET `owner_id` = json_extract(`user_metadata`, '$.anonId')
WHERE `owner_id` IS NULL
	AND json_extract(`user_metadata`, '$.anonId') IS NOT NULL;--> statement-breakpoint
UPDATE `transcriptions`
SET `owner_id` = json_extract(`user_metadata`, '$.actorId')
WHERE `owner_id` IS NULL
	AND json_extract(`user_metadata`, '$.actorId') IS NOT NULL;
