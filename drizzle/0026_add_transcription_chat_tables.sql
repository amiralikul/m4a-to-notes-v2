CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`role` text NOT NULL,
	`parts` text NOT NULL,
	`quoted_chunks` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `transcription_chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chat_messages_chat_id_idx` ON `chat_messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `chat_messages_chat_id_created_at_idx` ON `chat_messages` (`chat_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `transcription_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`transcription_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`transcription_id`) REFERENCES `transcriptions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transcription_chats_transcription_user_unique` ON `transcription_chats` (`transcription_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `transcription_chats_user_id_idx` ON `transcription_chats` (`user_id`);--> statement-breakpoint
CREATE INDEX `transcription_chats_updated_at_idx` ON `transcription_chats` (`updated_at`);