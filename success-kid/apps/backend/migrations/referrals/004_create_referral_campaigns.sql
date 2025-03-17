-- Migration: Create Referral Campaigns Table

-- Create type for campaign status
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- Create referral campaigns table
CREATE TABLE referral_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reward_multiplier NUMERIC(5, 2) NOT NULL CHECK (reward_multiplier >= 1),
  eligibility_criteria TEXT,
  max_rewards INTEGER,
  special_code VARCHAR(20) UNIQUE,
  target_audience TEXT,
  status campaign_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- Create indexes
CREATE INDEX idx_referral_campaigns_status ON referral_campaigns(status);
CREATE INDEX idx_referral_campaigns_dates ON referral_campaigns(start_date, end_date);
CREATE INDEX idx_referral_campaigns_special_code ON referral_campaigns(special_code);

-- Add comment
COMMENT ON TABLE referral_campaigns IS 'Stores time-limited referral campaigns with special rewards';

-- Add foreign key constraint to referral_codes table
ALTER TABLE referral_codes 
  ADD CONSTRAINT fk_referral_codes_campaign_id 
  FOREIGN KEY (campaign_id) 
  REFERENCES referral_campaigns(id) 
  ON DELETE SET NULL;

-- Add foreign key constraint to referral_rewards table
ALTER TABLE referral_rewards 
  ADD CONSTRAINT fk_referral_rewards_campaign_id 
  FOREIGN KEY (campaign_id) 
  REFERENCES referral_campaigns(id) 
  ON DELETE SET NULL;
