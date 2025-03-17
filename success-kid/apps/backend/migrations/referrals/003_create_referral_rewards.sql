-- Migration: Create Referral Rewards Table

-- Create type for reward type
CREATE TYPE referral_reward_type AS ENUM ('signup', 'engagement', 'wallet_connection', 'points_milestone');

-- Create type for reward status
CREATE TYPE referral_reward_status AS ENUM ('pending', 'processed', 'rejected');

-- Create referral rewards table
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID NOT NULL REFERENCES referral_tracking(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type referral_reward_type NOT NULL,
  points_amount INTEGER NOT NULL CHECK (points_amount > 0),
  status referral_reward_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  transaction_id UUID,
  campaign_id UUID
);

-- Create indexes
CREATE INDEX idx_referral_rewards_referral_id ON referral_rewards(referral_id);
CREATE INDEX idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
CREATE INDEX idx_referral_rewards_referee_id ON referral_rewards(referee_id);
CREATE INDEX idx_referral_rewards_type ON referral_rewards(type);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX idx_referral_rewards_campaign_id ON referral_rewards(campaign_id);

-- Add comment
COMMENT ON TABLE referral_rewards IS 'Stores rewards earned through the referral program';
