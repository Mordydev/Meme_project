/**
 * Test Environment
 * 
 * Provides a full test environment with database, Redis, and application
 */
import { FastifyInstance } from 'fastify';
import { createTestApplication, TestApplication } from './app-builder';
import { IDatabase } from '../lib/db-client';
import { createUser, CreateUserParams } from './factories/user-factory';

/**
 * Test environment interface
 */
export interface TestEnvironment {
  app: FastifyInstance;
  db: IDatabase;
  redis: any;
  getTestUser(role?: string, overrides?: Partial<CreateUserParams>): Promise<any>;
  getAuthToken(user: any): string;
  teardown(): Promise<void>;
  runDatabaseQuery(query: string, params?: any[]): Promise<any>;
}

/**
 * Options for creating a test environment
 */
export interface TestEnvironmentOptions {
  setupDatabase?: boolean;
  loadFixtures?: boolean;
  routes?: string[];
}

/**
 * Create a test environment
 */
export async function createTestEnvironment(options: TestEnvironmentOptions = {}): Promise<TestEnvironment> {
  const {
    setupDatabase = true,
    loadFixtures = true,
    routes = ['all'],
  } = options;
  
  // Create test application
  const testApp = await createTestApplication({
    withAuth: true,
    withDatabase: true,
    withRedis: true,
    routes,
  });
  
  // Set up database if requested
  if (setupDatabase) {
    // In a real implementation, we would set up the database schema
    // For now, we'll just assume the mock database is ready
  }
  
  // Load fixtures if requested
  if (loadFixtures) {
    // In a real implementation, we would load test fixtures
    // For now, we'll just leave this as a placeholder
  }
  
  // User factory cache
  const userCache: Record<string, any> = {};
  
  // Create test environment
  const environment: TestEnvironment = {
    app: testApp.app,
    db: testApp.db,
    redis: testApp.redis,
    
    /**
     * Get or create a test user
     */
    async getTestUser(role: string = 'user', overrides: Partial<CreateUserParams> = {}) {
      const cacheKey = `${role}:${JSON.stringify(overrides)}`;
      
      // Return from cache if available
      if (userCache[cacheKey]) {
        return userCache[cacheKey];
      }
      
      // Create new user with specified role
      const user = await createUser({
        roles: [role],
        ...overrides,
      });
      
      // Store in cache
      userCache[cacheKey] = user;
      
      return user;
    },
    
    /**
     * Get a test authentication token for a user
     */
    getAuthToken(user: any): string {
      // For admin users
      if (user.roles && user.roles.includes('admin')) {
        return `admin-token-${user.id}`;
      }
      
      // For regular users
      return `test-token-${user.id}`;
    },
    
    /**
     * Run a database query directly
     */
    async runDatabaseQuery(query: string, params: any[] = []): Promise<any> {
      return testApp.db.query(query, params);
    },
    
    /**
     * Tear down the test environment
     */
    async teardown(): Promise<void> {
      await testApp.cleanup();
    },
  };
  
  return environment;
}
