DROP INDEX `idx_billing_subs_provider_subscription`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_billing_subs_provider_subscription` ON `billing_subscriptions` (`provider`,`subscription_id`);