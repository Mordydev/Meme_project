import { FastifyInstance } from 'fastify';
import { build } from '@/app';

/**
 * Creates a test instance of the Fastify app
 * @param options Options to pass to the app builder
 * @returns A promise that resolves to a Fastify instance
 */
export async function createTestApp(options = {}): Promise<FastifyInstance> {
  const app = await build({
    logger: false,
    ...options
  });
  
  return app;
}

/**
 * Mocks authentication for a request to the app
 * @param app Fastify instance
 * @param userId User ID to mock
 */
export function mockAuthentication(app: FastifyInstance, userId: string): void {
  app.addHook('onRequest', (request, reply, done) => {
    request.user = {
      id: userId,
      isAuthenticated: true
    };
    done();
  });
}

/**
 * Generates a test token for authentication
 * @param userId User ID to include in token
 * @returns A mock JWT token
 */
export function generateTestToken(userId: string): string {
  return `mock-token-${userId}`;
}