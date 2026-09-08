-- Feedback table for user opinion submissions
-- Run against the bio-app MySQL/MariaDB database

CREATE TABLE IF NOT EXISTS `feedbacks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `content` TEXT NOT NULL,
  `page_url` VARCHAR(2048) NOT NULL,
  `contact_name` VARCHAR(100) NOT NULL DEFAULT '',
  `contact_org` VARCHAR(255) NOT NULL DEFAULT '',
  `contact_phone` VARCHAR(32) NOT NULL DEFAULT '',
  `contact_email` VARCHAR(255) NOT NULL DEFAULT '',
  `images_json` LONGTEXT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` DATETIME(0) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_feedbacks_user_id` (`user_id`),
  INDEX `idx_feedbacks_status` (`status`),
  INDEX `idx_feedbacks_created_at` (`created_at`),
  CONSTRAINT `feedbacks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
