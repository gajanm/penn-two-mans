-- Migration: Create weekly_matches table for storing weekly duo matches
-- Run this in your Supabase SQL editor

-- Create weekly_matches table
CREATE TABLE IF NOT EXISTS weekly_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The four users in the match (two duos)
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user3_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user4_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Match metadata
  compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  match_reasons TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Week tracking (Tuesday start of week)
  match_week TIMESTAMPTZ NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no duplicate matches in the same week
  CONSTRAINT unique_week_match UNIQUE (user1_id, user2_id, user3_id, user4_id, match_week),
  
  -- Ensure all users are different
  CONSTRAINT different_users CHECK (
    user1_id != user2_id AND
    user1_id != user3_id AND
    user1_id != user4_id AND
    user2_id != user3_id AND
    user2_id != user4_id AND
    user3_id != user4_id
  )
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_matches_week ON weekly_matches(match_week);
CREATE INDEX IF NOT EXISTS idx_weekly_matches_user1 ON weekly_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_weekly_matches_user2 ON weekly_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_weekly_matches_user3 ON weekly_matches(user3_id);
CREATE INDEX IF NOT EXISTS idx_weekly_matches_user4 ON weekly_matches(user4_id);

-- Create a composite index for user lookups
CREATE INDEX IF NOT EXISTS idx_weekly_matches_users ON weekly_matches(user1_id, user2_id, user3_id, user4_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weekly_matches_updated_at
    BEFORE UPDATE ON weekly_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE weekly_matches IS 'Stores weekly matches between duos (pairs of users)';
COMMENT ON COLUMN weekly_matches.user1_id IS 'First user of first duo';
COMMENT ON COLUMN weekly_matches.user2_id IS 'Second user of first duo';
COMMENT ON COLUMN weekly_matches.user3_id IS 'First user of second duo';
COMMENT ON COLUMN weekly_matches.user4_id IS 'Second user of second duo';
COMMENT ON COLUMN weekly_matches.match_week IS 'Tuesday start date of the match week';
COMMENT ON COLUMN weekly_matches.compatibility_score IS 'Compatibility score from 0-100';
COMMENT ON COLUMN weekly_matches.match_reasons IS 'Array of reasons why these duos matched';


