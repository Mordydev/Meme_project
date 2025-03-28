// Export all auth components from a single index
export * from './clerk';
export * from './rbac';
export * from './verification';
export * from './service';
export * from './schemas';
export * from './wallet';
export * from './tokens';
export * from './security';
export * from './providers';
export * from './session';

// Export routes for registration
import routes from './routes';
import { walletAuthRoutes } from './wallet';
import { tokenRoutes } from './tokens';
import { securityRoutes } from './security';
import { providerRoutes } from './providers';
import { sessionRoutes } from './session';

export { routes };

/**
 * Register all auth routes and middleware with the application
 * 
 * @param fastify Fastify instance
 */
export default async function registerAuth(fastify: import('fastify').FastifyInstance): Promise<void> {
  // Register auth routes
  await fastify.register(routes, { prefix: '/api/v1/auth' });
  
  // Register wallet auth routes
  await fastify.register(walletAuthRoutes, { prefix: '/api/v1' });
  
  // Register token routes
  await fastify.register(tokenRoutes, { prefix: '/api/v1' });
  
  // Register security routes
  await fastify.register(securityRoutes, { prefix: '/api/v1' });
  
  // Register provider routes
  await fastify.register(providerRoutes, { prefix: '/api/v1' });
  
  // Register session routes
  await fastify.register(sessionRoutes, { prefix: '/api/v1' });
}
