/**
 * Migration: Create Badge Tables
 * 
 * Creates tables for badge system: badges and user_badges
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createBadgeTables: Migration = {
  id: '008',
  name: 'create_badge_tables',
  up: async (client: PoolClient) => {
    // Create badges table for badge definitions
    await client.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        tier VARCHAR(20) NOT NULL,
        points_value INTEGER NOT NULL DEFAULT 0,
        display_priority INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure valid badge category
        CONSTRAINT valid_badge_category CHECK (
          category IN ('achievement', 'rank', 'event', 'supporter', 'milestone', 'custom')
        ),
        
        -- Ensure valid badge tier
        CONSTRAINT valid_badge_tier CHECK (
          tier IN ('bronze', 'silver', 'gold', 'platinum', 'special')
        ),
        
        -- Ensure non-negative points value
        CONSTRAINT non_negative_points_value CHECK (points_value >= 0)
      );
      
      -- Create indexes for badges
      CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
      CREATE INDEX IF NOT EXISTS idx_badges_tier ON badges(tier);
      CREATE INDEX IF NOT EXISTS idx_badges_display_priority ON badges(display_priority DESC);
    `);
    
    // Create user_badges table for tracking user badges
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_id VARCHAR(255) NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
        awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        source VARCHAR(50) NOT NULL,
        equipped BOOLEAN NOT NULL DEFAULT FALSE,
        slot INTEGER,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (user_id, badge_id),
        
        -- Ensure valid slot (between 0 and 2)
        CONSTRAINT valid_badge_slot CHECK (slot IS NULL OR (slot >= 0 AND slot < 3))
      );
      
      -- Create indexes for user badges
      CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_badges_equipped ON user_badges(user_id) WHERE equipped = TRUE;
      CREATE INDEX IF NOT EXISTS idx_user_badges_awarded_at ON user_badges(awarded_at DESC);
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS user_badges CASCADE;
      DROP TABLE IF EXISTS badges CASCADE;
    `);
  }
};
