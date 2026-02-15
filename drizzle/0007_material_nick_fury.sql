CREATE TABLE `billing_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`subscription_id` text NOT NULL,
	`customer_id` text,
	`user_id` text NOT NULL,
	`status` text,
	`current_period_end` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_billing_subs_provider_subscription` ON `billing_subscriptions` (`provider`,`subscription_id`);--> statement-breakpoint
CREATE INDEX `idx_billing_subs_user_id` ON `billing_subscriptions` (`user_id`);--> statement-breakpoint
ALTER TABLE `user_entitlements` ADD `meta` text;