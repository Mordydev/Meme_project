/**
 * Route definitions for the Events API module (Development/Testing)
 */
import { FastifyInstance } from 'fastify';
import { publishEventSchema, simulateEventSchema } from './schema';
import { publishEventHandler, simulateEventHandler } from './handler';
import { PublishEventBody, SimulateEventParams, SimulateEventBody } from './types';

/**
 * Registers the event API routes (Development Only)
 * @param fastify - The Fastify instance
 */
export default async function eventRoutes(fastify: FastifyInstance): Promise<void> {
  // These routes should only be registered in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    fastify.post<{ Body: PublishEventBody }>('/publish', {
      schema: publishEventSchema
      // No auth needed for dev routes usually
    }, publishEventHandler);

    fastify.post<{ Params: SimulateEventParams; Body: SimulateEventBody }>('/simulate/:eventType', {
      schema: simulateEventSchema
      // No auth needed for dev routes usually
    }, simulateEventHandler);

    fastify.log.warn('Development-only /events routes registered');
  } else {
    fastify.log.info('Skipping registration of development-only /events routes in production');
  }
}
