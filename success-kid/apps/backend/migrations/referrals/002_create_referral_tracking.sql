-- Migration: Create Referral Tracking Table

-- Create referral tracking table
CREATE TABLE referral_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code VARCHAR(20) NOT NULL,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visitor_id VARCHAR(128),
  ip_hash VARCHAR(256) NOT NULL,
  user_agent TEXT NOT NULL,
  landing_page VARCHAR(512) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  converted_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  conversion_date TIMESTAMP WITH TIME ZONE,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100)
);

-- Create indexes
CREATE INDEX idx_referral_tracking_referrer_id ON referral_tracking(referrer_id);
CREATE INDEX idx_referral_tracking_referral_code ON referral_tracking(referral_code);
CREATE INDEX idx_referral_tracking_visitor_id ON referral_tracking(visitor_id);
CREATE INDEX idx_referral_tracking_ip_hash ON referral_tracking(ip_hash);
CREATE INDEX idx_referral_tracking_converted_user_id ON referral_tracking(converted_user_id);
CREATE INDEX idx_referral_tracking_created_at ON referral_tracking(created_at);
CREATE INDEX idx_referral_tracking_conversion_date ON referral_tracking(conversion_date);

-- Add comment
COMMENT ON TABLE referral_tracking IS 'Tracks referral link visits and conversions';
