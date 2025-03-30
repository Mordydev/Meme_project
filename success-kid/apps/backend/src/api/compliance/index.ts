/**
 * Compliance API Module Entry Point
 *
 * Registers the compliance routes.
 */
import { FastifyInstance } from 'fastify';
import complianceRoutes from './routes';

/**
 * Plugin registration function for compliance routes
 * @param fastify - The Fastify instance
 * @param opts - Plugin options
 * @param done - Callback function
 */
export default async function (
  fastify: FastifyInstance,
  opts: Record<string, unknown>,
  done: (err?: Error) => void
): Promise<void> {
  try {
    // Register routes with a suitable prefix, e.g., '/compliance'
    await fastify.register(complianceRoutes, { prefix: '/compliance' });
    done();
  } catch (err) {
    done(err instanceof Error ? err : new Error('Failed to register compliance routes'));
  }
}
