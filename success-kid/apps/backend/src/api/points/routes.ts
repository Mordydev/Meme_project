/**
 * Points API Module
 * 
 * Register points API routes and handle feature flag for enhanced version
 */
import { FastifyInstance } from 'fastify';
import { redisClient } from '../../lib/redis-client';
import pointsRoutes from './index';
import enhancedPointsRoutes from './enhanced';

/**
 * Register points API routes
 * 
 * @param fastify Fastify instance
 */
export default async function registerPointsRoutes(fastify: FastifyInstance) {
  const useEnhanced = await shouldUseEnhancedImplementation();
  
  if (useEnhanced) {
    fastify.register(enhancedPointsRoutes, { prefix: '' });
  } else {
    fastify.register(pointsRoutes, { prefix: '' });
  }
  
  // Register version check endpoint to see which implementation is active
  fastify.get('/version', async (request, reply) => {
    return reply.code(200).send({
      data: {
        version: useEnhanced ? 'enhanced' : 'standard',
        features: {
          redisCaps: useEnhanced,
          enhancedVerification: useEnhanced,
          batchedRedemption: useEnhanced,
          antiExploitation: useEnhanced
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  });
}

/**
 * Check if enhanced implementation should be used
 * 
 * @returns Whether to use the enhanced implementation
 */
async function shouldUseEnhancedImplementation(): Promise<boolean> {
  try {
    // Check feature flag in Redis
    const flag = await redisClient.get('feature:enhanced-points-system');
    
    // Default to true if flag doesn't exist
    if (flag === null) {
      return true;
    }
    
    return flag === 'true';
  } catch (error) {
    // Default to false on error
    return false;
  }
}
