-- Wallet extension tables for transaction history, balances, and verification tracking

-- Add additional fields to wallet_connections
ALTER TABLE wallet_connections ADD COLUMN IF NOT EXISTS wallet_type VARCHAR(50) NOT NULL DEFAULT 'phantom';
ALTER TABLE wallet_connections ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE wallet_connections ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE wallet_connections ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- Create token transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id VARCHAR(255) PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  amount NUMERIC(24, 9) NOT NULL,
  token_symbol VARCHAR(50) NOT NULL DEFAULT 'SKC',
  transaction_type VARCHAR(10) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  block_number BIGINT,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create unique index on transaction hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_transactions_hash ON token_transactions(transaction_hash);

-- Create indices for efficient queries
CREATE INDEX IF NOT EXISTS idx_token_transactions_wallet ON token_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_time ON token_transactions(timestamp DESC);

-- Create token balances table
CREATE TABLE IF NOT EXISTS token_balances (
  wallet_address VARCHAR(255) PRIMARY KEY,
  token_symbol VARCHAR(50) NOT NULL DEFAULT 'SKC',
  balance NUMERIC(24, 9) NOT NULL DEFAULT 0,
  usd_value NUMERIC(24, 2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet verification history table
CREATE TABLE IF NOT EXISTS wallet_verifications (
  id VARCHAR(255) PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signature VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_valid BOOLEAN NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create indices for wallet verifications
CREATE INDEX IF NOT EXISTS idx_wallet_verifications_wallet ON wallet_verifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_verifications_user ON wallet_verifications(user_id);

-- Comments for token_transactions columns
COMMENT ON COLUMN token_transactions.id IS 'Unique identifier for the transaction';
COMMENT ON COLUMN token_transactions.wallet_address IS 'Wallet address involved in the transaction';
COMMENT ON COLUMN token_transactions.user_id IS 'User ID associated with the transaction (if known)';
COMMENT ON COLUMN token_transactions.transaction_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN token_transactions.amount IS 'Transaction amount with precision for crypto decimals';
COMMENT ON COLUMN token_transactions.token_symbol IS 'Token symbol (SKC by default)';
COMMENT ON COLUMN token_transactions.transaction_type IS 'Type: in, out, self';
COMMENT ON COLUMN token_transactions.timestamp IS 'When the transaction occurred on the blockchain';
COMMENT ON COLUMN token_transactions.status IS 'Transaction status: pending, confirmed, failed';
COMMENT ON COLUMN token_transactions.block_number IS 'Block number containing the transaction';
COMMENT ON COLUMN token_transactions.metadata IS 'Additional transaction data (from/to addresses, fees, etc.)';

-- Comments for token_balances columns
COMMENT ON COLUMN token_balances.wallet_address IS 'Wallet address';
COMMENT ON COLUMN token_balances.token_symbol IS 'Token symbol (SKC by default)';
COMMENT ON COLUMN token_balances.balance IS 'Current token balance';
COMMENT ON COLUMN token_balances.usd_value IS 'USD equivalent value of the balance';
COMMENT ON COLUMN token_balances.last_updated IS 'When the balance was last updated';

-- Comments for wallet_verifications columns
COMMENT ON COLUMN wallet_verifications.id IS 'Unique identifier for the verification record';
COMMENT ON COLUMN wallet_verifications.wallet_address IS 'Wallet address being verified';
COMMENT ON COLUMN wallet_verifications.user_id IS 'User ID associated with the verification';
COMMENT ON COLUMN wallet_verifications.signature IS 'Cryptographic signature provided for verification';
COMMENT ON COLUMN wallet_verifications.message IS 'Message that was signed';
COMMENT ON COLUMN wallet_verifications.verified_at IS 'When the verification was performed';
COMMENT ON COLUMN wallet_verifications.is_valid IS 'Whether the verification was valid';
COMMENT ON COLUMN wallet_verifications.metadata IS 'Additional verification data';
