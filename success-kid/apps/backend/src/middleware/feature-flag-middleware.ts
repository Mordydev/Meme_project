/**
 * Feature Flag Middleware
 * 
 * Middleware to control access to features based on feature flags.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { featureFlagService } from '../services/feature-flag-service';
import { logger } from '../lib/logger';

/**
 * Feature flag middleware options
 */
export interface FeatureFlagOptions {
  // Default value if feature flag doesn't exist
  defaultValue: boolean;
  
  // Error message to return if feature is disabled
  errorMessage?: string;
}

/**
 * Default feature flag options
 */
const defaultOptions: FeatureFlagOptions = {
  defaultValue: false,
  errorMessage: 'This feature is not available',
};

/**
 * Feature flag middleware factory
 * 
 * Creates middleware that checks if a feature is enabled before allowing the request to proceed.
 * 
 * @param featureName Name of the feature flag to check
 * @param options Configuration options
 * @returns Middleware function for Fastify
 */
export function featureFlag(featureName: string, options: Partial<FeatureFlagOptions> = {}) {
  const config = { ...defaultOptions, ...options };
  
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      // Get user ID from authenticated request if available
      const userId = (request as any).user?.id;
      
      // Check if feature is enabled
      const isEnabled = await featureFlagService.isEnabled(featureName, userId);
      
      // If feature is disabled and default is false, return error
      if (!isEnabled && !config.defaultValue) {
        logger.debug('Feature flag access denied', { featureName, userId });
        
        return reply.code(404).send({
          data: null,
          errors: [{
            code: 'FEATURE_DISABLED',
            message: config.errorMessage || 'This feature is not available',
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id,
          },
        });
      }
      
      // Feature is enabled, continue
      logger.debug('Feature flag access granted', { featureName, userId });
    } catch (error) {
      // Log error but continue with default value
      logger.error('Feature flag check error', { 
        featureName, 
        error: error.message,
      });
      
      // If default is false, return error
      if (!config.defaultValue) {
        return reply.code(404).send({
          data: null,
          errors: [{
            code: 'FEATURE_DISABLED',
            message: config.errorMessage || 'This feature is not available',
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id,
          },
        });
      }
    }
  };
}

export default featureFlag;
