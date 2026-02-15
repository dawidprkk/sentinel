CREATE TABLE `rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`conditions` text NOT NULL,
	`logic` text DEFAULT 'AND' NOT NULL,
	`action` text NOT NULL,
	`severity` text NOT NULL,
	`created_at` text NOT NULL
);
