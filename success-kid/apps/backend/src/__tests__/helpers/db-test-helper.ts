/**
 * Database Test Helper
 * 
 * Utility functions for database operations in tests
 */
import { Pool } from 'pg';
import { config } from '../../config';
import { getRepositoryFactory } from '../../repositories/repository-factory';

let testPool: Pool;

/**
 * Get a database connection pool for tests
 * Uses either the test database or a mock based on environment
 */
export function getTestDbPool(): Pool {
  if (!testPool) {
    // Use real database if in CI/CD or integration test environment
    if (process.env.CI || process.env.INTEGRATION_TEST === 'true') {
      testPool = new Pool({
        ...config.database,
        database: process.env.TEST_DB_NAME || `${config.database.database}_test`
      });
    } else {
      // Mock the pool for unit tests
      testPool = {
        query: jest.fn(),
        connect: jest.fn().mockResolvedValue({
          query: jest.fn(),
          release: jest.fn()
        }),
        end: jest.fn().mockResolvedValue(undefined)
      } as unknown as Pool;
    }
  }
  
  return testPool;
}

/**
 * Get repository factory with test database pool
 */
export function getTestRepositories() {
  const pool = getTestDbPool();
  return getRepositoryFactory(pool);
}

/**
 * Clean up test database after tests
 */
export async function cleanupTestDb() {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

/**
 * Clear all data from test database tables
 * Only runs when using a real test database
 */
export async function clearTestData() {
  if (!(process.env.CI || process.env.INTEGRATION_TEST === 'true')) {
    return;
  }
  
  const pool = getTestDbPool();
  
  // Get all tables
  const tablesResult = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name != 'migrations'
  `);
  
  const tables = tablesResult.rows.map(row => row.table_name);
  
  // Disable triggers temporarily
  await pool.query('SET session_replication_role = replica;');
  
  // Truncate all tables
  for (const table of tables) {
    await pool.query(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
  
  // Re-enable triggers
  await pool.query('SET session_replication_role = DEFAULT;');
}

/**
 * Create seed data for tests
 */
export async function seedTestData() {
  if (!(process.env.CI || process.env.INTEGRATION_TEST === 'true')) {
    return;
  }
  
  const pool = getTestDbPool();
  
  // Create test users
  await pool.query(`
    INSERT INTO users (id, email, display_name, auth_provider, created_at, status)
    VALUES 
      ('test-user-1', 'test1@example.com', 'Test User 1', 'email', NOW(), 'active'),
      ('test-user-2', 'test2@example.com', 'Test User 2', 'email', NOW(), 'active');
  `);
  
  // Create test profiles
  await pool.query(`
    INSERT INTO profiles (user_id, bio, avatar_url, level)
    VALUES 
      ('test-user-1', 'Test bio 1', 'https://example.com/avatar1.jpg', 1),
      ('test-user-2', 'Test bio 2', 'https://example.com/avatar2.jpg', 2);
  `);
  
  // Create test content
  await pool.query(`
    INSERT INTO content (id, user_id, type, content_text, created_at, updated_at, status)
    VALUES 
      ('test-content-1', 'test-user-1', 'text', 'Test content 1', NOW(), NOW(), 'active'),
      ('test-content-2', 'test-user-2', 'text', 'Test content 2', NOW(), NOW(), 'active');
  `);
  
  // Create test user points
  await pool.query(`
    INSERT INTO user_points (id, user_id, amount, source, created_at)
    VALUES 
      ('test-points-1', 'test-user-1', 100, 'daily_login', NOW()),
      ('test-points-2', 'test-user-2', 50, 'content_creation', NOW());
  `);
}
