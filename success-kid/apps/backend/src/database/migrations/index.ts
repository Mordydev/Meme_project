/**
 * Database Migrations System
 * 
 * Provides functionality for running database migrations in a controlled, versioned manner.
 */
import { Pool, PoolClient } from 'pg';
import { logger } from '../../lib/logger';

/**
 * Migration interface
 */
export interface Migration {
  id: string;
  name: string;
  up: (client: PoolClient) => Promise<void>;
  down: (client: PoolClient) => Promise<void>;
}

/**
 * Registry of all available migrations
 */
import { createUsersTable } from './001_create_users_table';
import { createProfilesTable } from './002_create_profiles_table';
import { createContentTable } from './003_create_content_table';
import { createUserPointsTable } from './004_create_user_points_table';
import { createAchievementsTable } from './005_create_achievements_table';
import { createWalletConnectionsTable } from './006_create_wallet_connections_table';
import { createReferralsTable } from './007_create_referrals_table';
import { createReactionsTable } from './008_create_reactions_table';
import { addOptimizedIndexes } from './009_add_optimized_indexes';

/**
 * Array of all migrations in order of execution
 */
export const migrations: Migration[] = [
  createUsersTable,
  createProfilesTable,
  createContentTable,
  createUserPointsTable,
  createAchievementsTable,
  createWalletConnectionsTable,
  createReferralsTable,
  createReactionsTable,
  addOptimizedIndexes
];

/**
 * Run all pending migrations
 * 
 * @param db Database connection pool
 * @returns Promise that resolves when migrations are complete
 */
export async function runMigrations(db: Pool): Promise<void> {
  logger.info('Running database migrations');
  
  // Create migrations table if it doesn't exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  
  // Get applied migrations
  const result = await db.query('SELECT id FROM migrations');
  const appliedMigrations = new Set(result.rows.map(row => row.id));
  
  // Run pending migrations in order
  for (const migration of migrations) {
    if (!appliedMigrations.has(migration.id)) {
      logger.info(`Applying migration ${migration.id}: ${migration.name}`);
      
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        
        // Run the migration
        await migration.up(client);
        
        // Record the migration
        await client.query(
          'INSERT INTO migrations (id, name) VALUES ($1, $2)',
          [migration.id, migration.name]
        );
        
        await client.query('COMMIT');
        logger.info(`Migration ${migration.id}: ${migration.name} applied successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`Migration ${migration.id}: ${migration.name} failed`, error);
        throw error;
      } finally {
        client.release();
      }
    } else {
      logger.debug(`Migration ${migration.id}: ${migration.name} already applied, skipping`);
    }
  }
  
  logger.info('Database migrations completed');
}

/**
 * Roll back the last applied migration
 * 
 * @param db Database connection pool
 * @returns Promise that resolves when rollback is complete
 */
export async function rollbackLastMigration(db: Pool): Promise<void> {
  logger.info('Rolling back last migration');
  
  // Get the last applied migration
  const result = await db.query(`
    SELECT id, name 
    FROM migrations 
    ORDER BY applied_at DESC 
    LIMIT 1
  `);
  
  if (result.rows.length === 0) {
    logger.info('No migrations to roll back');
    return;
  }
  
  const lastMigration = result.rows[0];
  const migration = migrations.find(m => m.id === lastMigration.id);
  
  if (!migration) {
    logger.error(`Migration ${lastMigration.id} found in database but not in code`);
    throw new Error(`Migration ${lastMigration.id} not found in code`);
  }
  
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Run the down migration
    await migration.down(client);
    
    // Remove the migration record
    await client.query('DELETE FROM migrations WHERE id = $1', [migration.id]);
    
    await client.query('COMMIT');
    logger.info(`Migration ${migration.id}: ${migration.name} rolled back successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Failed to roll back migration ${migration.id}: ${migration.name}`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create a migration database client
 * 
 * @param db Database connection pool
 * @returns Migration database client
 */
export function createMigrationClient(db: Pool) {
  return {
    /**
     * Run all pending migrations
     */
    runMigrations: () => runMigrations(db),
    
    /**
     * Roll back the last applied migration
     */
    rollbackLastMigration: () => rollbackLastMigration(db),
    
    /**
     * Get all applied migrations
     */
    getAppliedMigrations: async () => {
      const result = await db.query(`
        SELECT id, name, applied_at 
        FROM migrations 
        ORDER BY applied_at
      `);
      return result.rows;
    },
    
    /**
     * Check if migrations table exists
     */
    checkMigrationsTable: async () => {
      try {
        await db.query(`
          SELECT 1 FROM migrations LIMIT 1
        `);
        return true;
      } catch (error) {
        return false;
      }
    }
  };
}
