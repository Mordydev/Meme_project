/**
 * Health Checks Module
 * 
 * Provides comprehensive health check functionality
 */
import { FastifyInstance } from 'fastify';
import os from 'os';
import { HealthCheckDefinition, HealthCheckResult } from './types';
import { getPgPool, getRedisClient } from '../lib/db-client';
import { setGauge } from './metrics';

// Store health checks
const healthChecks: Map<string, HealthCheckDefinition> = new Map();

/**
 * Configure health check endpoints
 */
export async function configureHealthChecks(fastify: FastifyInstance): Promise<void> {
  // Register comprehensive health check endpoint
  fastify.get('/health/detail', {
    schema: {
      response: {
        200: fastify.getSchema('healthCheckResponse'),
      },
    },
    handler: async (request, reply) => {
      const startTime = process.hrtime();
      
      // Run all health checks in parallel
      const checkResults = await runAllChecks();
      
      // Calculate overall status
      const hasCriticalFailure = Array.from(healthChecks.values())
        .some(check => check.severity === 'critical' && 
              checkResults[check.name]?.status === 'unhealthy');
      
      const overallStatus = hasCriticalFailure ? 'unhealthy' : 
        Object.values(checkResults).some(r => r.status === 'unhealthy') ? 'degraded' : 'healthy';
      
      // Calculate execution time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const executionTime = seconds * 1000 + nanoseconds / 1000000;
      
      // Update health check metrics
      setGauge('health_check_execution_time_ms', executionTime);
      setGauge('health_check_status', overallStatus === 'healthy' ? 1 : 0);
      
      const response = {
        status: overallStatus,
        checks: checkResults,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || 'unknown',
        uptime: process.uptime(),
      };
      
      return response;
    },
  });
  
  // Register simple health check endpoint
  fastify.get('/health', {
    schema: {
      response: {
        200: fastify.getSchema('basicHealthResponse'),
      },
    },
    handler: async (request, reply) => {
      // Run only critical checks
      const criticalChecks = Array.from(healthChecks.values())
        .filter(check => check.severity === 'critical')
        .map(check => check.name);
      
      const results = await runSelectedChecks(criticalChecks);
      
      // Calculate overall status
      const hasCriticalFailure = criticalChecks.some(
        name => results[name]?.status === 'unhealthy'
      );
      
      const status = hasCriticalFailure ? 'unhealthy' : 'healthy';
      
      // Set appropriate status code
      if (status === 'unhealthy') {
        reply.code(503);
      }
      
      // Simplified response for public health endpoint
      return {
        status,
        timestamp: new Date().toISOString(),
        checks: {
          postgres: results['database']?.status === 'healthy' ? 'connected' : 'disconnected',
          redis: results['redis']?.status === 'healthy' ? 'connected' : 'disconnected',
        },
      };
    },
  });
  
  // Register default health checks
  registerDefaultHealthChecks();
  
  fastify.log.info(`Health checks configured with ${healthChecks.size} checks`);
}

/**
 * Create and register a health check
 */
export function createHealthCheck(definition: HealthCheckDefinition): HealthCheckDefinition {
  healthChecks.set(definition.name, definition);
  return definition;
}

/**
 * Run all registered health checks
 */
export async function runAllChecks(): Promise<Record<string, HealthCheckResult>> {
  const results: Record<string, HealthCheckResult> = {};
  
  // Run all checks in parallel with timeouts
  const checkPromises = Array.from(healthChecks.entries()).map(async ([name, check]) => {
    try {
      // Apply timeout to check
      const result = await Promise.race([
        check.check(),
        new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error(`Health check '${name}' timed out`)), check.timeout)
        ),
      ]);
      
      results[name] = result;
    } catch (error) {
      // Handle errors and timeouts
      results[name] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          timestamp: new Date().toISOString(),
        },
      };
    }
  });
  
  await Promise.all(checkPromises);
  return results;
}

/**
 * Run selected health checks
 */
export async function runSelectedChecks(checkNames: string[]): Promise<Record<string, HealthCheckResult>> {
  const results: Record<string, HealthCheckResult> = {};
  
  // Run selected checks in parallel
  const checkPromises = checkNames.map(async (name) => {
    const check = healthChecks.get(name);
    
    if (!check) {
      results[name] = {
        status: 'unhealthy',
        error: `Health check '${name}' not found`,
      };
      return;
    }
    
    try {
      // Apply timeout to check
      const result = await Promise.race([
        check.check(),
        new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error(`Health check '${name}' timed out`)), check.timeout)
        ),
      ]);
      
      results[name] = result;
    } catch (error) {
      // Handle errors and timeouts
      results[name] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          timestamp: new Date().toISOString(),
        },
      };
    }
  });
  
  await Promise.all(checkPromises);
  return results;
}

/**
 * Register default health checks
 */
function registerDefaultHealthChecks(): void {
  // Database health check
  createHealthCheck({
    name: 'database',
    severity: 'critical',
    timeout: 5000,
    async check(): Promise<HealthCheckResult> {
      try {
        const pg = getPgPool();
        await pg.query('SELECT 1');
        
        return {
          status: 'healthy',
          details: {
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            timestamp: new Date().toISOString(),
          },
        };
      }
    },
  });
  
  // Redis health check
  createHealthCheck({
    name: 'redis',
    severity: 'critical',
    timeout: 5000,
    async check(): Promise<HealthCheckResult> {
      try {
        const redis = getRedisClient();
        await redis.ping();
        
        return {
          status: 'healthy',
          details: {
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            timestamp: new Date().toISOString(),
          },
        };
      }
    },
  });
  
  // Memory health check
  createHealthCheck({
    name: 'memory',
    severity: 'warning',
    timeout: 2000,
    async check(): Promise<HealthCheckResult> {
      try {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = process.memoryUsage();
        
        // Consider unhealthy if less than 10% free memory
        const status = freeMemory / totalMemory < 0.1 ? 'unhealthy' : 'healthy';
        
        // Update memory metrics
        setGauge('process_memory_usage_bytes', memoryUsage.rss, { type: 'rss' });
        setGauge('process_memory_usage_bytes', memoryUsage.heapTotal, { type: 'heapTotal' });
        setGauge('process_memory_usage_bytes', memoryUsage.heapUsed, { type: 'heapUsed' });
        setGauge('system_memory_bytes', totalMemory, { type: 'total' });
        setGauge('system_memory_bytes', freeMemory, { type: 'free' });
        
        return {
          status,
          details: {
            totalMemoryMB: Math.round(totalMemory / 1024 / 1024),
            freeMemoryMB: Math.round(freeMemory / 1024 / 1024),
            usedMemoryMB: Math.round(usedMemory / 1024 / 1024),
            memoryUsagePercentage: Math.round((usedMemory / totalMemory) * 100),
            heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            timestamp: new Date().toISOString(),
          },
        };
      }
    },
  });
  
  // CPU health check
  createHealthCheck({
    name: 'cpu',
    severity: 'warning',
    timeout: 2000,
    async check(): Promise<HealthCheckResult> {
      try {
        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        
        // Consider unhealthy if 5 minute load average is greater than number of CPUs
        const status = loadAvg[1] > cpus.length ? 'unhealthy' : 'healthy';
        
        // Update CPU metrics
        setGauge('system_load_average', loadAvg[0], { period: '1m' });
        setGauge('system_load_average', loadAvg[1], { period: '5m' });
        setGauge('system_load_average', loadAvg[2], { period: '15m' });
        setGauge('system_cpu_count', cpus.length);
        
        return {
          status,
          details: {
            cpuCount: cpus.length,
            loadAverage1min: loadAvg[0],
            loadAverage5min: loadAvg[1],
            loadAverage15min: loadAvg[2],
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            timestamp: new Date().toISOString(),
          },
        };
      }
    },
  });
  
  // Disk space check (simplified)
  createHealthCheck({
    name: 'disk',
    severity: 'warning',
    timeout: 2000,
    async check(): Promise<HealthCheckResult> {
      // This is a simplified implementation - in a real system we'd use a library
      // to check actual disk space usage
      return {
        status: 'healthy',
        details: {
          timestamp: new Date().toISOString(),
        },
      };
    },
  });
}
