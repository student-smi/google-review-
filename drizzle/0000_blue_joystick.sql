CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`expires_at` integer,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ai_draft_events` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`language` text NOT NULL,
	`tone` text NOT NULL,
	`word_count` integer NOT NULL,
	`copied` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_ai_draft_events_business` ON `ai_draft_events` (`business_id`);--> statement-breakpoint
CREATE TABLE `ai_usage_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`day` text NOT NULL,
	`call_count` integer DEFAULT 0 NOT NULL,
	`neuron_estimate` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ai_usage_business_day` ON `ai_usage_daily` (`business_id`,`day`);--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`google_place_id` text,
	`google_review_url` text NOT NULL,
	`category` text,
	`phone` text,
	`address` text,
	`city` text,
	`logo_url` text,
	`brand_voice` text DEFAULT 'warm_grateful' NOT NULL,
	`brand_color` text DEFAULT '#4338CA' NOT NULL,
	`brand_color_secondary` text DEFAULT '#D97706' NOT NULL,
	`contact_resolution_line` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `businesses_slug_unique` ON `businesses` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_businesses_owner` ON `businesses` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_businesses_slug` ON `businesses` (`slug`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`google_review_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_locations_business` ON `locations` (`business_id`);--> statement-breakpoint
CREATE TABLE `qr_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`destination_url` text NOT NULL,
	`style_json` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `qr_codes_code_unique` ON `qr_codes` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_qr_codes_code` ON `qr_codes` (`code`);--> statement-breakpoint
CREATE INDEX `idx_qr_codes_business` ON `qr_codes` (`business_id`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rate_limits_expires` ON `rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `reply_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`review_snippet` text,
	`rating` integer,
	`reply_text` text NOT NULL,
	`style` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reply_drafts_business` ON `reply_drafts` (`business_id`);--> statement-breakpoint
CREATE TABLE `scan_daily_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`qr_id` text NOT NULL,
	`business_id` text NOT NULL,
	`day` text NOT NULL,
	`scan_count` integer DEFAULT 0 NOT NULL,
	`help_me_write_count` integer DEFAULT 0 NOT NULL,
	`google_click_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`qr_id`) REFERENCES `qr_codes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_scan_daily_qr_day` ON `scan_daily_stats` (`qr_id`,`day`);--> statement-breakpoint
CREATE INDEX `idx_scan_daily_business_day` ON `scan_daily_stats` (`business_id`,`day`);--> statement-breakpoint
CREATE TABLE `scans` (
	`id` text PRIMARY KEY NOT NULL,
	`qr_id` text NOT NULL,
	`business_id` text NOT NULL,
	`device_class` text,
	`referrer` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`qr_id`) REFERENCES `qr_codes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_scans_qr` ON `scans` (`qr_id`);--> statement-breakpoint
CREATE INDEX `idx_scans_created` ON `scans` (`created_at`);--> statement-breakpoint
CREATE TABLE `seo_checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`item_key` text NOT NULL,
	`is_completed` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_seo_items_business_item` ON `seo_checklist_items` (`business_id`,`item_key`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
