/**
 * Migration: Create Level Tables
 * 
 * Creates tables for level system: levels and user_levels
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createLevelTables: Migration = {
  id: '006',
  name: 'create_level_tables',
  up: async (client: PoolClient) => {
    // Create levels table for level definitions
    await client.query(`
      CREATE TABLE IF NOT EXISTS levels (
        level INTEGER PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        xp_required INTEGER NOT NULL,
        benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
        points_reward INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure positive level and XP values
        CONSTRAINT positive_level CHECK (level > 0),
        CONSTRAINT positive_xp CHECK (xp_required >= 0),
        CONSTRAINT positive_points_reward CHECK (points_reward >= 0)
      );
      
      -- Create index for looking up level by XP required
      CREATE INDEX IF NOT EXISTS idx_levels_xp_required ON levels(xp_required);
    `);
    
    // Create user_levels table for tracking user levels
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_levels (
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        level INTEGER NOT NULL DEFAULT 1,
        current_xp INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (user_id),
        
        -- Ensure positive level and XP values
        CONSTRAINT positive_user_level CHECK (level > 0),
        CONSTRAINT positive_user_xp CHECK (current_xp >= 0)
      );
    `);
    
    // Create xp_transactions table for tracking XP awards
    await client.query(`
      CREATE TABLE IF NOT EXISTS xp_transactions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        source VARCHAR(50) NOT NULL,
        reference_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Create indexes for user_id and source
        CONSTRAINT valid_xp_source CHECK (
          source IN (
            'content_creation', 'comment', 'reaction_received', 'daily_login',
            'streak_bonus', 'achievement', 'referral', 'referral_conversion',
            'milestone', 'profile_completion', 'wallet_connection', 'admin_award',
            'content_featured', 'special_event', 'competition_prize', 'challenge_completion',
            'level_up'
          )
        )
      );
      
      -- Create indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(source);
    `);
    
    // Add level column to profiles table if it doesn't exist
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1
    `);
  },
  down: async (client: PoolClient) => {
    // Remove level column from profiles table if it exists
    await client.query(`
      ALTER TABLE profiles 
      DROP COLUMN IF EXISTS level
    `);
    
    // Drop the tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS xp_transactions CASCADE;
      DROP TABLE IF EXISTS user_levels CASCADE;
      DROP TABLE IF EXISTS levels CASCADE;
    `);
  }
};
