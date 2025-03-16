/**
 * Migration: Create Users Table
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const createUsersTable: Migration = {
  id: '001',
  name: 'create_users_table',
  up: async (client: PoolClient) => {
    // Create the users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        auth_provider VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        
        -- Ensure valid status values
        CONSTRAINT valid_user_status CHECK (
          status IN ('active', 'suspended', 'deleted')
        )
      );
      
      -- Create indexes for common query patterns
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `);
  },
  down: async (client: PoolClient) => {
    // Drop the users table
    await client.query(`
      DROP TABLE IF EXISTS users CASCADE;
    `);
  }
};
