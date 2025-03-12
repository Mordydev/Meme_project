-- Wild 'n Out Meme Coin Platform - Database Schema Part 1 (Fixed)
-- This part includes core tables, basic indexes, and simple constraints

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =============================================
-- CORE USER SYSTEM
-- =============================================

-- USER PROFILES
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE, -- Clerk Auth ID
  username VARCHAR(30) NOT NULL UNIQUE,
  display_name VARCHAR(50) NOT NULL,
  bio TEXT,
  image_url TEXT,
  stats JSONB NOT NULL DEFAULT '{
    "battleCount": 0,
    "battleWins": 0,
    "contentCount": 0,
    "followerCount": 0,
    "followingCount": 0,
    "totalPoints": 0,
    "level": 1
  }',
  preferences JSONB NOT NULL DEFAULT '{
    "notifications": true,
    "privacy": "public",
    "theme": "default"
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_user_profiles_username ON user_profiles USING btree (username);
CREATE INDEX idx_user_profiles_display_name ON user_profiles USING gin (display_name gin_trgm_ops);

-- USER FOLLOWS
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, followed_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_followed ON follows(followed_id);

-- USER RELATIONSHIPS (BLOCK/MUTE)
CREATE TABLE user_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- block, mute
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_id, type)
);

CREATE INDEX idx_user_relationships_user ON user_relationships(user_id);
CREATE INDEX idx_user_relationships_target ON user_relationships(target_id);
CREATE INDEX idx_user_relationships_type ON user_relationships(type);

-- USER ACTIVITY TRACKING
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_sessions_start ON user_sessions(start_time DESC);

-- LOGIN STREAKS
CREATE TABLE user_login_streaks (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- POINTS & ACHIEVEMENTS SYSTEM
-- =============================================

-- USER POINTS
CREATE TABLE user_points (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_points_total ON user_points(total_points DESC);

-- POINT TRANSACTIONS
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL, -- From PointsSource enum
  detail TEXT,
  multiplier FLOAT NOT NULL DEFAULT 1,
  reference_id UUID,
  reference_type VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_created ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_source ON point_transactions(source);
CREATE INDEX idx_point_transactions_user_source ON point_transactions(user_id, source, created_at DESC);

-- ACHIEVEMENTS
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(30) NOT NULL, -- battle, content, community, token, special
  tier VARCHAR(20) NOT NULL, -- bronze, silver, gold, platinum
  icon VARCHAR(50) NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 0,
  criteria TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_tier ON achievements(tier);

-- USER ACHIEVEMENTS
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0, -- 0-100 percentage
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(unlocked_at);
CREATE INDEX idx_user_achievements_user_progress ON user_achievements(user_id, progress, unlocked_at);

-- =============================================
-- TOKEN & WALLET SYSTEM
-- =============================================

-- USER WALLETS
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  provider VARCHAR(20) NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, address)
);

CREATE INDEX idx_user_wallets_address ON user_wallets(address);
CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);

-- WALLET VERIFICATION MESSAGES
CREATE TABLE wallet_verification_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_verification_messages_user ON wallet_verification_messages(user_id);
CREATE INDEX idx_wallet_verification_messages_expires ON wallet_verification_messages(expires);

-- USER TOKEN HOLDINGS
CREATE TABLE user_token_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
  token_amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  tier VARCHAR(20) NOT NULL, -- bronze, silver, gold, platinum
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, wallet_id)
);

CREATE INDEX idx_user_token_holdings_user ON user_token_holdings(user_id);
CREATE INDEX idx_user_token_holdings_tier ON user_token_holdings(tier);

-- TOKEN BENEFITS
CREATE TABLE token_benefits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  min_tier VARCHAR(20) NOT NULL, -- bronze, silver, gold, platinum
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- USER TOKEN BENEFITS
CREATE TABLE user_token_benefits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  benefit_id UUID NOT NULL REFERENCES token_benefits(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, benefit_id)
);

CREATE INDEX idx_user_token_benefits_user ON user_token_benefits(user_id);

-- TOKEN PRICE HISTORY
-- Updated to avoid immutability issues with function-based indexes
CREATE TABLE token_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  price NUMERIC(20, 8) NOT NULL,
  market_cap NUMERIC(20, 2),
  volume_24h NUMERIC(20, 2),
  change_24h NUMERIC(5, 2), -- percentage
  source VARCHAR(50) NOT NULL, -- API source
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Add explicit time period columns for indexing
  hour_bucket INTEGER NOT NULL,
  day_bucket INTEGER NOT NULL,
  month_bucket INTEGER NOT NULL,
  year_bucket INTEGER NOT NULL
);

-- Create trigger function to populate time buckets
CREATE OR REPLACE FUNCTION set_time_buckets()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hour_bucket := EXTRACT(HOUR FROM NEW.timestamp);
  NEW.day_bucket := EXTRACT(DAY FROM NEW.timestamp);
  NEW.month_bucket := EXTRACT(MONTH FROM NEW.timestamp);
  NEW.year_bucket := EXTRACT(YEAR FROM NEW.timestamp);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set time buckets automatically
CREATE TRIGGER set_token_price_time_buckets
BEFORE INSERT ON token_price_history
FOR EACH ROW
EXECUTE FUNCTION set_time_buckets();

-- Create unique index on time buckets instead of using date_trunc
CREATE UNIQUE INDEX idx_token_price_hourly ON token_price_history(year_bucket, month_bucket, day_bucket, hour_bucket);
CREATE INDEX idx_token_price_timestamp ON token_price_history(timestamp DESC);

-- MARKET CAP MILESTONES
CREATE TABLE market_cap_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_value NUMERIC(20, 2) NOT NULL,
  description TEXT,
  achieved_at TIMESTAMPTZ,
  celebrated BOOLEAN NOT NULL DEFAULT FALSE,
  announced BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_market_cap_milestones_value ON market_cap_milestones(milestone_value);
CREATE INDEX idx_market_cap_milestones_achieved ON market_cap_milestones(achieved_at);

-- =============================================
-- BATTLE SYSTEM
-- =============================================

-- BATTLE CATEGORIES
CREATE TABLE battle_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BATTLES
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  battle_type VARCHAR(30) NOT NULL, -- wildStyle, pickUpKillIt, rAndBeef, tournament
  category_id UUID REFERENCES battle_categories(id) ON DELETE SET NULL,
  rules JSONB NOT NULL DEFAULT '{
    "prompt": "",
    "mediaTypes": ["text"],
    "maxDuration": null,
    "minLength": null,
    "maxLength": null,
    "additionalRules": []
  }',
  status VARCHAR(20) NOT NULL, -- draft, scheduled, open, voting, completed
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  voting_start_time TIMESTAMPTZ NOT NULL,
  voting_end_time TIMESTAMPTZ NOT NULL,
  participant_count INTEGER NOT NULL DEFAULT 0,
  entry_count INTEGER NOT NULL DEFAULT 0,
  vote_count INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  example_entries TEXT[] DEFAULT '{}',
  results_calculated_at TIMESTAMPTZ,
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_featured ON battles(featured) WHERE featured = TRUE;
CREATE INDEX idx_battles_creator ON battles(creator_id);
CREATE INDEX idx_battles_start_time ON battles(start_time);
CREATE INDEX idx_battles_end_time ON battles(end_time);
CREATE INDEX idx_battles_type ON battles(battle_type);
CREATE INDEX idx_battles_category ON battles(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX battles_search_idx ON battles USING gin(search_vector);

-- BATTLE ENTRIES
CREATE TABLE battle_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  moderation JSONB NOT NULL DEFAULT '{
    "status": "pending",
    "reviewerId": null,
    "reviewedAt": null,
    "reason": null
  }',
  metrics JSONB NOT NULL DEFAULT '{
    "viewCount": 0,
    "voteCount": 0,
    "commentCount": 0,
    "shareCount": 0
  }',
  rank INTEGER,
  tied_with UUID[] DEFAULT NULL,
  submission_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_battle_entries_battle ON battle_entries(battle_id);
CREATE INDEX idx_battle_entries_user ON battle_entries(user_id);
CREATE INDEX idx_battle_entries_rank ON battle_entries(rank);
CREATE INDEX idx_battle_entries_moderation ON battle_entries((moderation->>'status'));
CREATE INDEX idx_battle_entries_user_created ON battle_entries(user_id, created_at DESC);

-- BATTLE VOTES
CREATE TABLE battle_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES battle_entries(id) ON DELETE CASCADE,
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entry_id, voter_id)
);

CREATE INDEX idx_battle_votes_entry ON battle_votes(entry_id);
CREATE INDEX idx_battle_votes_battle ON battle_votes(battle_id);
CREATE INDEX idx_battle_votes_voter ON battle_votes(voter_id);
CREATE INDEX idx_battle_votes_created ON battle_votes(created_at);