CREATE TABLE `allocations` (
	`id` varchar(64) NOT NULL,
	`candidate_id` varchar(64) NOT NULL,
	`candidate_name` varchar(191) NOT NULL,
	`candidate_cnic` varchar(15) NOT NULL,
	`district` varchar(100) NOT NULL,
	`constituency` varchar(64) NOT NULL,
	`role_category` varchar(64) NOT NULL,
	`role_title` varchar(191) NOT NULL,
	`department` varchar(255) NOT NULL,
	`party_affiliation` varchar(32) NOT NULL,
	`allocated_date` varchar(10) NOT NULL,
	`tenure_months` int NOT NULL,
	`status` varchar(20) NOT NULL,
	`allocated_by` varchar(191) NOT NULL,
	`appointment_ref_no` varchar(100) NOT NULL,
	`salary_or_stipend` varchar(100),
	`remarks` varchar(1000),
	`revoked_by` varchar(191),
	`revoked_at` varchar(30),
	`revoke_reason` varchar(500),
	`created_at` varchar(30) NOT NULL,
	`updated_at` varchar(30) NOT NULL,
	CONSTRAINT `allocations_id` PRIMARY KEY(`id`),
	CONSTRAINT `allocations_ref_uq` UNIQUE(`appointment_ref_no`)
);
--> statement-breakpoint
CREATE TABLE `candidate_images` (
	`id` varchar(64) NOT NULL,
	`candidate_id` varchar(64) NOT NULL,
	`mime_type` varchar(64) NOT NULL,
	`data` mediumblob NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`size_bytes` int NOT NULL,
	`checksum` varchar(64) NOT NULL,
	`created_at` varchar(30) NOT NULL,
	`updated_at` varchar(30) NOT NULL,
	CONSTRAINT `candidate_images_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_images_candidate_uq` UNIQUE(`candidate_id`)
);
--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` varchar(64) NOT NULL,
	`full_name` varchar(191) NOT NULL,
	`father_name` varchar(191) NOT NULL,
	`cnic` varchar(15) NOT NULL,
	`cnic_digits` varchar(13) NOT NULL,
	`dob` varchar(10) NOT NULL,
	`gender` varchar(10) NOT NULL,
	`phone` varchar(30) NOT NULL,
	`email` varchar(191) NOT NULL,
	`address` varchar(255) NOT NULL,
	`domicile_district` varchar(100) NOT NULL,
	`constituency` varchar(64) NOT NULL,
	`tehsil` varchar(100) NOT NULL,
	`union_council` varchar(100),
	`party_affiliation` varchar(32) NOT NULL,
	`photo_url` longtext NOT NULL,
	`matric_details` json NOT NULL,
	`fsc_details` json NOT NULL,
	`higher_education` json,
	`status` varchar(32) NOT NULL,
	`allocated_role_id` varchar(64),
	`registered_at` varchar(30) NOT NULL,
	`notes` varchar(1000),
	`password_hash` varchar(255),
	`created_at` varchar(30) NOT NULL,
	`updated_at` varchar(30) NOT NULL,
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidates_cnic_uq` UNIQUE(`cnic_digits`),
	CONSTRAINT `candidates_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `districts` (
	`id` varchar(64) NOT NULL,
	`name` varchar(100) NOT NULL,
	`province` varchar(64) NOT NULL,
	`constituencies` json NOT NULL,
	`total_quota` int NOT NULL,
	`allocated_count` int NOT NULL DEFAULT 0,
	`created_at` varchar(30) NOT NULL,
	`updated_at` varchar(30) NOT NULL,
	CONSTRAINT `districts_id` PRIMARY KEY(`id`),
	CONSTRAINT `districts_name_uq` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(64) NOT NULL,
	`sender_id` varchar(64),
	`sender_name` varchar(191) NOT NULL,
	`sender_role` varchar(128) NOT NULL,
	`sender_department` varchar(255) NOT NULL,
	`district` varchar(100) NOT NULL,
	`subject` varchar(191) NOT NULL,
	`message` varchar(5000) NOT NULL,
	`priority` varchar(32) NOT NULL,
	`timestamp` varchar(30) NOT NULL,
	`unread` boolean NOT NULL DEFAULT true,
	`created_at` varchar(30) NOT NULL,
	`updated_at` varchar(30) NOT NULL,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(64) NOT NULL,
	`username` varchar(64) NOT NULL,
	`email` varchar(191) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role_key` varchar(64) NOT NULL,
	`role_category` varchar(64) NOT NULL,
	`name` varchar(191) NOT NULL,
	`title` varchar(191) NOT NULL,
	`department` varchar(255) NOT NULL,
	`district` varchar(100) NOT NULL,
	`constituency` varchar(64),
	`avatar` varchar(512) NOT NULL,
	`badge_color` varchar(128) NOT NULL,
	`permissions` json NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_login_at` varchar(30),
	`created_at` varchar(30) NOT NULL,
	`updated_at` varchar(30) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_uq` UNIQUE(`username`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `allocations` ADD CONSTRAINT `allocations_candidate_id_candidates_id_fk` FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_images` ADD CONSTRAINT `candidate_images_candidate_id_candidates_id_fk` FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `allocations_candidate_idx` ON `allocations` (`candidate_id`);--> statement-breakpoint
CREATE INDEX `allocations_district_status_idx` ON `allocations` (`district`,`status`);--> statement-breakpoint
CREATE INDEX `allocations_status_idx` ON `allocations` (`status`);--> statement-breakpoint
CREATE INDEX `candidates_district_idx` ON `candidates` (`domicile_district`);--> statement-breakpoint
CREATE INDEX `candidates_status_idx` ON `candidates` (`status`);--> statement-breakpoint
CREATE INDEX `candidates_party_idx` ON `candidates` (`party_affiliation`);--> statement-breakpoint
CREATE INDEX `candidates_name_idx` ON `candidates` (`full_name`);--> statement-breakpoint
CREATE INDEX `districts_province_idx` ON `districts` (`province`);--> statement-breakpoint
CREATE INDEX `messages_district_idx` ON `messages` (`district`);--> statement-breakpoint
CREATE INDEX `messages_timestamp_idx` ON `messages` (`timestamp`);--> statement-breakpoint
CREATE INDEX `messages_unread_idx` ON `messages` (`unread`);--> statement-breakpoint
CREATE INDEX `messages_sender_idx` ON `messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role_key`);--> statement-breakpoint
CREATE INDEX `users_active_idx` ON `users` (`is_active`);