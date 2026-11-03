CREATE TABLE IF NOT EXISTS `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo_url` text,
	`description` text,
	`plan` text DEFAULT 'growth' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `brands_slug_unique` ON `brands` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_brands_owner` ON `brands` (`owner_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_brands_slug` ON `brands` (`slug`);--> statement-breakpoint
ALTER TABLE `customer_reviews` ADD `branch_id` text REFERENCES locations(id);--> statement-breakpoint
ALTER TABLE `customer_reviews` ADD `customer_phone` text;--> statement-breakpoint
ALTER TABLE `customer_reviews` ADD `is_private_feedback` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customer_reviews` ADD `resolution_status` text DEFAULT 'open';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_customer_reviews_branch` ON `customer_reviews` (`branch_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`mime_type` text DEFAULT 'image/jpeg' NOT NULL,
	`is_recommended` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_media_assets_business` ON `media_assets` (`business_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`brand_id` text,
	`business_id` text,
	`branch_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`invited_email` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_memberships_user` ON `memberships` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_memberships_brand` ON `memberships` (`brand_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_memberships_business` ON `memberships` (`business_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_memberships_branch` ON `memberships` (`branch_id`);--> statement-breakpoint
ALTER TABLE `businesses` ADD `brand_id` text REFERENCES brands(id);--> statement-breakpoint
ALTER TABLE `businesses` ADD `business_type` text DEFAULT 'company_owned' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_businesses_brand` ON `businesses` (`brand_id`);--> statement-breakpoint
ALTER TABLE `locations` ADD `slug` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `city` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `category` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `brand_color` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `assigned_manager_id` text REFERENCES users(id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_locations_place` ON `locations` (`google_place_id`);--> statement-breakpoint
ALTER TABLE `qr_codes` ADD `branch_id` text REFERENCES locations(id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_qr_codes_branch` ON `qr_codes` (`branch_id`);
