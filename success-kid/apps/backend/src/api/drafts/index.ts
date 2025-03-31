/**
 * Draft API Module
 * 
 * Exports the draft routes and handlers
 */
import { FastifyInstance } from 'fastify';
import { draftRoutes } from './routes';

/**
 * Register the draft module
 */
export async function draftModule(fastify: FastifyInstance): Promise<void> {
  fastify.register(draftRoutes, { prefix: '/drafts' });
}

// Export types and schemas
export * from './types';
export * from './schema';
