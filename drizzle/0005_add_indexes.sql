CREATE INDEX IF NOT EXISTS `idx_transcriptions_status` ON `transcriptions` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_transcriptions_created_at` ON `transcriptions` (`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_conversations_expires_at` ON `conversations` (`expires_at`);
