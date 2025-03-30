/**
 * Route definitions for the Feature Flags API module
 */
import { FastifyInstance } from 'fastify';
import {
  listFeatureFlagsSchema,
  getFeatureFlagSchema,
  setFeatureFlagSchema,
  setUserFeatureFlagSchema,
  removeUserFeatureFlagSchema
} from './schema';
import {
  listFeatureFlagsHandler,
  getFeatureFlagHandler,
  setFeatureFlagHandler,
  setUserFeatureFlagHandler,
  removeUserFeatureFlagHandler
} from './handler';
import {
  FeatureFlagParams,
  SetFeatureFlagBody,
  SetUserFeatureFlagBody,
  UserFeatureFlagParams
} from './types';
// Assuming roleMiddleware is available for admin checks
// import { roleMiddleware } from '../../middleware/auth';

/**
 * Registers the feature flag API routes
 * @param fastify - The Fastify instance
 */
export default async function featureFlagRoutes(fastify: FastifyInstance): Promise<void> {
  // List all feature flags (potentially admin only)
  fastify.get('/', {
    schema: listFeatureFlagsSchema
    // Add preHandler: [roleMiddleware(['admin'])] if needed
  }, listFeatureFlagsHandler);

  // Get feature flag status (potentially public or authenticated)
  fastify.get<{ Params: FeatureFlagParams }>('/:name', {
    schema: getFeatureFlagSchema
    // Add onRequest: [authenticateOptional] or similar if needed
  }, getFeatureFlagHandler);

  // Set feature flag (Admin only)
  fastify.put<{ Params: FeatureFlagParams; Body: SetFeatureFlagBody }>('/:name', {
    schema: setFeatureFlagSchema
    // Add preHandler: [roleMiddleware(['admin'])]
  }, setFeatureFlagHandler);

  // Set user-specific feature flag (Admin only)
  fastify.put<{ Params: FeatureFlagParams; Body: SetUserFeatureFlagBody }>('/:name/user', {
    schema: setUserFeatureFlagSchema
    // Add preHandler: [roleMiddleware(['admin'])]
  }, setUserFeatureFlagHandler);

  // Remove user-specific feature flag (Admin only)
  fastify.delete<{ Params: UserFeatureFlagParams }>('/:name/user/:userId', {
    schema: removeUserFeatureFlagSchema
    // Add preHandler: [roleMiddleware(['admin'])]
  }, removeUserFeatureFlagHandler);
}
