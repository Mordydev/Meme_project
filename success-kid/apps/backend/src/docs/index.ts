/**
 * API Documentation Module
 * 
 * This module centralizes all API documentation to ensure consistency and completeness.
 */
export * from './openapi';
export * from './schemas';

import { FastifyInstance } from 'fastify';
import { setupApiDocumentation } from './openapi';

/**
 * Initialize API documentation for a Fastify instance
 * 
 * @param app Fastify instance to add documentation to
 */
export async function initializeDocumentation(app: FastifyInstance): Promise<void> {
  await setupApiDocumentation(app);
}

export default {
  initialize: initializeDocumentation,
};
