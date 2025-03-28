/**
 * Migration: Create Leaderboard Tables
 * 
 * Creates tables for leaderboard system: leaderboard_entries
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createLeaderboardTables: Migration = {
  id: '010',
  name: 'create_leaderboard_tables',
  up: async (client: PoolClient) => {
    // Create leaderboard_entries table for tracking user rankings
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaderboard_entries (
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rank INTEGER NOT NULL,
        score FLOAT NOT NULL,
        previous_rank INTEGER,
        category VARCHAR(50) NOT NULL,
        period VARCHAR(20) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (user_id, category, period),
        
        -- Ensure valid leaderboard category
        CONSTRAINT valid_leaderboard_category CHECK (
          category IN ('points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite')
        ),
        
        -- Ensure valid leaderboard period
        CONSTRAINT valid_leaderboard_period CHECK (
          period IN ('daily', 'weekly', 'monthly', 'seasonal', 'allTime')
        ),
        
        -- Ensure positive rank
        CONSTRAINT positive_rank CHECK (rank > 0)
      );
      
      -- Create indexes for leaderboard entries
      CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_category_period ON 
        leaderboard_entries(category, period);
      CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON 
        leaderboard_entries(category, period, rank);
      CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score ON 
        leaderboard_entries(category, period, score DESC);
    `);
    
    // Create leaderboard_snapshots table for historical rankings
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
        id VARCHAR(255) PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        period VARCHAR(20) NOT NULL,
        snapshot_date DATE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure valid leaderboard category
        CONSTRAINT valid_snapshot_category CHECK (
          category IN ('points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite')
        ),
        
        -- Ensure valid leaderboard period
        CONSTRAINT valid_snapshot_period CHECK (
          period IN ('daily', 'weekly', 'monthly', 'seasonal', 'allTime')
        )
      );
      
      -- Create unique index for leaderboard snapshots
      CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_snapshots_unique ON 
        leaderboard_snapshots(category, period, snapshot_date);
      
      -- Create index for finding snapshots by date
      CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_date ON 
        leaderboard_snapshots(snapshot_date DESC);
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS leaderboard_snapshots CASCADE;
      DROP TABLE IF EXISTS leaderboard_entries CASCADE;
    `);
  }
};
