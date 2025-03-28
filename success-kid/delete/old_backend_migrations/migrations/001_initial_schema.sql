-- Initial database schema for Success Kid Community Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - Core user information
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  auth_provider VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'active'
);

-- User profiles - Extended user information
CREATE TABLE IF NOT EXISTS profiles (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(255),
  social_links JSONB DEFAULT '{}'::JSONB,
  preferences JSONB DEFAULT '{}'::JSONB
);

-- Create index on user display name for search
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);

-- Wallet connections - User's connected cryptocurrency wallets
CREATE TABLE IF NOT EXISTS wallet_connections (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on wallet address to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_connections_address ON wallet_connections(wallet_address);

-- Content - User-created content (posts, comments, etc.)
CREATE TABLE IF NOT EXISTS content (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content_text TEXT,
  media_urls JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'active'
);

-- Create index on content creation date for feed retrieval
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
-- Create index on content type
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
-- Create index on content user_id
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);

-- Comments - Responses to content items
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(255) PRIMARY KEY,
  content_id VARCHAR(255) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  parent_id VARCHAR(255) REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'active'
);

-- Create index on comment parent_id for thread retrieval
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
-- Create index on comment content_id
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id);

-- User Points - Success Points earned through participation
CREATE TABLE IF NOT EXISTS user_points (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL,
  reference_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- Create index on user_id for points totals and history
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
-- Create index on points source for analytics
CREATE INDEX IF NOT EXISTS idx_user_points_source ON user_points(source);
-- Create index on points creation date for time-based queries
CREATE INDEX IF NOT EXISTS idx_user_points_created_at ON user_points(created_at);

-- Achievements - Predefined achievements users can earn
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  points_reward INTEGER NOT NULL DEFAULT 0,
  difficulty VARCHAR(50) NOT NULL,
  requirements JSONB NOT NULL
);

-- User Achievements - Achievements earned by users
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(255) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress JSONB DEFAULT '{}'::JSONB,
  PRIMARY KEY (user_id, achievement_id)
);

-- Create index on unlocked_at for recent achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- Content Reactions - Likes, upvotes, reactions to content
CREATE TABLE IF NOT EXISTS content_reactions (
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id VARCHAR(255) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, content_id, reaction_type)
);

-- Create index for querying reactions by content
CREATE INDEX IF NOT EXISTS idx_content_reactions_content_id ON content_reactions(content_id);

-- Referrals - User referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id VARCHAR(255) PRIMARY KEY,
  referrer_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  converted_at TIMESTAMP WITH TIME ZONE
);

-- Create index on referrer_id for referral counts
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
-- Create index on referred_id
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
