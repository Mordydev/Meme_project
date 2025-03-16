/**
 * Migration: Create Reactions Table
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createReactionsTable: Migration = {
  id: '008',
  name: 'create_reactions_table',
  up: async (client: PoolClient) => {
    // Create content_reactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_id VARCHAR(255) REFERENCES content(id) ON DELETE CASCADE,
        comment_id VARCHAR(255) REFERENCES comments(id) ON DELETE CASCADE,
        reaction_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::JSONB,
        
        -- Ensure valid reaction type values
        CONSTRAINT valid_reaction_type CHECK (
          reaction_type IN ('like', 'love', 'laugh', 'support', 'interesting', 'sad', 'success', 'share')
        ),
        
        -- Ensure either content_id or comment_id is provided
        CONSTRAINT content_or_comment CHECK (
          (content_id IS NOT NULL AND comment_id IS NULL) OR
          (content_id IS NULL AND comment_id IS NOT NULL)
        ),
        
        -- Composite primary key to ensure unique reactions
        PRIMARY KEY (
          user_id, 
          COALESCE(content_id, ''), 
          COALESCE(comment_id, ''), 
          reaction_type
        )
      );
      
      -- Create indexes for reaction queries
      CREATE INDEX IF NOT EXISTS idx_reactions_content ON reactions(content_id) WHERE content_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_reactions_comment ON reactions(comment_id) WHERE comment_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_reactions_type ON reactions(reaction_type);
      CREATE INDEX IF NOT EXISTS idx_reactions_created_at ON reactions(created_at DESC);
    `);
    
    -- Create notification_queue table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_queue (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}'::JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        delivered_at TIMESTAMP WITH TIME ZONE,
        read_at TIMESTAMP WITH TIME ZONE,
        is_delivered BOOLEAN DEFAULT FALSE,
        is_read BOOLEAN DEFAULT FALSE,
        priority INTEGER DEFAULT 0,
        
        -- Ensure valid notification type values
        CONSTRAINT valid_notification_type CHECK (
          type IN (
            'reaction', 'comment', 'achievement', 'level_up', 
            'points_awarded', 'referral_complete', 'wallet_connected',
            'redemption_complete', 'system_announcement', 'milestone_reached'
          )
        )
      );
      
      -- Create indexes for notification queries
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notification_queue(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_undelivered ON notification_queue(is_delivered) WHERE is_delivered = FALSE;
      CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notification_queue(is_read) WHERE is_read = FALSE;
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notification_queue(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notification_queue(type);
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS notification_queue CASCADE;
      DROP TABLE IF EXISTS reactions CASCADE;
    `);
  }
};
