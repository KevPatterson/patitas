CREATE TABLE `adoption_requests` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`publicationId` bigint unsigned NOT NULL,
	`requesterId` bigint unsigned NOT NULL,
	`message` text,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adoption_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`actorId` bigint unsigned,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(60) NOT NULL,
	`entityId` varchar(60),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`publicationId` bigint unsigned NOT NULL,
	`authorId` bigint unsigned NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`type` enum('match','comment','report','resolved','nearby','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`publicationSlug` varchar(120),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `publication_images` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`publicationId` bigint unsigned NOT NULL,
	`storageKey` varchar(600) NOT NULL,
	`sortOrder` bigint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publication_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `publications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`ownerId` bigint unsigned NOT NULL,
	`type` enum('lost','found','abandoned','adoption','sighting') NOT NULL,
	`status` enum('active','resolved','expired','hidden','deleted') NOT NULL DEFAULT 'active',
	`petName` varchar(120),
	`species` enum('dog','cat','bird','rabbit','rodent','reptile','other') NOT NULL,
	`breed` varchar(120),
	`sex` enum('male','female','unknown') NOT NULL DEFAULT 'unknown',
	`age` enum('puppy','young','adult','senior','unknown') NOT NULL DEFAULT 'unknown',
	`size` enum('small','medium','large','unknown') NOT NULL DEFAULT 'unknown',
	`color` varchar(120),
	`features` text,
	`hasCollar` boolean NOT NULL DEFAULT false,
	`hasTag` boolean NOT NULL DEFAULT false,
	`microchip` varchar(60),
	`description` text,
	`province` varchar(80) NOT NULL,
	`municipality` varchar(80),
	`zone` varchar(120),
	`approxLat` double,
	`approxLng` double,
	`eventDate` timestamp,
	`eventTime` varchar(20),
	`reward` boolean NOT NULL DEFAULT false,
	`rewardDetails` varchar(255),
	`needsVet` boolean NOT NULL DEFAULT false,
	`specialNeeds` text,
	`instructions` text,
	`contactPhone` varchar(40),
	`contactWhatsapp` varchar(40),
	`contactEmail` varchar(320),
	`showPhone` boolean NOT NULL DEFAULT false,
	`showEmail` boolean NOT NULL DEFAULT false,
	`allowInternalContact` boolean NOT NULL DEFAULT true,
	`resolvedStory` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`deletedAt` timestamp,
	CONSTRAINT `publications_id` PRIMARY KEY(`id`),
	CONSTRAINT `publications_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`publicationId` bigint unsigned NOT NULL,
	`reporterId` bigint unsigned,
	`reason` enum('fake','spam','scam','duplicate','already_recovered','inappropriate','other') NOT NULL,
	`description` text,
	`status` enum('pending','reviewing','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`resolvedBy` bigint unsigned,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sightings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`publicationId` bigint unsigned NOT NULL,
	`userId` bigint unsigned,
	`note` text,
	`province` varchar(80),
	`municipality` varchar(80),
	`zone` varchar(120),
	`approxLat` double,
	`approxLng` double,
	`seenAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sightings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255),
	`name` varchar(255),
	`avatar` text,
	`googleId` varchar(255),
	`emailVerified` boolean NOT NULL DEFAULT false,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_googleId_unique` UNIQUE(`googleId`)
);
--> statement-breakpoint
CREATE INDEX `adopt_pub_idx` ON `adoption_requests` (`publicationId`);--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_logs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `com_pub_idx` ON `comments` (`publicationId`);--> statement-breakpoint
CREATE INDEX `notif_user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `img_pub_idx` ON `publication_images` (`publicationId`);--> statement-breakpoint
CREATE INDEX `pub_type_idx` ON `publications` (`type`);--> statement-breakpoint
CREATE INDEX `pub_status_idx` ON `publications` (`status`);--> statement-breakpoint
CREATE INDEX `pub_species_idx` ON `publications` (`species`);--> statement-breakpoint
CREATE INDEX `pub_province_idx` ON `publications` (`province`);--> statement-breakpoint
CREATE INDEX `pub_owner_idx` ON `publications` (`ownerId`);--> statement-breakpoint
CREATE INDEX `pub_created_idx` ON `publications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `rep_pub_idx` ON `reports` (`publicationId`);--> statement-breakpoint
CREATE INDEX `rep_status_idx` ON `reports` (`status`);--> statement-breakpoint
CREATE INDEX `sight_pub_idx` ON `sightings` (`publicationId`);