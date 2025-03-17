/**
 * Health Checks
 * 
 * Comprehensive health check system for monitoring application status.
 */
import { FastifyInstance } from 'fastify';
import { logger } from '@/lib/logger';
import { config } from '@/config';
import { Pool, PoolClient } from 'pg';
import Redis from 'ioredis';

/**
 * Health check status
 */
export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: HealthStatus;
  details?: any;
}

/**
 * Health check interface
 */
export interface HealthCheck {
  name: string;
  check(): Promise<HealthCheckResult>;
  severity: 'critical' | 'warning' | 'info';
  timeout: number;
}

/**
 * Overall health check result
 */
export interface OverallHealthResult {
  status: HealthStatus;
  checks: Array<{
    name: string;
    status: HealthStatus;
    details?: any;
    severity: string;
  }>;
  timestamp: string;
  version: string;
  uptime: number;
}

/**
 * Create a promise with a timeout
 * 
 * @param promise Promise to wrap with timeout
 * @param timeoutMs Timeout in milliseconds
 * @param timeoutMessage Message to use in timeout error
 * @returns Promise that resolves with the original promise result or rejects with timeout error
 */
export function promiseWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  // Create a promise that rejects after the specified timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });
  
  // Race the original promise against the timeout
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Database health check
 * 
 * @param db Database pool or client
 * @returns Health check for database
 */
export function createDatabaseHealthCheck(
  db: Pool | PoolClient
): HealthCheck {
  return {
    name: 'database',
    severity: 'critical',
    timeout: 5000, // 5 seconds
    
    async check(): Promise<HealthCheckResult> {
      try {
        // Try simple query to check database connection
        const startTime = Date.now();
        await db.query('SELECT 1');
        const duration = Date.now() - startTime;
        
        return {
          status: 'healthy',
          details: {
            responseTime: duration
          }
        };
      } catch (error) {
        logger.error('Database health check failed', { error });
        
        return {
          status: 'unhealthy',
          details: {
            error: error.message
          }
        };
      }
    }
  };
}

/**
 * Redis health check
 * 
 * @param redis Redis client
 * @returns Health check for Redis
 */
export function createRedisHealthCheck(
  redis: Redis.Redis
): HealthCheck {
  return {
    name: 'redis',
    severity: 'critical',
    timeout: 3000, // 3 seconds
    
    async check(): Promise<HealthCheckResult> {
      try {
        // Try simple ping to check Redis connection
        const startTime = Date.now();
        await redis.ping();
        const duration = Date.now() - startTime;
        
        return {
          status: 'healthy',
          details: {
            responseTime: duration
          }
        };
      } catch (error) {
        logger.error('Redis health check failed', { error });
        
        return {
          status: 'unhealthy',
          details: {
            error: error.message
          }
        };
      }
    }
  };
}

/**
 * External service health check
 * 
 * @param name Service name
 * @param url Service URL to check
 * @param severity Check severity
 * @returns Health check for external service
 */
export function createExternalServiceHealthCheck(
  name: string,
  url: string,
  severity: 'critical' | 'warning' | 'info' = 'warning'
): HealthCheck {
  return {
    name,
    severity,
    timeout: 5000, // 5 seconds
    
    async check(): Promise<HealthCheckResult> {
      try {
        // Try to fetch the URL to check service health
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          cache: 'no-cache'
        });
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          return {
            status: 'healthy',
            details: {
              statusCode: response.status,
              responseTime: duration
            }
          };
        } else {
          return {
            status: 'unhealthy',
            details: {
              statusCode: response.status,
              responseTime: duration
            }
          };
        }
      } catch (error) {
        logger.error(`External service health check failed: ${name}`, { url, error });
        
        return {
          status: 'unhealthy',
          details: {
            error: error.message
          }
        };
      }
    }
  };
}

/**
 * Memory usage health check
 */
export const memoryHealthCheck: HealthCheck = {
  name: 'memory',
  severity: 'warning',
  timeout: 1000, // 1 second
  
  async check(): Promise<HealthCheckResult> {
    try {
      const memory = process.memoryUsage();
      const usedMemoryPercent = (memory.heapUsed / memory.heapTotal) * 100;
      
      // Consider unhealthy if using more than 90% of available heap
      if (usedMemoryPercent > 90) {
        return {
          status: 'unhealthy',
          details: {
            heapUsed: memory.heapUsed,
            heapTotal: memory.heapTotal,
            usedPercent: usedMemoryPercent.toFixed(2) + '%'
          }
        };
      }
      
      // Consider degraded if using more than 70% of available heap
      if (usedMemoryPercent > 70) {
        return {
          status: 'degraded',
          details: {
            heapUsed: memory.heapUsed,
            heapTotal: memory.heapTotal,
            usedPercent: usedMemoryPercent.toFixed(2) + '%'
          }
        };
      }
      
      return {
        status: 'healthy',
        details: {
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal,
          usedPercent: usedMemoryPercent.toFixed(2) + '%'
        }
      };
    } catch (error) {
      logger.error('Memory health check failed', { error });
      
      return {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
    }
  }
};

/**
 * Disk space health check
 */
export const diskSpaceHealthCheck: HealthCheck = {
  name: 'disk',
  severity: 'warning',
  timeout: 3000, // 3 seconds
  
  async check(): Promise<HealthCheckResult> {
    try {
      // This is a simplified example.
      // In a real implementation, you would use a library like 'diskusage' or 'check-disk-space'
      // or run a command to check disk space. Since this is just an example, we'll return healthy
      
      return {
        status: 'healthy',
        details: {
          free: 'Unknown',
          total: 'Unknown',
          usedPercent: 'Unknown'
        }
      };
    } catch (error) {
      logger.error('Disk space health check failed', { error });
      
      return {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
    }
  }
};

/**
 * Get the application version
 * 
 * @returns Application version
 */
export function getAppVersion(): string {
  return process.env.APP_VERSION || '1.0.0';
}

/**
 * Set up health checks for a Fastify instance
 * 
 * @param app Fastify instance
 * @param options Configuration options
 * @returns Array of registered health checks
 */
export function setupHealthChecks(
  app: FastifyInstance,
  options: {
    checks?: HealthCheck[];
    endpoint?: string;
  } = {}
): HealthCheck[] {
  // Default health checks
  const healthChecks = options.checks || [memoryHealthCheck];
  
  // Add health check endpoint
  app.get(options.endpoint || '/health', {
    schema: {
      hide: true
    },
    handler: async (request, reply) => {
      // Run all health checks
      const startTime = Date.now();
      const checkResults = await Promise.all(
        healthChecks.map(async (check) => {
          try {
            // Run check with timeout
            const result = await promiseWithTimeout(
              check.check(),
              check.timeout,
              `Health check '${check.name}' timed out`
            );
            
            return {
              name: check.name,
              status: result.status,
              details: result.details,
              severity: check.severity
            };
          } catch (error) {
            logger.error(`Health check '${check.name}' failed`, { error });
            
            return {
              name: check.name,
              status: 'unhealthy' as const,
              details: { error: error.message },
              severity: check.severity
            };
          }
        })
      );
      
      // Determine overall status
      let overallStatus: HealthStatus = 'healthy';
      
      // Check for critical failures
      if (checkResults.some(
        r => r.severity === 'critical' && r.status === 'unhealthy'
      )) {
        overallStatus = 'unhealthy';
      }
      // Check for warnings or degraded states
      else if (checkResults.some(
        r => r.status === 'unhealthy' || r.status === 'degraded'
      )) {
        overallStatus = 'degraded';
      }
      
      // Create response
      const response: OverallHealthResult = {
        status: overallStatus,
        checks: checkResults,
        timestamp: new Date().toISOString(),
        version: getAppVersion(),
        uptime: process.uptime()
      };
      
      // Set appropriate status code
      const statusCode = overallStatus === 'healthy' ? 200 :
        overallStatus === 'degraded' ? 200 : 503;
      
      // Log health check results at appropriate level
      if (overallStatus === 'unhealthy') {
        logger.error('Health check failed', { response });
      } else if (overallStatus === 'degraded') {
        logger.warn('Health check degraded', { response });
      } else {
        logger.debug('Health check passed', { response });
      }
      
      // Add headers
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      reply.header('Response-Time', `${Date.now() - startTime}ms`);
      
      return reply.code(statusCode).send(response);
    }
  });
  
  // Add detailed health check endpoint
  app.get('/health/details', {
    schema: {
      hide: true
    },
    handler: async (request, reply) => {
      // Similar to above but with more details
      // In a real implementation, this endpoint would likely be authenticated
      // and contain more sensitive details about the system
      
      const checkResults = await Promise.all(
        healthChecks.map(async (check) => {
          try {
            const result = await promiseWithTimeout(
              check.check(),
              check.timeout,
              `Health check '${check.name}' timed out`
            );
            
            return {
              name: check.name,
              status: result.status,
              details: result.details,
              severity: check.severity,
              timeout: check.timeout
            };
          } catch (error) {
            return {
              name: check.name,
              status: 'unhealthy' as const,
              details: { 
                error: error.message,
                stack: error.stack
              },
              severity: check.severity,
              timeout: check.timeout
            };
          }
        })
      );
      
      // Add additional system information
      const systemInfo = {
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpus: require('os').cpus().length,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        startTime: new Date(Date.now() - (process.uptime() * 1000)).toISOString()
      };
      
      return reply.send({
        checks: checkResults,
        system: systemInfo,
        timestamp: new Date().toISOString(),
        version: getAppVersion()
      });
    }
  });
  
  // Add readiness check endpoint
  app.get('/health/ready', {
    schema: {
      hide: true
    },
    handler: async (request, reply) => {
      // Check only critical services for readiness
      const criticalChecks = healthChecks.filter(check => check.severity === 'critical');
      
      // Run all critical health checks
      const checkResults = await Promise.all(
        criticalChecks.map(async (check) => {
          try {
            const result = await promiseWithTimeout(
              check.check(),
              check.timeout,
              `Health check '${check.name}' timed out`
            );
            
            return {
              name: check.name,
              status: result.status
            };
          } catch (error) {
            return {
              name: check.name,
              status: 'unhealthy' as const
            };
          }
        })
      );
      
      // Determine if any critical checks failed
      const isReady = !checkResults.some(r => r.status !== 'healthy');
      
      // Set status code
      const statusCode = isReady ? 200 : 503;
      
      return reply.code(statusCode).send({
        status: isReady ? 'ready' : 'not_ready',
        checks: checkResults,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Add liveness check endpoint
  app.get('/health/live', {
    schema: {
      hide: true
    },
    handler: (request, reply) => {
      // Liveness just checks if the application is running
      return reply.code(200).send({
        status: 'alive',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return healthChecks;
}

// Export default health service
export default {
  setupHealthChecks,
  getAppVersion,
  createDatabaseHealthCheck,
  createRedisHealthCheck,
  createExternalServiceHealthCheck,
  memoryHealthCheck,
  diskSpaceHealthCheck
};
