/**
 * Migration: Create Streak Tables
 * 
 * Creates tables for streak system: streak_definitions and user_streaks
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createStreakTables: Migration = {
  id: '007',
  name: 'create_streak_tables',
  up: async (client: PoolClient) => {
    // Create streak_definitions table for streak types
    await client.query(`
      CREATE TABLE IF NOT EXISTS streak_definitions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        period_type VARCHAR(20) NOT NULL,
        thresholds JSONB NOT NULL,
        bonus_formula VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure valid activity type
        CONSTRAINT valid_streak_activity_type CHECK (
          activity_type IN (
            'login', 'content_creation', 'engagement', 'challenge', 'custom'
          )
        ),
        
        -- Ensure valid period type
        CONSTRAINT valid_streak_period_type CHECK (
          period_type IN ('daily', 'weekly')
        )
      );
      
      -- Create indexes for streak definitions
      CREATE INDEX IF NOT EXISTS idx_streak_definitions_activity_type ON streak_definitions(activity_type);
      CREATE INDEX IF NOT EXISTS idx_streak_definitions_period_type ON streak_definitions(period_type);
    `);
    
    // Create user_streaks table for tracking user streaks
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_streaks (
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        streak_id VARCHAR(255) NOT NULL REFERENCES streak_definitions(id) ON DELETE CASCADE,
        current_count INTEGER NOT NULL DEFAULT 0,
        longest_count INTEGER NOT NULL DEFAULT 0,
        last_activity_date TIMESTAMP WITH TIME ZONE,
        grace_period_used BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (user_id, streak_id),
        
        -- Ensure non-negative counts
        CONSTRAINT non_negative_current_count CHECK (current_count >= 0),
        CONSTRAINT non_negative_longest_count CHECK (longest_count >= 0)
      );
      
      -- Create indexes for user streaks
      CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_streaks_current_count ON user_streaks(current_count DESC);
      CREATE INDEX IF NOT EXISTS idx_user_streaks_last_activity ON user_streaks(last_activity_date DESC);
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS user_streaks CASCADE;
      DROP TABLE IF EXISTS streak_definitions CASCADE;
    `);
  }
};
