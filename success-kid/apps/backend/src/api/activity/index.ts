/**
 * Activity API Module Entry Point
 *
 * Registers the activity routes.
 */
import { FastifyInstance } from 'fastify';
import activityRoutes from './routes';

/**
 * Plugin registration function for activity routes
 * @param fastify - The Fastify instance
 * @param opts - Plugin options
 * @param done - Callback function
 */
export default async function (
  fastify: FastifyInstance,
  opts: Record<string, unknown>, // Use Record<string, unknown> for generic options
  done: (err?: Error) => void
): Promise<void> {
  try {
    await fastify.register(activityRoutes, { prefix: '/activity' }); // Register routes with prefix
    done();
  } catch (err) {
    // Ensure errors are passed to the done callback
    done(err instanceof Error ? err : new Error('Failed to register activity routes'));
  }
}
