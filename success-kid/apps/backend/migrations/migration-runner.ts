/**
 * Migration Runner
 * 
 * Handles database migrations in a transaction-safe way with tracking
 */
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../src/lib/logger';

interface Migration {
  id: string;
  name: string;
  timestamp: Date;
  sql: string;
}

/**
 * Runs database migrations
 * 
 * @param pool PostgreSQL connection pool
 * @param direction Migration direction (up or down)
 * @param target Optional target migration ID (runs all if not specified)
 */
export async function runMigrations(
  pool: Pool, 
  direction: 'up' | 'down' = 'up',
  target?: string
): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Ensure migrations tracking table exists
    await createMigrationsTable(client);
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(client);
    
    // Load available migrations
    const availableMigrations = await loadMigrations();
    
    // Determine migrations to run
    const migrationsToRun = direction === 'up'
      ? getMigrationsToApply(availableMigrations, appliedMigrations, target)
      : getMigrationsToRevert(availableMigrations, appliedMigrations, target);
    
    if (migrationsToRun.length === 0) {
      logger.info('No migrations to run');
      return;
    }
    
    logger.info(`Running ${migrationsToRun.length} migrations (${direction})`);
    
    // Run each migration in a transaction
    for (const migration of migrationsToRun) {
      await runMigration(client, migration, direction);
    }
    
    logger.info('Migrations completed successfully');
  } catch (error) {
    logger.error('Migration error', { error });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable(client: any): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Get list of already applied migrations
 */
async function getAppliedMigrations(client: any): Promise<string[]> {
  const result = await client.query('SELECT id FROM migrations ORDER BY id');
  return result.rows.map(row => row.id);
}

/**
 * Load available migrations from the filesystem
 */
async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = path.join(__dirname);
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'));
  
  const migrations: Migration[] = [];
  
  for (const file of files) {
    // Parse migration ID and name from filename
    // Expected format: 001_initial_schema.sql
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    
    if (match) {
      const id = match[1];
      const name = match[2].replace(/_/g, ' ');
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      migrations.push({
        id,
        name,
        timestamp: new Date(),
        sql
      });
    }
  }
  
  // Sort migrations by ID
  return migrations.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Determine which migrations need to be applied
 */
function getMigrationsToApply(
  availableMigrations: Migration[],
  appliedMigrations: string[],
  target?: string
): Migration[] {
  const appliedSet = new Set(appliedMigrations);
  let toApply = availableMigrations.filter(migration => !appliedSet.has(migration.id));
  
  // If target is specified, only include migrations up to the target
  if (target) {
    const targetIndex = toApply.findIndex(m => m.id === target);
    if (targetIndex >= 0) {
      toApply = toApply.slice(0, targetIndex + 1);
    }
  }
  
  return toApply;
}

/**
 * Determine which migrations need to be reverted
 */
function getMigrationsToRevert(
  availableMigrations: Migration[],
  appliedMigrations: string[],
  target?: string
): Migration[] {
  const appliedSet = new Set(appliedMigrations);
  const appliedMigrationObjects = availableMigrations
    .filter(migration => appliedSet.has(migration.id))
    .sort((a, b) => b.id.localeCompare(a.id)); // Reverse order for reverting
  
  // If target is specified, only revert migrations after the target
  if (target) {
    const targetIndex = appliedMigrationObjects.findIndex(m => m.id === target);
    if (targetIndex >= 0) {
      return appliedMigrationObjects.slice(0, targetIndex);
    }
  }
  
  return appliedMigrationObjects;
}

/**
 * Run a single migration
 */
async function runMigration(
  client: any, 
  migration: Migration, 
  direction: 'up' | 'down'
): Promise<void> {
  try {
    // Start transaction
    await client.query('BEGIN');
    
    logger.info(`Running migration ${migration.id}: ${migration.name} (${direction})`);
    
    if (direction === 'up') {
      // Run the migration SQL
      await client.query(migration.sql);
      
      // Record the migration as applied
      await client.query(
        'INSERT INTO migrations (id, name) VALUES ($1, $2)',
        [migration.id, migration.name]
      );
    } else {
      // For 'down' migrations, look for a separator in the SQL file
      const parts = migration.sql.split('-- DOWN');
      
      if (parts.length > 1) {
        await client.query(parts[1].trim());
      } else {
        logger.warn(`No DOWN migration found for ${migration.id}`);
      }
      
      // Remove from migrations table
      await client.query('DELETE FROM migrations WHERE id = $1', [migration.id]);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    logger.info(`Migration ${migration.id} ${direction === 'up' ? 'applied' : 'reverted'} successfully`);
  } catch (error) {
    // Rollback the transaction on error
    await client.query('ROLLBACK');
    logger.error(`Migration ${migration.id} failed`, { error });
    throw error;
  }
}
