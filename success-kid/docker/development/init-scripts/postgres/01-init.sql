-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema
CREATE SCHEMA IF NOT EXISTS public;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    auth_provider VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    title VARCHAR(100),
    total_points INTEGER DEFAULT 0,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_connections table
CREATE TABLE IF NOT EXISTS wallet_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_verified_at TIMESTAMP WITH TIME ZONE
);

-- Create content table
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'image', 'link', 'poll')),
    content_text TEXT,
    title VARCHAR(255),
    media_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'flagged'))
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE
);

-- Create user_points table
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL,
    reference_id TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image_url TEXT,
    points_reward INTEGER NOT NULL DEFAULT 0,
    difficulty VARCHAR(20) CHECK (difficulty IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    requirements JSONB DEFAULT '{}'
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, achievement_id)
);

-- Create redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_amount INTEGER NOT NULL,
    token_amount DECIMAL(18, 8) NOT NULL,
    transaction_hash VARCHAR(255),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_points_source ON user_points(source);
CREATE INDEX idx_user_points_created_at ON user_points(created_at);
CREATE INDEX idx_content_user_id ON content(user_id);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_created_at ON content(created_at);
CREATE INDEX idx_comments_content_id ON comments(content_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX idx_redemptions_status ON redemptions(status);
CREATE INDEX idx_wallet_connections_user_id ON wallet_connections(user_id);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);

-- Create sample data for development
INSERT INTO users (id, email, display_name, auth_provider, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin User', 'email', 'active'),
    ('00000000-0000-0000-0000-000000000002', 'user1@example.com', 'Test User 1', 'email', 'active'),
    ('00000000-0000-0000-0000-000000000003', 'user2@example.com', 'Test User 2', 'email', 'active');

INSERT INTO profiles (user_id, bio, level, title, total_points)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Admin account for testing', 10, 'Administrator', 5000),
    ('00000000-0000-0000-0000-000000000002', 'Regular test user account', 3, 'Community Member', 750),
    ('00000000-0000-0000-0000-000000000003', 'Another test user account', 5, 'Content Creator', 1500);

-- Add sample achievements
INSERT INTO achievements (name, description, points_reward, difficulty)
VALUES
    ('First Post', 'Create your first post in the community', 50, 'common'),
    ('Conversation Starter', 'Receive 5 comments on one of your posts', 100, 'common'),
    ('Daily Devotion', 'Log in for 7 consecutive days', 150, 'common'),
    ('Helpful Hand', 'Have 10 of your comments upvoted', 200, 'uncommon'),
    ('Content Creator', 'Create 25 posts', 250, 'uncommon');

-- Add sample points for users
INSERT INTO user_points (user_id, amount, source, description)
VALUES
    ('00000000-0000-0000-0000-000000000001', 5000, 'admin_grant', 'Initial admin points'),
    ('00000000-0000-0000-0000-000000000002', 750, 'signup_bonus', 'Initial signup bonus'),
    ('00000000-0000-0000-0000-000000000003', 1500, 'content_creation', 'Content creation rewards');

-- Add sample content
INSERT INTO content (user_id, type, title, content_text)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'text', 'Welcome to Success Kid Community', 'This is the official welcome post for our community. We''re excited to have you join us!'),
    ('00000000-0000-0000-0000-000000000002', 'text', 'My First Post', 'Hello everyone! This is my first post here.'),
    ('00000000-0000-0000-0000-000000000003', 'text', 'Tips for Earning Points', 'Here are some ways I''ve found to earn points quickly...');

-- Grant some achievements to users
INSERT INTO user_achievements (user_id, achievement_id, progress)
VALUES
    ('00000000-0000-0000-0000-000000000002', (SELECT id FROM achievements WHERE name = 'First Post'), 100),
    ('00000000-0000-0000-0000-000000000003', (SELECT id FROM achievements WHERE name = 'First Post'), 100),
    ('00000000-0000-0000-0000-000000000003', (SELECT id FROM achievements WHERE name = 'Content Creator'), 50);
