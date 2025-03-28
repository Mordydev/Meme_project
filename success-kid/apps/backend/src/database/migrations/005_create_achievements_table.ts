/**
 * Migration: Create Achievements Tables
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createAchievementsTable: Migration = {
  id: '005',
  name: 'create_achievements_table',
  up: async (client: PoolClient) => {
    // Create achievements table for achievement definitions
    await client.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        points_reward INTEGER NOT NULL DEFAULT 0,
        difficulty VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        requirements JSONB NOT NULL,
        is_public BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure valid difficulty values
        CONSTRAINT valid_achievement_difficulty CHECK (
          difficulty IN ('common', 'uncommon', 'rare', 'epic', 'legendary')
        ),
        
        -- Ensure valid category values
        CONSTRAINT valid_achievement_category CHECK (
          category IN ('content', 'community', 'points', 'profile', 'wallet', 'streak', 'referral', 'special', 'hidden')
        ),
        
        -- Ensure positive points reward
        CONSTRAINT positive_points_reward CHECK (points_reward >= 0)
      );
      
      -- Create indexes for achievements queries
      CREATE INDEX IF NOT EXISTS idx_achievements_difficulty ON achievements(difficulty);
      CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
      CREATE INDEX IF NOT EXISTS idx_achievements_is_public ON achievements(is_public);
    `);
    
    // Create user_achievements table for tracking user progress and unlocks
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id VARCHAR(255) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        progress JSONB DEFAULT '{}'::JSONB,
        notified BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (user_id, achievement_id)
      );
      
      -- Create indexes for user_achievements queries
      CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_achievements_notified ON user_achievements(notified) WHERE notified = FALSE;
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS user_achievements CASCADE;
      DROP TABLE IF EXISTS achievements CASCADE;
    `);
  }
};
