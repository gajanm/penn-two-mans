-- ============================================
-- Database Reset Script
-- ============================================
-- WARNING: This will delete ALL data from your database!
-- Use this script to completely reset your database for development/testing.
--
-- To run this:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run" or press Cmd/Ctrl + Enter
-- ============================================

-- Step 1: Delete all data from custom tables (in correct order to respect foreign keys)
-- Delete weekly_matches first (no dependencies)
DELETE FROM weekly_matches;

-- Delete partner_invites (references profiles)
DELETE FROM partner_invites;

-- Delete survey_responses (references profiles)
DELETE FROM survey_responses;

-- Delete profiles (references auth.users)
DELETE FROM profiles;

-- Step 2: Delete all users from Supabase Auth
-- This will cascade and remove any remaining references
DELETE FROM auth.users;

-- Step 3: Reset sequences (if you have any auto-incrementing IDs)
-- Note: UUIDs don't use sequences, but included for completeness
-- ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;

-- ============================================
-- Verification Queries (run these after reset)
-- ============================================

-- Check if all tables are empty
SELECT 
  'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 
  'survey_responses', COUNT(*) FROM survey_responses
UNION ALL
SELECT 
  'partner_invites', COUNT(*) FROM partner_invites
UNION ALL
SELECT 
  'weekly_matches', COUNT(*) FROM weekly_matches
UNION ALL
SELECT 
  'auth.users', COUNT(*) FROM auth.users;

-- Expected result: All counts should be 0


