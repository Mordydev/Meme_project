/**
 * Migrations Runner Script
 * 
 * This script is used to run database migrations or roll them back.
 */
import { getPool, closePool, runMigrations, rollbackLastMigration } from '../migrations';
import { logger } from '../../lib/logger';

async function main(): Promise<void> {
  // Check if we should roll back instead of apply migrations
  const isRollback = process.argv.includes('--rollback');
  
  try {
    logger.info(`${isRollback ? 'Rolling back last migration' : 'Running pending migrations'}`);
    
    // Get database pool
    const pool = getPool();
    
    // Apply or roll back migrations
    if (isRollback) {
      await rollbackLastMigration(pool);
      logger.info('Migration rollback completed successfully');
    } else {
      await runMigrations(pool);
      logger.info('Migrations completed successfully');
    }
    
    // Close the database connection
    await closePool();
  } catch (error) {
    logger.error(`Migration ${isRollback ? 'rollback' : 'execution'} failed`, {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

// Run the script
main();
