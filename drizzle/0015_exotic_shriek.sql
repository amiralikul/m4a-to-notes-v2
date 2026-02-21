CREATE TABLE `job_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`job_source_type` text NOT NULL,
	`job_url` text,
	`resume_text` text NOT NULL,
	`job_description_input` text,
	`resolved_job_description` text,
	`brightdata_snapshot_id` text,
	`brightdata_raw_payload` text,
	`result_data` text,
	`compatibility_score` integer,
	`model_provider` text,
	`model_name` text,
	`error_code` text,
	`error_message` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`started_at` text,
	`completed_at` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_job_analyses_status` ON `job_analyses` (`status`);--> statement-breakpoint
CREATE INDEX `idx_job_analyses_created_at` ON `job_analyses` (`created_at`);