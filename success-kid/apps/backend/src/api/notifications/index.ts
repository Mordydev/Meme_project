/**
 * Notifications API Module Entry Point
 *
 * Registers the notification routes.
 */
import { FastifyInstance } from 'fastify';
import notificationRoutes from './routes';

/**
 * Plugin registration function for notification routes
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
    // Register routes with the prefix defined in the main API index
    await fastify.register(notificationRoutes);
    done();
  } catch (err) {
    done(err instanceof Error ? err : new Error('Failed to register notification routes'));
  }
}
