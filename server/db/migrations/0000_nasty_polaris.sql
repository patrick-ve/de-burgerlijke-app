CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`link` text NOT NULL,
	`price` real NOT NULL,
	`amount` text,
	`supermarket_id` text NOT NULL,
	`name_embedding` F32_BLOB(1536) NOT NULL,
	`created_at` integer DEFAULT '"2025-04-17T08:19:32.849Z"',
	`updated_at` integer DEFAULT '"2025-04-17T08:19:32.849Z"',
	FOREIGN KEY (`supermarket_id`) REFERENCES `supermarkets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_link_unique` ON `products` (`link`);--> statement-breakpoint
CREATE TABLE `supermarkets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT '"2025-04-17T08:19:32.848Z"'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `supermarkets_name_unique` ON `supermarkets` (`name`);