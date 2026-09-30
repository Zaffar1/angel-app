-- Migration: Add status enum column to mission_assigned_volunteers
-- Features: Track volunteer status individually ('pending', 'started', 'in_progress', 'completed')

-- 1. Add status enum column if it does not already exist
ALTER TABLE `mission_assigned_volunteers`
ADD COLUMN `status` ENUM('pending', 'started', 'in_progress', 'completed') NOT NULL DEFAULT 'pending';

-- 2. Add indexes for status to optimize queries involving filtering by volunteer mission status
CREATE INDEX `idx_mission_assigned_volunteers_status` ON `mission_assigned_volunteers` (`status`);
CREATE INDEX `idx_mission_assigned_volunteers_user_mission` ON `mission_assigned_volunteers` (`volunteer_id`, `mission_id`);
