-- Migration: Optimize Indexes for Performance
-- This migration adds strategic indexes to improve query performance across the platform

-- Content table indexes
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
-- Compound index for content feed queries
CREATE INDEX IF NOT EXISTS idx_content_status_created_at ON content(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_status_type_created_at ON content(status, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_user_created_at ON content(user_id, created_at DESC);

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
-- Compound index for content comments
CREATE INDEX IF NOT EXISTS idx_comments_content_created_at ON comments(content_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_content_parent_created ON comments(content_id, parent_id, created_at);

-- User points table indexes
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_source ON user_points(source);
CREATE INDEX IF NOT EXISTS idx_user_points_created_at ON user_points(created_at DESC);
-- Compound index for user points analytics
CREATE INDEX IF NOT EXISTS idx_user_points_user_source ON user_points(user_id, source);
CREATE INDEX IF NOT EXISTS idx_user_points_user_created_at ON user_points(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_source_created_at ON user_points(source, created_at DESC);

-- Content reactions table indexes
CREATE INDEX IF NOT EXISTS idx_content_reactions_content_id ON content_reactions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_reactions_user_id ON content_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_reactions_type ON content_reactions(reaction_type);
CREATE INDEX IF NOT EXISTS idx_content_reactions_created_at ON content_reactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reactions_content_type ON content_reactions(content_id, reaction_type);

-- Redemption table indexes
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_created_at ON redemptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_status ON redemptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_redemptions_status_created_at ON redemptions(status, created_at DESC);

-- Wallet connections table indexes  
CREATE INDEX IF NOT EXISTS idx_wallet_connections_user_id ON wallet_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_wallet_address ON wallet_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_is_verified ON wallet_connections(is_verified);

-- Content tags table indexes
CREATE INDEX IF NOT EXISTS idx_content_tags_content_id ON content_tags(content_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_tag_id ON content_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_combined ON content_tags(content_id, tag_id);

-- User achievements table indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_unlocked ON user_achievements(user_id, unlocked_at DESC);

-- User follows table indexes  
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_combined ON user_follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at DESC);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status_created ON notifications(user_id, status, created_at DESC);

-- Referrals table indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status ON referrals(referrer_id, status);
