CREATE TABLE `encryptedVaultEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ciphertext` text NOT NULL,
	`iv` varchar(64) NOT NULL,
	`salt` varchar(128) NOT NULL,
	`kdfVersion` varchar(48) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `encryptedVaultEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `encryptedVaultEntries` ADD CONSTRAINT `encryptedVaultEntries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;