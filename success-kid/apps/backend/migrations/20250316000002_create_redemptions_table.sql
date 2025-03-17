-- Create redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  points_amount INTEGER NOT NULL,
  token_amount DECIMAL(18, 9) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'flagged')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  transaction_hash VARCHAR(255),
  failure_reason TEXT,
  metadata JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_requested_at ON redemptions(requested_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_wallet_address ON redemptions(wallet_address);

-- Create transaction_history table for audit and reconciliation
CREATE TABLE IF NOT EXISTS transaction_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_hash VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  amount DECIMAL(18, 9) NOT NULL,
  token_address VARCHAR(255) NOT NULL,
  block_number BIGINT,
  confirmations INTEGER,
  gas_used BIGINT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redemption_id UUID REFERENCES redemptions(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_history_tx_hash ON transaction_history(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transaction_history_redemption_id ON transaction_history(redemption_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_from_address ON transaction_history(from_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_to_address ON transaction_history(to_address);

-- Add reconciliation results table
CREATE TABLE IF NOT EXISTS reconciliation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_redemptions INTEGER NOT NULL,
  total_blockchain_transactions INTEGER NOT NULL,
  matched_transactions INTEGER NOT NULL,
  discrepancies JSONB,
  reconciliation_rate DECIMAL(5, 2) NOT NULL,
  executed_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create view for redemption analytics
CREATE OR REPLACE VIEW redemption_metrics AS
SELECT
  DATE_TRUNC('day', requested_at) AS day,
  COUNT(*) AS total_redemptions,
  SUM(points_amount) AS total_points_redeemed,
  SUM(token_amount) AS total_tokens_distributed,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_redemptions,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_redemptions,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_redemptions,
  COUNT(CASE WHEN status = 'processing' THEN 1 END) AS processing_redemptions,
  COUNT(CASE WHEN status = 'flagged' THEN 1 END) AS flagged_redemptions,
  AVG(EXTRACT(EPOCH FROM (processed_at - requested_at)) * 1000) AS avg_processing_time_ms
FROM redemptions
GROUP BY DATE_TRUNC('day', requested_at)
ORDER BY DATE_TRUNC('day', requested_at) DESC;
