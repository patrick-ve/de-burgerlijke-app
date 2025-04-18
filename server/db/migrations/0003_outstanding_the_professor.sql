DROP INDEX "products_link_unique";--> statement-breakpoint
DROP INDEX "supermarkets_name_unique";--> statement-breakpoint
ALTER TABLE `products` ALTER COLUMN "created_at" TO "created_at" integer DEFAULT '"2025-04-17T19:56:27.390Z"';--> statement-breakpoint
CREATE UNIQUE INDEX `products_link_unique` ON `products` (`link`);--> statement-breakpoint
CREATE UNIQUE INDEX `supermarkets_name_unique` ON `supermarkets` (`name`);--> statement-breakpoint
ALTER TABLE `products` ALTER COLUMN "updated_at" TO "updated_at" integer DEFAULT '"2025-04-17T19:56:27.390Z"';--> statement-breakpoint
ALTER TABLE `products` ADD `standardized_price_per_unit` real;--> statement-breakpoint
ALTER TABLE `products` ADD `standardized_unit` text;--> statement-breakpoint
ALTER TABLE `supermarkets` ALTER COLUMN "created_at" TO "created_at" integer DEFAULT '"2025-04-17T19:56:27.390Z"';