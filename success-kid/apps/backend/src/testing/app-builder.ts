/**
 * Test Application Builder
 * 
 * Provides utilities for building a test Fastify application
 */
import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import { IDatabase } from '../lib/db-client';
import { createMockDatabase } from './mocks/database';
import { createMockRedis } from './mocks/redis';

/**
 * Test application interface
 */
export interface TestApplication {
  app: FastifyInstance;
  db: IDatabase;
  redis: any;
  cleanup(): Promise<void>;
}

/**
 * Options for creating a test application
 */
export interface TestApplicationOptions {
  withAuth?: boolean;
  withDatabase?: boolean;
  withRedis?: boolean;
  fastifyOptions?: FastifyServerOptions;
  routes?: string[];
}

/**
 * Create a test application for testing
 */
export async function createTestApplication(options: TestApplicationOptions = {}): Promise<TestApplication> {
  const {
    withAuth = true,
    withDatabase = true,
    withRedis = true,
    fastifyOptions = { logger: false },
    routes = ['all'],
  } = options;
  
  // Create Fastify instance
  const app = fastify(fastifyOptions);
  
  // Create mock database if needed
  const db = withDatabase ? createMockDatabase() : undefined;
  
  // Create mock Redis if needed
  const redis = withRedis ? createMockRedis() : undefined;
  
  // Register mocks with the app
  if (db) {
    app.decorate('db', db);
  }
  
  if (redis) {
    app.decorate('redis', redis);
  }
  
  // Setup authentication if requested
  if (withAuth) {
    app.addHook('preHandler', async (request, reply) => {
      // Extract test user from authentication header if present
      const authHeader = request.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer test-token-')) {
        // Extract user ID from token (format: test-token-userId)
        const userId = authHeader.replace('Bearer test-token-', '');
        
        // Attach test user to request
        request.user = {
          id: userId,
          isAuthenticated: true,
          roles: ['user'],
        };
      } else if (authHeader && authHeader.startsWith('Bearer admin-token-')) {
        // Extract user ID from token (format: admin-token-userId)
        const userId = authHeader.replace('Bearer admin-token-', '');
        
        // Attach test admin user to request
        request.user = {
          id: userId,
          isAuthenticated: true,
          roles: ['user', 'admin'],
        };
      } else {
        // No authentication
        request.user = {
          id: null,
          isAuthenticated: false,
          roles: [],
        };
      }
    });
  }
  
  // Register routes
  if (routes.includes('all') || routes.includes('health')) {
    const healthRoutes = await import('../api/health');
    app.register(healthRoutes.default, { prefix: '/api/v1/health' });
  }
  
  if (routes.includes('all') || routes.includes('users')) {
    const userRoutes = await import('../api/users');
    app.register(userRoutes.default, { prefix: '/api/v1/users' });
  }
  
  if (routes.includes('all') || routes.includes('points')) {
    const pointsRoutes = await import('../api/points');
    app.register(pointsRoutes.default, { prefix: '/api/v1/points' });
  }
  
  if (routes.includes('all') || routes.includes('wallet')) {
    const walletRoutes = await import('../api/wallet');
    app.register(walletRoutes.default, { prefix: '/api/v1/wallet' });
  }
  
  if (routes.includes('all') || routes.includes('content')) {
    const contentRoutes = await import('../api/content');
    app.register(contentRoutes.default, { prefix: '/api/v1/content' });
  }
  
  // Add documentation if requested
  if (routes.includes('docs')) {
    const docsPlugin = await import('../docs');
    app.register(docsPlugin.docsPlugin);
  }
  
  // Return test application
  return {
    app,
    db: db as IDatabase,
    redis,
    
    // Cleanup function for tearing down the test
    async cleanup() {
      await app.close();
    },
  };
}
