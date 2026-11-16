CREATE TABLE `build_components` (
	`build_id` int NOT NULL,
	`component_id` int NOT NULL,
	`quantity` int NOT NULL,
	CONSTRAINT PRIMARY KEY(`build_id`,`component_id`)
);
--> statement-breakpoint
CREATE TABLE `builds` (
	`build_id` int AUTO_INCREMENT PRIMARY KEY,
	`name` varchar(150) NOT NULL,
	`description` text,
	`user_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`category_id` int AUTO_INCREMENT PRIMARY KEY,
	`name` varchar(100) NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `components` (
	`component_id` int AUTO_INCREMENT PRIMARY KEY,
	`name` varchar(150),
	`manufacturer` varchar(150),
	`form_factor` varchar(100),
	`tdp_watts` int,
	`storage` int,
	`ram` int,
	`speed` int,
	`case_volume` int,
	`noise_level_db` int,
	`description` text,
	`detail` text,
	`price` decimal(10,2),
	`category_id` int
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` int AUTO_INCREMENT PRIMARY KEY,
	`username` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	CONSTRAINT `users_username_unique` UNIQUE INDEX(`username`),
	CONSTRAINT `users_email_unique` UNIQUE INDEX(`email`)
);
--> statement-breakpoint
ALTER TABLE `build_components` ADD CONSTRAINT `build_components_build_id_builds_build_id_fk` FOREIGN KEY (`build_id`) REFERENCES `builds`(`build_id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `build_components` ADD CONSTRAINT `build_components_component_id_components_component_id_fk` FOREIGN KEY (`component_id`) REFERENCES `components`(`component_id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `builds` ADD CONSTRAINT `builds_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `components` ADD CONSTRAINT `components_category_id_categories_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE SET NULL;