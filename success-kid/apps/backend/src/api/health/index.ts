/**
 * Health API Routes
 * 
 * API endpoints for health checks and monitoring.
 */
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { 
  checkDatabaseConnection, 
  checkRedisConnection, 
  checkDiskSpace, 
  checkMemoryUsage, 
  getAppVersion 
} from '../../health/checks';
import { monitoringService } from '../../health/monitoring';
import { logger } from '../../lib/logger';

/**
 * Health Routes Plugin
 */
export default async function(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  // Simple health check for load balancers
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  });
  
  // Detailed health check with dependency status
  fastify.get('/health/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    // Run all health checks in parallel
    const [database, redis, disk, memory] = await Promise.all([
      checkDatabaseConnection(),
      checkRedisConnection(),
      checkDiskSpace(),
      checkMemoryUsage(),
    ]);
    
    // Determine overall status
    const checks = { database, redis, disk, memory };
    const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
    
    // Set appropriate status code
    const statusCode = isHealthy ? 200 : 503;
    
    return reply.code(statusCode).send({
      status: isHealthy ? 'healthy' : 'unhealthy',
      version: getAppVersion(),
      environment: process.env.NODE_ENV || 'development',
      checks,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
  
  // Monitoring metrics (for internal use, should be protected in production)
  fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    // In production, this should be restricted to authorized users or monitoring systems
    if (process.env.NODE_ENV === 'production') {
      // Check for authorization (implementation will depend on auth system)
      const isAuthorized = request.headers['x-api-key'] === process.env.METRICS_API_KEY;
      
      if (!isAuthorized) {
        return reply.code(401).send({
          error: 'Unauthorized access to metrics',
        });
      }
    }
    
    // Get monitoring metrics
    const summary = monitoringService.getSummaryMetrics();
    const routeMetrics = request.query.detailed === 'true' 
      ? monitoringService.getAllMetrics() 
      : undefined;
    
    return {
      summary,
      routes: routeMetrics,
      timestamp: new Date().toISOString(),
    };
  });
  
  // Reset monitoring metrics (admin only)
  fastify.post('/metrics/reset', async (request: FastifyRequest, reply: FastifyReply) => {
    // In production, this should be restricted to authorized administrators
    if (process.env.NODE_ENV === 'production') {
      // Check for authorization (implementation will depend on auth system)
      const isAuthorized = request.headers['x-api-key'] === process.env.ADMIN_API_KEY;
      
      if (!isAuthorized) {
        return reply.code(401).send({
          error: 'Unauthorized access to reset metrics',
        });
      }
    }
    
    // Reset metrics
    monitoringService.resetMetrics();
    logger.info('Monitoring metrics reset');
    
    return {
      success: true,
      message: 'Monitoring metrics reset successfully',
      timestamp: new Date().toISOString(),
    };
  });
}
