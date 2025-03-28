/**
 * Migration: Create Referrals Tables
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createReferralsTable: Migration = {
  id: '007',
  name: 'create_referrals_table',
  up: async (client: PoolClient) => {
    // Create referrals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id VARCHAR(255) PRIMARY KEY,
        referrer_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        converted_at TIMESTAMP WITH TIME ZONE,
        rewarded_at TIMESTAMP WITH TIME ZONE,
        reward_amount INTEGER,
        campaign_id VARCHAR(255),
        referral_code VARCHAR(100),
        source VARCHAR(100),
        metadata JSONB DEFAULT '{}'::JSONB,
        
        -- Ensure valid status values
        CONSTRAINT valid_referral_status CHECK (
          status IN ('pending', 'completed', 'converted', 'rewarded', 'expired', 'invalid')
        ),
        
        -- Ensure referrer and referred are different users
        CONSTRAINT different_users CHECK (referrer_id != referred_id)
      );
      
      -- Create indexes for referral queries
      CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
      CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
      CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
      CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_referrals_campaign ON referrals(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
    `);
    
    // Create referral_codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_codes (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        uses INTEGER NOT NULL DEFAULT 0,
        max_uses INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        campaign_id VARCHAR(255)
      );
      
      -- Create unique constraint on code
      CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_codes_unique ON referral_codes(code);
      
      -- Create indexes for referral code queries
      CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
      CREATE INDEX IF NOT EXISTS idx_referral_codes_is_active ON referral_codes(is_active);
      CREATE INDEX IF NOT EXISTS idx_referral_codes_campaign ON referral_codes(campaign_id);
    `);
    
    // Create referral_campaigns table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_campaigns (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        end_date TIMESTAMP WITH TIME ZONE,
        reward_amount INTEGER NOT NULL DEFAULT 0,
        referred_reward_amount INTEGER DEFAULT 0,
        max_referrals INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        requirements JSONB DEFAULT '{}'::JSONB,
        metadata JSONB DEFAULT '{}'::JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create indexes for campaign queries
      CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON referral_campaigns(is_active);
      CREATE INDEX IF NOT EXISTS idx_campaigns_date_range ON referral_campaigns(start_date, end_date);
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS referral_campaigns CASCADE;
      DROP TABLE IF EXISTS referral_codes CASCADE;
      DROP TABLE IF EXISTS referrals CASCADE;
    `);
  }
};
