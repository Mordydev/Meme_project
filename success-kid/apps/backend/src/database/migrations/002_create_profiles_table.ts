/**
 * Migration: Create Profiles Table
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createProfilesTable: Migration = {
  id: '002',
  name: 'create_profiles_table',
  up: async (client: PoolClient) => {
    // Create the profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        bio TEXT,
        avatar_url TEXT,
        level INTEGER NOT NULL DEFAULT 1,
        title VARCHAR(255),
        total_points INTEGER NOT NULL DEFAULT 0,
        social_links JSONB DEFAULT '{}'::JSONB,
        preferences JSONB DEFAULT '{}'::JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure level is positive
        CONSTRAINT positive_level CHECK (level > 0)
      );
      
      -- Create indexes for common query patterns
      CREATE INDEX IF NOT EXISTS idx_profiles_level ON profiles(level);
      CREATE INDEX IF NOT EXISTS idx_profiles_total_points ON profiles(total_points);
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the profiles table
    await client.query(`
      DROP TABLE IF EXISTS profiles CASCADE;
    `);
  }
};
