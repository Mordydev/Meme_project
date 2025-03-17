-- Migration: Create Referral Codes Table

-- Create type for referral code status
CREATE TYPE referral_code_status AS ENUM ('active', 'inactive', 'expired');

-- Create type for referral code type
CREATE TYPE referral_code_type AS ENUM ('standard', 'custom', 'campaign');

-- Create referral codes table
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  type referral_code_type NOT NULL DEFAULT 'standard',
  status referral_code_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  campaign_id UUID
);

-- Create indexes
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_status ON referral_codes(status);
CREATE INDEX idx_referral_codes_campaign_id ON referral_codes(campaign_id);

-- Add comment
COMMENT ON TABLE referral_codes IS 'Stores user referral codes for tracking and attribution';
