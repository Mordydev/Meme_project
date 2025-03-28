/**
 * Migration: Create Wallet Connections Table
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createWalletConnectionsTable: Migration = {
  id: '006',
  name: 'create_wallet_connections_table',
  up: async (client: PoolClient) => {
    // Create wallet_connections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet_connections (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_address VARCHAR(255) NOT NULL,
        wallet_type VARCHAR(50) NOT NULL DEFAULT 'phantom',
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_verified_at TIMESTAMP WITH TIME ZONE,
        display_name VARCHAR(100),
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB DEFAULT '{}'::JSONB,
        
        -- Ensure valid wallet type values
        CONSTRAINT valid_wallet_type CHECK (
          wallet_type IN ('phantom', 'metamask', 'coinbase', 'walletconnect', 'other')
        )
      );
      
      -- Create unique constraint to prevent duplicates
      CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_connections_address_unique ON wallet_connections(wallet_address);
      
      -- Create indexes for wallet queries
      CREATE INDEX IF NOT EXISTS idx_wallet_connections_user_id ON wallet_connections(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallet_connections_is_verified ON wallet_connections(is_verified);
      CREATE INDEX IF NOT EXISTS idx_wallet_connections_is_primary ON wallet_connections(is_primary) WHERE is_primary = TRUE;
    `);
    
    // Create token_transactions table for tracking token transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS token_transactions (
        id VARCHAR(255) PRIMARY KEY,
        wallet_address VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        transaction_hash VARCHAR(255) NOT NULL,
        amount NUMERIC(20, 8) NOT NULL,
        token_symbol VARCHAR(10) NOT NULL DEFAULT 'SKC',
        transaction_type VARCHAR(10) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        block_number BIGINT,
        metadata JSONB DEFAULT '{}'::JSONB,
        
        -- Ensure valid transaction type values
        CONSTRAINT valid_transaction_type CHECK (
          transaction_type IN ('in', 'out')
        ),
        
        -- Ensure valid status values
        CONSTRAINT valid_transaction_status CHECK (
          status IN ('pending', 'confirmed', 'failed')
        )
      );
      
      -- Create indexes for transaction queries
      CREATE INDEX IF NOT EXISTS idx_token_transactions_wallet ON token_transactions(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_token_transactions_user ON token_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_token_transactions_hash ON token_transactions(transaction_hash);
      CREATE INDEX IF NOT EXISTS idx_token_transactions_timestamp ON token_transactions(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_token_transactions_status ON token_transactions(status);
    `);
    
    // Create token_balances table for caching token balances
    await client.query(`
      CREATE TABLE IF NOT EXISTS token_balances (
        wallet_address VARCHAR(255) PRIMARY KEY,
        token_symbol VARCHAR(10) NOT NULL DEFAULT 'SKC',
        balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
        usd_value NUMERIC(20, 2),
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create index for token symbol queries
      CREATE INDEX IF NOT EXISTS idx_token_balances_symbol ON token_balances(token_symbol);
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS token_balances CASCADE;
      DROP TABLE IF EXISTS token_transactions CASCADE;
      DROP TABLE IF EXISTS wallet_connections CASCADE;
    `);
  }
};
