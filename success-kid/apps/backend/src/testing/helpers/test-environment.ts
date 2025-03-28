/**
 * Test Environment
 * 
 * Provides a consistent environment for running tests.
 */
import { FastifyInstance } from 'fastify';
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { build } from '@/app';
import { userFactory, User } from '../factories/user';
import { logger } from '@/lib/logger';

/**
 * Test environment interface
 */
export interface TestEnvironment {
  setup(): Promise<void>;
  teardown(): Promise<void>;
  getApp(): FastifyInstance;
  getTestUser(role?: string): Promise<User>;
  getAuthToken(user: User): string;
  getDatabaseConnection(): Promise<PoolClient>;
  reset(): Promise<void>;
}

/**
 * Configuration for test environment
 */
export interface TestEnvironmentConfig {
  enableLogging?: boolean;
  mockAuth?: boolean;
  mockDatabase?: boolean;
  seedTestData?: boolean;
}

/**
 * Create a test environment
 * 
 * @param config Test environment configuration
 * @returns Test environment instance
 */
export async function createTestEnvironment(
  config: TestEnvironmentConfig = {}
): Promise<TestEnvironment> {
  // Set default configuration
  const effectiveConfig = {
    enableLogging: false,
    mockAuth: false,
    mockDatabase: false,
    seedTestData: true,
    ...config
  };
  
  // Initialize environment
  let app: FastifyInstance;
  let dbPool: Pool;
  let testUsers: Map<string, User> = new Map();
  
  // The environment instance
  const environment: TestEnvironment = {
    /**
     * Set up the test environment
     */
    async setup(): Promise<void> {
      // Build the app with test configuration
      app = await build({
        logger: effectiveConfig.enableLogging,
        testing: true
      });
      
      // Setup database connection if not mocked
      if (!effectiveConfig.mockDatabase) {
        dbPool = new Pool({
          connectionString: process.env.TEST_DATABASE_URL,
          max: 5
        });
        
        // Verify database connection
        try {
          const client = await dbPool.connect();
          client.release();
        } catch (error) {
          throw new Error(`Failed to connect to test database: ${error.message}`);
        }
      }
      
      // Seed test data if required
      if (effectiveConfig.seedTestData) {
        await seedTestData();
      }
    },
    
    /**
     * Tear down the test environment
     */
    async teardown(): Promise<void> {
      // Close app if initialized
      if (app) {
        await app.close();
      }
      
      // Close database connection if initialized
      if (dbPool) {
        await dbPool.end();
      }
    },
    
    /**
     * Get the Fastify app instance
     * 
     * @returns Fastify app instance
     */
    getApp(): FastifyInstance {
      if (!app) {
        throw new Error('Test environment not set up');
      }
      return app;
    },
    
    /**
     * Get a test user
     * 
     * @param role User role (default: 'user')
     * @returns Test user
     */
    async getTestUser(role: string = 'user'): Promise<User> {
      // Check if we already have a user with this role
      if (testUsers.has(role)) {
        return testUsers.get(role)!;
      }
      
      // Create a new test user
      const user = userFactory.create({
        id: uuidv4(),
        email: `test-${role}@example.com`,
        displayName: `Test ${role}`,
        status: 'active'
      });
      
      // Store user for reuse
      testUsers.set(role, user);
      
      // If not using mocked auth, create the user in the database
      if (!effectiveConfig.mockAuth && !effectiveConfig.mockDatabase) {
        const client = await dbPool.connect();
        try {
          await client.query(
            'INSERT INTO users (id, email, display_name, auth_provider, created_at, last_login, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [
              user.id,
              user.email,
              user.displayName,
              'test',
              user.createdAt,
              user.lastLogin,
              user.status
            ]
          );
        } finally {
          client.release();
        }
      }
      
      return user;
    },
    
    /**
     * Get an auth token for a user
     * 
     * @param user User to get token for
     * @returns Authentication token
     */
    getAuthToken(user: User): string {
      // In a real implementation, this would create a valid JWT
      // For testing, we use a simple format that can be decoded in middleware
      return `test-token-${user.id}`;
    },
    
    /**
     * Get a database connection
     * 
     * @returns Database client
     */
    async getDatabaseConnection(): Promise<PoolClient> {
      if (effectiveConfig.mockDatabase) {
        throw new Error('Database is mocked in this test environment');
      }
      
      if (!dbPool) {
        throw new Error('Test environment not set up');
      }
      
      return dbPool.connect();
    },
    
    /**
     * Reset the test environment
     */
    async reset(): Promise<void> {
      // Clear test users
      testUsers.clear();
      
      // Reset database if not mocked
      if (!effectiveConfig.mockDatabase && dbPool) {
        await resetTestDatabase();
      }
      
      // Reseed test data if required
      if (effectiveConfig.seedTestData) {
        await seedTestData();
      }
    }
  };
  
  /**
   * Reset the test database to a clean state
   */
  async function resetTestDatabase(): Promise<void> {
    const client = await dbPool.connect();
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // Truncate all tables
      // Note: In a real implementation, you would list all tables explicitly
      await client.query(`
        TRUNCATE TABLE 
          users, 
          profiles, 
          user_points, 
          content, 
          comments, 
          wallet_connections
        CASCADE
      `);
      
      // Commit transaction
      await client.query('COMMIT');
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Seed the test database with initial data
   */
  async function seedTestData(): Promise<void> {
    // In a real implementation, this would seed the database with test data
    // For this example, we'll just create a few test users in memory
    testUsers.set('admin', userFactory.create({
      id: uuidv4(),
      email: 'admin@example.com',
      displayName: 'Admin User',
      status: 'active'
    }));
    
    testUsers.set('user', userFactory.create({
      id: uuidv4(),
      email: 'user@example.com',
      displayName: 'Regular User',
      status: 'active'
    }));
    
    // If not using mocked database, seed the database as well
    if (!effectiveConfig.mockDatabase && !effectiveConfig.mockAuth) {
      const client = await dbPool.connect();
      try {
        // Begin transaction
        await client.query('BEGIN');
        
        // Insert test users
        for (const user of testUsers.values()) {
          await client.query(
            'INSERT INTO users (id, email, display_name, auth_provider, created_at, last_login, status) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
            [
              user.id,
              user.email,
              user.displayName,
              'test',
              user.createdAt,
              user.lastLogin,
              user.status
            ]
          );
        }
        
        // Commit transaction
        await client.query('COMMIT');
      } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        logger.error('Failed to seed test data', { error });
      } finally {
        client.release();
      }
    }
  }
  
  // Set up the environment before returning
  await environment.setup();
  
  return environment;
}

// Export singleton instance for convenience
const testEnvironment = {
  create: createTestEnvironment
};

export default testEnvironment;
