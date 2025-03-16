// Export all auth components from a single index
export * from './clerk';
export * from './rbac';
export * from './verification';
export * from './service';
export * from './schemas';

// Export routes for registration
import routes from './routes';
export { routes };

/**
 * Register all auth routes and middleware with the application
 * 
 * @param fastify Fastify instance
 */
export default async function registerAuth(fastify: import('fastify').FastifyInstance): Promise<void> {
  // Register auth routes
  await fastify.register(routes, { prefix: '/api/v1/auth' });
}
