-- Add redemption table for points-to-token redemption

-- Redemptions table - Records of points-to-token redemption requests
CREATE TABLE IF NOT EXISTS redemptions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  token_amount FLOAT NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  transaction_hash VARCHAR(255),
  error_message TEXT
);

-- Create indices for efficient queries
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_created_at ON redemptions(created_at);

-- Comments for columns
COMMENT ON COLUMN redemptions.id IS 'Unique identifier for the redemption request';
COMMENT ON COLUMN redemptions.user_id IS 'User who requested the redemption';
COMMENT ON COLUMN redemptions.points_amount IS 'Number of Success Points being redeemed';
COMMENT ON COLUMN redemptions.token_amount IS 'Number of SKC tokens to be awarded';
COMMENT ON COLUMN redemptions.wallet_address IS 'Wallet address to receive the tokens';
COMMENT ON COLUMN redemptions.status IS 'Current status: pending, processing, completed, failed';
COMMENT ON COLUMN redemptions.created_at IS 'When the redemption was requested';
COMMENT ON COLUMN redemptions.processed_at IS 'When the redemption was processed';
COMMENT ON COLUMN redemptions.transaction_hash IS 'Blockchain transaction hash for completed redemptions';
COMMENT ON COLUMN redemptions.error_message IS 'Error message for failed redemptions';
