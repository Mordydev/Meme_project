/**
 * Migration: Create User Points Table
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createUserPointsTable: Migration = {
  id: '004',
  name: 'create_user_points_table',
  up: async (client: PoolClient) => {
    // Create user_points table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_points (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        source VARCHAR(50) NOT NULL,
        reference_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        description TEXT,
        metadata JSONB DEFAULT '{}'::JSONB,
        
        -- Ensure points amount is never zero
        CONSTRAINT non_zero_points CHECK (amount != 0)
      );
      
      -- Create indexes for efficient queries
      CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_points_created_at ON user_points(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_points_source ON user_points(source);
      
      -- Create composite index for common queries
      CREATE INDEX IF NOT EXISTS idx_user_points_user_source_date ON user_points(user_id, source, created_at DESC);
    `);
    
    // Create points_redemption table for tracking token redemptions
    await client.query(`
      CREATE TABLE IF NOT EXISTS points_redemption (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        points_amount INTEGER NOT NULL,
        token_amount NUMERIC(20, 8) NOT NULL,
        transaction_hash VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}'::JSONB,
        
        -- Ensure amounts are positive
        CONSTRAINT positive_points_amount CHECK (points_amount > 0),
        CONSTRAINT positive_token_amount CHECK (token_amount > 0),
        
        -- Ensure valid status values
        CONSTRAINT valid_redemption_status CHECK (
          status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
        )
      );
      
      -- Create indexes for redemption queries
      CREATE INDEX IF NOT EXISTS idx_redemption_user_id ON points_redemption(user_id);
      CREATE INDEX IF NOT EXISTS idx_redemption_status ON points_redemption(status);
      CREATE INDEX IF NOT EXISTS idx_redemption_created_at ON points_redemption(created_at DESC);
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS points_redemption CASCADE;
      DROP TABLE IF EXISTS user_points CASCADE;
    `);
  }
};
