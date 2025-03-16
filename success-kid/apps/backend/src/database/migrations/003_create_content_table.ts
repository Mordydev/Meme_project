/**
 * Migration: Create Content and Comments Tables
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createContentTable: Migration = {
  id: '003',
  name: 'create_content_table',
  up: async (client: PoolClient) => {
    // Create content table
    await client.query(`
      CREATE TABLE IF NOT EXISTS content (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        content_text TEXT NOT NULL,
        media_urls JSONB DEFAULT '[]'::JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        
        -- Additional fields for different content types
        poll_options JSONB,
        link_url TEXT,
        link_title TEXT,
        link_description TEXT,
        link_image TEXT,
        
        -- Metadata fields
        category_id VARCHAR(255),
        tags JSONB DEFAULT '[]'::JSONB,
        metadata JSONB DEFAULT '{}'::JSONB,
        
        -- Ensure valid content type values
        CONSTRAINT valid_content_type CHECK (
          type IN ('text', 'image', 'link', 'poll')
        ),
        
        -- Ensure valid status values
        CONSTRAINT valid_content_status CHECK (
          status IN ('active', 'deleted', 'flagged', 'pending_review')
        )
      );
      
      -- Create index for common query patterns
      CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
      CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
      CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
      CREATE INDEX IF NOT EXISTS idx_content_category ON content(category_id);
    `);
    
    // Create comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(255) PRIMARY KEY,
        content_id VARCHAR(255) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment_text TEXT NOT NULL,
        parent_id VARCHAR(255) REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        metadata JSONB DEFAULT '{}'::JSONB,
        
        -- Ensure valid status values
        CONSTRAINT valid_comment_status CHECK (
          status IN ('active', 'deleted', 'flagged', 'pending_review')
        )
      );
      
      -- Create indexes for comments
      CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id);
      CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS comments CASCADE;
      DROP TABLE IF EXISTS content CASCADE;
    `);
  }
};
