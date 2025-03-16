/**
 * Feature Flag Middleware
 * 
 * Provides middleware for controlling feature access based on feature flags
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { FeatureFlagService } from './service';
import { ErrorCode } from '../errors/error-codes';

/**
 * Middleware options for feature flag check
 */
export interface FeatureFlagOptions {
  /**
   * Default return value if flag doesn't exist
   */
  defaultValue?: boolean;
  
  /**
   * Custom error message when feature is disabled
   */
  errorMessage?: string;
  
  /**
   * Custom error code when feature is disabled
   */
  errorCode?: string;
  
  /**
   * Custom status code when feature is disabled
   */
  statusCode?: number;
}

/**
 * Create middleware to check if a feature is enabled
 * 
 * @param featureService - The feature flag service
 * @param featureName - The name of the feature to check
 * @param options - Options for the middleware
 */
export function createFeatureMiddleware(
  featureService: FeatureFlagService,
  featureName: string,
  options: FeatureFlagOptions = {}
) {
  const {
    defaultValue = false,
    errorMessage = 'This feature is currently disabled',
    errorCode = ErrorCode.FEATURE_DISABLED,
    statusCode = 404
  } = options;
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Get user ID from request if available
    const userId = (request as any).user?.id;
    
    try {
      // Check if feature is enabled
      const isEnabled = await featureService.isEnabled(featureName, userId);
      
      // If feature is disabled and defaultValue is false, return error
      if (!isEnabled && !defaultValue) {
        return reply.code(statusCode).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id,
          },
          errors: [{
            code: errorCode,
            message: errorMessage,
          }]
        });
      }
      
      // Otherwise, continue
    } catch (error) {
      // If error occurs checking feature flag, use default value
      if (!defaultValue) {
        return reply.code(statusCode).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id,
          },
          errors: [{
            code: errorCode,
            message: errorMessage,
          }]
        });
      }
    }
  };
}
