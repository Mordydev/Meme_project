/**
 * Request Handlers for the Feature Flags API module
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { featureFlagService } from '../../services/feature-flag-service'; // Assuming service is available
import { handleApiError } from '../../errors/handlers'; // Assuming error handler is accessible
import {
  FeatureFlagParams,
  SetFeatureFlagBody,
  SetUserFeatureFlagBody,
  UserFeatureFlagParams
} from './types';

// Helper to get featureFlagService from the request instance
function getFeatureFlagService(request: FastifyRequest): any { // Use 'any' for now, assuming decoration
    // @ts-ignore - Assuming featureFlagService is decorated onto the fastify instance
    if (!request.server.featureFlagService) {
        throw new Error('FeatureFlagService not found on Fastify instance');
    }
    // @ts-ignore
    return request.server.featureFlagService;
}

/**
 * Handler for listing all feature flags
 */
export async function listFeatureFlagsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const service = getFeatureFlagService(request);
  try {
    const flags = await service.listFeatureFlags();
    return reply.send({
      data: flags,
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting feature flag status
 */
export async function getFeatureFlagHandler(
  request: FastifyRequest<{ Params: FeatureFlagParams }>,
  reply: FastifyReply
) {
  const service = getFeatureFlagService(request);
  try {
    const { name } = request.params;
    const isEnabled = await service.isEnabled(name);
    // Consider fetching full flag details if needed for the response
    return reply.send({
      data: { name, enabled: isEnabled },
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
    });
  } catch (error) {
    // Handle specific errors like flag not found if service throws them
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for setting feature flag status (Admin)
 */
export async function setFeatureFlagHandler(
  request: FastifyRequest<{ Params: FeatureFlagParams; Body: SetFeatureFlagBody }>,
  reply: FastifyReply
) {
  const service = getFeatureFlagService(request);
  try {
    // Admin check should be done via middleware
    const { name } = request.params;
    const { enabled } = request.body;
    await service.setFeatureFlag(name, enabled);
    return reply.send({
      data: { name, enabled },
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for setting user-specific feature flag status (Admin)
 */
export async function setUserFeatureFlagHandler(
  request: FastifyRequest<{ Params: FeatureFlagParams; Body: SetUserFeatureFlagBody }>,
  reply: FastifyReply
) {
  const service = getFeatureFlagService(request);
  try {
    // Admin check should be done via middleware
    const { name } = request.params;
    const { userId, enabled } = request.body;
    await service.setUserFeatureFlag(name, userId, enabled);
    return reply.send({
      data: { name, userId, enabled },
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for removing user-specific feature flag override (Admin)
 */
export async function removeUserFeatureFlagHandler(
  request: FastifyRequest<{ Params: UserFeatureFlagParams }>,
  reply: FastifyReply
) {
  const service = getFeatureFlagService(request);
  try {
    // Admin check should be done via middleware
    const { name, userId } = request.params;
    await service.removeUserFeatureFlag(name, userId);
    return reply.send({
      data: { name, userId, removed: true },
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}
