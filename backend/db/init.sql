-- Manual initialization script for scheduler-sync-overpass rollout.
-- Run this after deployment only if the ApplicationRunner startup truncation
-- is disabled or if you prefer to prepare the table before the first sync.
TRUNCATE TABLE oasis_spots;
