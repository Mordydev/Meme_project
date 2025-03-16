/**
 * Migration: Add Optimized Indexes
 * 
 * This migration adds additional optimized indexes for common query patterns
 * based on expected application usage.
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const addOptimizedIndexes: Migration = {
  id: '009',
  name: 'add_optimized_indexes',
  up: async (client: PoolClient) => {
    // Add full text search index for content
    await client.query(`
      -- Full text search index for content
      CREATE INDEX IF NOT EXISTS idx_content_text_search ON content 
      USING gin(to_tsvector('english', content_text));
      
      -- Partial index for active content for faster feed queries
      CREATE INDEX IF NOT EXISTS idx_content_active_created 
      ON content(created_at DESC) 
      WHERE status = 'active';
      
      -- Optimize profile queries with compound index
      CREATE INDEX IF NOT EXISTS idx_profiles_level_points
      ON profiles(level DESC, total_points DESC);
      
      -- Optimize user points queries with compound index
      CREATE INDEX IF NOT EXISTS idx_user_points_user_source_created
      ON user_points(user_id, source, created_at DESC);
      
      -- Optimize points aggregation with partial indexes
      CREATE INDEX IF NOT EXISTS idx_user_points_positive
      ON user_points(user_id, amount)
      WHERE amount > 0;
      
      CREATE INDEX IF NOT EXISTS idx_user_points_negative
      ON user_points(user_id, amount)
      WHERE amount < 0;
      
      -- Optimize comment threading with composite index
      CREATE INDEX IF NOT EXISTS idx_comments_content_parent
      ON comments(content_id, parent_id, created_at DESC);
      
      -- Optimize achievement progress tracking
      CREATE INDEX IF NOT EXISTS idx_user_achievements_progress
      ON user_achievements USING gin(progress);
      
      -- Optimize referral analysis
      CREATE INDEX IF NOT EXISTS idx_referrals_created_converted
      ON referrals(created_at, converted_at);
      
      -- Optimize transaction analysis
      CREATE INDEX IF NOT EXISTS idx_token_transactions_wallet_type
      ON token_transactions(wallet_address, transaction_type, timestamp DESC);
      
      -- Optimize notification delivery
      CREATE INDEX IF NOT EXISTS idx_notifications_delivery_queue
      ON notification_queue(is_delivered, priority DESC, created_at ASC)
      WHERE is_delivered = FALSE;
    `);
  },
  down: async (client: PoolClient) => {
    // Drop all the added indexes
    await client.query(`
      DROP INDEX IF EXISTS idx_content_text_search;
      DROP INDEX IF EXISTS idx_content_active_created;
      DROP INDEX IF EXISTS idx_profiles_level_points;
      DROP INDEX IF EXISTS idx_user_points_user_source_created;
      DROP INDEX IF EXISTS idx_user_points_positive;
      DROP INDEX IF EXISTS idx_user_points_negative;
      DROP INDEX IF EXISTS idx_comments_content_parent;
      DROP INDEX IF EXISTS idx_user_achievements_progress;
      DROP INDEX IF EXISTS idx_referrals_created_converted;
      DROP INDEX IF EXISTS idx_token_transactions_wallet_type;
      DROP INDEX IF EXISTS idx_notifications_delivery_queue;
    `);
  }
};
