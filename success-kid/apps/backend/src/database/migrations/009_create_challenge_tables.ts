/**
 * Migration: Create Challenge Tables
 * 
 * Creates tables for challenge system: challenges, user_challenges, and user_challenge_progress
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createChallengeTables: Migration = {
  id: '009',
  name: 'create_challenge_tables',
  up: async (client: PoolClient) => {
    // Create challenges table for challenge definitions
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        category VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        requirements JSONB NOT NULL,
        rewards JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure valid challenge category
        CONSTRAINT valid_challenge_category CHECK (
          category IN ('daily', 'weekly', 'seasonal', 'special', 'onboarding')
        ),
        
        -- Ensure valid challenge difficulty
        CONSTRAINT valid_challenge_difficulty CHECK (
          difficulty IN ('easy', 'medium', 'hard', 'expert')
        ),
        
        -- Ensure valid challenge status
        CONSTRAINT valid_challenge_status CHECK (
          status IN ('upcoming', 'active', 'completed', 'expired')
        ),
        
        -- Ensure end date is after start date
        CONSTRAINT valid_challenge_dates CHECK (end_date > start_date)
      );
      
      -- Create indexes for challenges
      CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
      CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
      CREATE INDEX IF NOT EXISTS idx_challenges_start_date ON challenges(start_date);
      CREATE INDEX IF NOT EXISTS idx_challenges_end_date ON challenges(end_date);
      CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(start_date, end_date) 
        WHERE status = 'active';
    `);
    
    // Create user_challenges table for tracking user challenge participation
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_challenges (
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        challenge_id VARCHAR(255) NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (user_id, challenge_id),
        
        -- Ensure valid user challenge status
        CONSTRAINT valid_user_challenge_status CHECK (
          status IN ('active', 'completed', 'abandoned')
        )
      );
      
      -- Create indexes for user challenges
      CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);
      CREATE INDEX IF NOT EXISTS idx_user_challenges_joined_at ON user_challenges(joined_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_challenges_completed_at ON user_challenges(completed_at DESC);
    `);
    
    // Create user_challenge_progress table for tracking progress on requirements
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_challenge_progress (
        user_id VARCHAR(255) NOT NULL,
        challenge_id VARCHAR(255) NOT NULL,
        requirement_id VARCHAR(255) NOT NULL,
        current_value FLOAT NOT NULL DEFAULT 0,
        target_value FLOAT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (user_id, challenge_id, requirement_id),
        FOREIGN KEY (user_id, challenge_id) REFERENCES user_challenges(user_id, challenge_id) ON DELETE CASCADE,
        
        -- Ensure non-negative values
        CONSTRAINT non_negative_current_value CHECK (current_value >= 0),
        CONSTRAINT positive_target_value CHECK (target_value > 0)
      );
      
      -- Create indexes for user challenge progress
      CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user_challenge ON 
        user_challenge_progress(user_id, challenge_id);
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS user_challenge_progress CASCADE;
      DROP TABLE IF EXISTS user_challenges CASCADE;
      DROP TABLE IF EXISTS challenges CASCADE;
    `);
  }
};
