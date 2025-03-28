/**
 * Migration: Create Redemptions Tables
 * 
 * Creates tables for managing point redemptions and batches.
 */
import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  // Create redemptions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS redemptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      points_amount INTEGER NOT NULL CHECK (points_amount > 0),
      token_amount DECIMAL(18, 6) NOT NULL CHECK (token_amount > 0),
      wallet_address TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      processed_at TIMESTAMP WITH TIME ZONE,
      transaction_hash TEXT,
      points_transaction_id UUID REFERENCES user_points(id),
      error_message TEXT,
      batch_id UUID,
      metadata JSONB DEFAULT '{}'::JSONB
    );
    
    -- Indexes
    CREATE INDEX IF NOT EXISTS redemptions_user_id_idx ON redemptions(user_id);
    CREATE INDEX IF NOT EXISTS redemptions_status_idx ON redemptions(status);
    CREATE INDEX IF NOT EXISTS redemptions_batch_id_idx ON redemptions(batch_id);
    CREATE INDEX IF NOT EXISTS redemptions_created_at_idx ON redemptions(created_at);
  `);
  
  // Create redemption_batches table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS redemption_batches (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      processed_at TIMESTAMP WITH TIME ZONE,
      redemption_count INTEGER NOT NULL DEFAULT 0,
      total_points INTEGER NOT NULL DEFAULT 0,
      total_tokens DECIMAL(18, 6) NOT NULL DEFAULT 0,
      transaction_hash TEXT,
      error_message TEXT,
      processor_id TEXT,
      metadata JSONB DEFAULT '{}'::JSONB
    );
    
    -- Indexes
    CREATE INDEX IF NOT EXISTS redemption_batches_status_idx ON redemption_batches(status);
    CREATE INDEX IF NOT EXISTS redemption_batches_created_at_idx ON redemption_batches(created_at);
    
    -- Add foreign key to redemptions table
    ALTER TABLE redemptions
    ADD CONSTRAINT fk_redemptions_batch
    FOREIGN KEY (batch_id) REFERENCES redemption_batches(id);
  `);
}

export async function down(pool: Pool): Promise<void> {
  // Drop tables in reverse order
  await pool.query(`
    -- Remove foreign key constraint first
    ALTER TABLE IF EXISTS redemptions
    DROP CONSTRAINT IF EXISTS fk_redemptions_batch;
    
    -- Drop tables
    DROP TABLE IF EXISTS redemption_batches;
    DROP TABLE IF EXISTS redemptions;
  `);
}
