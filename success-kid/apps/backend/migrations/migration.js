/**
 * Database Migration Runner
 * 
 * This script runs SQL migration files in the migrations directory.
 * It tracks applied migrations in a migrations table.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://dev:dev@localhost:5432/successKidPlatform';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
});

/**
 * Apply migrations
 */
async function applyMigrations() {
  const client = await pool.connect();
  
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Get list of applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT name FROM migrations ORDER BY id'
    );
    const appliedMigrationNames = appliedMigrations.map(row => row.name);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    // Apply new migrations within a transaction
    for (const file of migrationFiles) {
      if (appliedMigrationNames.includes(file)) {
        console.log(`Migration ${file} already applied, skipping.`);
        continue;
      }
      
      console.log(`Applying migration: ${file}`);
      
      // Start transaction
      await client.query('BEGIN');
      
      try {
        // Read migration file
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Apply migration
        await client.query(sql);
        
        // Record applied migration
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log(`Migration ${file} applied successfully.`);
      } catch (err) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        console.error(`Error applying migration ${file}:`, err);
        throw err;
      }
    }
    
    console.log('All migrations applied successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
applyMigrations()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
