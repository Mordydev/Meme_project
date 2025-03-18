/**
 * Health Checks Module
 * 
 * Provides comprehensive health checks for the application and dependencies
 */
import { FastifyInstance } from 'fastify';
import os from 'os';
import {
  HealthCheckDefinition,
  HealthCheckResult,
  HealthStatus,
  HealthCheckSeverity,
  HealthCheckResponse,
  BasicHealthResponse,
  HealthMetrics
} from './health-check-types';
import { logger } from '../../lib/logger';
import { setGauge } from '../metrics';

// Store health checks
const healthChecks: Map<string, HealthCheckDefinition> = new Map();

// Keep metrics history
const metricsHistory: HealthMetrics[] = [];

/**
 * Configure health check endpoints
 */
export async function configureHealthChecks(fastify: FastifyInstance): Promise<void> {
  // Register comprehensive health check endpoint
  fastify.get('/health/detail', {
    schema: {
      hide: true, // Hide from Swagger docs
    },
    handler: async (request, reply) => {
      const startTime = process.hrtime();
      
      // Run all health checks in parallel
      const checkResults = await runAllChecks();
      
      // Calculate overall status
      const hasCriticalFailure = Array.from(healthChecks.values())
        .some(check => check.severity === HealthCheckSeverity.CRITICAL && 
              checkResults[check.name]?.status === HealthStatus.UNHEALTHY);
      
      const hasWarning = Array.from(healthChecks.values())
        .some(check => checkResults[check.name]?.status === HealthStatus.DEGRADED);
      
      const overallStatus = hasCriticalFailure 
        ? HealthStatus.UNHEALTHY 
        : hasWarning 
          ? HealthStatus.DEGRADED 
          : HealthStatus.HEALTHY;
      
      // Calculate execution time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const executionTime = seconds * 1000 + nanoseconds / 1000000;
      
      // Update health check metrics
      setGauge('health_check_execution_time_ms', executionTime);
      setGauge('health_check_status', overallStatus === HealthStatus.HEALTHY ? 1 : 0);
      
      const response: HealthCheckResponse = {
        status: overallStatus,
        checks: checkResults,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || 'unknown',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      };
      
      // Set appropriate status code
      if (overallStatus === HealthStatus.UNHEALTHY) {
        reply.code(503);
      } else if (overallStatus === HealthStatus.DEGRADED) {
        reply.code(200); // Still operational but with issues
      }
      
      return response;
    }
  });
  
  // Register simple health check endpoint (liveness probe)
  fastify.get('/health', {
    schema: {
      hide: true, // Hide from Swagger docs
    },
    handler: async (request, reply) => {
      // Run only critical checks
      const criticalChecks = Array.from(healthChecks.values())
        .filter(check => check.severity === HealthCheckSeverity.CRITICAL)
        .map(check => check.name);
      
      const results = await runSelectedChecks(criticalChecks);
      
      // Calculate overall status
      const hasCriticalFailure = criticalChecks.some(
        name => results[name]?.status === HealthStatus.UNHEALTHY
      );
      
      const status = hasCriticalFailure ? HealthStatus.UNHEALTHY : HealthStatus.HEALTHY;
      
      // Set appropriate status code
      if (status === HealthStatus.UNHEALTHY) {
        reply.code(503);
      }
      
      // Simplified response for Kubernetes liveness probe
      const response: BasicHealthResponse = {
        status,
        timestamp: new Date().toISOString(),
        checks: {
          postgres: results['database']?.status === HealthStatus.HEALTHY ? 'connected' : 'disconnected',
          redis: results['redis']?.status === HealthStatus.HEALTHY ? 'connected' : 'disconnected',
        }
      };
      
      return response;
    }
  });
  
  // Register readiness probe endpoint
  fastify.get('/health/ready', {
    schema: {
      hide: true, // Hide from Swagger docs
    },
    handler: async (request, reply) => {
      // Run checks tagged with 'readiness'
      const readinessChecks = Array.from(healthChecks.values())
        .filter(check => check.tags?.includes('readiness'))
        .map(check => check.name);
      
      const results = await runSelectedChecks(readinessChecks);
      
      // Calculate overall status
      const hasFailure = readinessChecks.some(
        name => results[name]?.status !== HealthStatus.HEALTHY
      );
      
      const status = hasFailure ? HealthStatus.UNHEALTHY : HealthStatus.HEALTHY;
      
      // Set appropriate status code
      if (status === HealthStatus.UNHEALTHY) {
        reply.code(503);
      }
      
      // Simplified response for Kubernetes readiness probe
      return {
        status,
        timestamp: new Date().toISOString(),
        checks: Object.fromEntries(
          readinessChecks.map(name => [
            name, 
            results[name]?.status === HealthStatus.HEALTHY ? 'ready' : 'not ready'
          ])
        )
      };
    }
  });
  
  // Register metrics endpoint
  fastify.get('/health/metrics', {
    schema: {
      hide: true, // Hide from Swagger docs
    },
    handler: async (request, reply) => {
      const metrics = await collectHealthMetrics();
      return { metrics, history: metricsHistory.slice(-10) };
    }
  });
  
  // Register default health checks
  registerDefaultHealthChecks();
  
  // Start metrics collection
  startMetricsCollection();
  
  logger.info(`Health checks configured with ${healthChecks.size} checks`);
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
        )
      ]);
      
      results[name] = result;
    } catch (error) {
      // Handle errors and timeouts
      results[name] = {
        status: HealthStatus.UNHEALTHY,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          timestamp: new Date().toISOString()
        }
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
        status: HealthStatus.UNHEALTHY,
        error: `Health check '${name}' not found`
      };
      return;
    }
    
    try {
      // Apply timeout to check
      const result = await Promise.race([
        check.check(),
        new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error(`Health check '${name}' timed out`)), check.timeout)
        )
      ]);
      
      results[name] = result;
    } catch (error) {
      // Handle errors and timeouts
      results[name] = {
        status: HealthStatus.UNHEALTHY,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          timestamp: new Date().toISOString()
        }
      };
    }
  });
  
  await Promise.all(checkPromises);
  return results;
}

/**
 * Get version information
 */
export function getVersionInfo(): Record<string, string> {
  return {
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    node: process.version,
    commit: process.env.GIT_COMMIT || 'unknown',
    branch: process.env.GIT_BRANCH || 'unknown',
    buildDate: process.env.BUILD_DATE || new Date().toISOString()
  };
}

/**
 * Collect health metrics
 */
async function collectHealthMetrics(): Promise<HealthMetrics> {
  // Calculate CPU usage
  const cpus = os.cpus();
  const totalCpu = cpus.reduce((acc, cpu) => {
    return acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
  }, 0);
  const idleCpu = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const cpuUsage = 100 - (idleCpu / totalCpu * 100);
  
  // Calculate memory usage
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
  
  // Process memory
  const processMemory = process.memoryUsage().rss / 1024 / 1024; // MB
  
  // Placeholder for metrics that would normally come from monitoring data
  // In a real implementation, these would be collected from actual metrics
  const metrics: HealthMetrics = {
    cpu: Math.round(cpuUsage * 100) / 100,
    memory: Math.round(memoryUsage * 100) / 100,
    processMemory: Math.round(processMemory * 100) / 100,
    dbConnections: 10, // Placeholder
    requestsPerSecond: 25, // Placeholder
    avgResponseTime: 150, // Placeholder
    errorRate: 0.5 // Placeholder
  };
  
  // Store metrics history
  metricsHistory.push(metrics);
  if (metricsHistory.length > 100) {
    metricsHistory.shift();
  }
  
  return metrics;
}

/**
 * Start metrics collection
 */
function startMetricsCollection(): void {
  // Collect metrics every minute
  setInterval(async () => {
    try {
      await collectHealthMetrics();
    } catch (error) {
      logger.error('Error collecting health metrics', { error });
    }
  }, 60000);
}

/**
 * Register default health checks
 */
function registerDefaultHealthChecks(): void {
  // Database health check
  createHealthCheck({
    name: 'database',
    description: 'Checks PostgreSQL database connectivity',
    severity: HealthCheckSeverity.CRITICAL,
    timeout: 5000,
    tags: ['readiness', 'dependency'],
    async check(): Promise<HealthCheckResult> {
      try {
        // This is a placeholder - in a real implementation, we would check the actual database
        // const pg = getPgPool();
        // await pg.query('SELECT 1');
        
        // Simulated check for now
        return {
          status: HealthStatus.HEALTHY,
          details: {
            timestamp: new Date().toISOString(),
            connections: 5, // Placeholder
            maxConnections: 20 // Placeholder
          }
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            timestamp: new Date().toISOString()
          }
        };
      }
    }
  });
  
  // Redis health check
  createHealthCheck({
    name: 'redis',
    description: 'Checks Redis connectivity',
    severity: HealthCheckSeverity.CRITICAL,
    timeout: 5000,
    tags: ['readiness', 'dependency'],
    async check(): Promise<HealthCheckResult> {
      try {
        // This is a placeholder - in a real implementation, we would check the actual Redis instance
        // const redis = getRedisClient();
        // await redis.ping();
        
        // Simulated check for now
        return {
          status: HealthStatus.HEALTHY,
          details: {
            timestamp: new Date().toISOString(),
            usedMemory: '25MB', // Placeholder
            clients: 3 // Placeholder
          }
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            timestamp: new Date().toISOString()
          }
        };
      }
    }
  });
  
  // Memory health check
  createHealthCheck({
    name: 'memory',
    description: 'Checks system and process memory usage',
    severity: HealthCheckSeverity.WARNING,
    timeout: 2000,
    tags: ['system'],
    async check(): Promise<HealthCheckResult> {
      try {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = process.memoryUsage();
        
        // Consider unhealthy if less than 10% free memory
        // Consider degraded if less than 20% free memory
        const freeMemoryPercentage = freeMemory / totalMemory;
        const status = freeMemoryPercentage < 0.1 
          ? HealthStatus.UNHEALTHY 
          : freeMemoryPercentage < 0.2 
            ? HealthStatus.DEGRADED 
            : HealthStatus.HEALTHY;
        
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
            freeMemoryPercentage: Math.round(freeMemoryPercentage * 100),
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            timestamp: new Date().toISOString()
          }
        };
      }
    }
  });
  
  // CPU health check
  createHealthCheck({
    name: 'cpu',
    description: 'Checks CPU usage and load',
    severity: HealthCheckSeverity.WARNING,
    timeout: 2000,
    tags: ['system'],
    async check(): Promise<HealthCheckResult> {
      try {
        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        
        // Consider unhealthy if 5 minute load average is greater than 2x number of CPUs
        // Consider degraded if greater than number of CPUs
        const loadRatio = loadAvg[1] / cpus.length;
        const status = loadRatio > 2 
          ? HealthStatus.UNHEALTHY 
          : loadRatio > 1 
            ? HealthStatus.DEGRADED 
            : HealthStatus.HEALTHY;
        
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
            loadRatio: Math.round(loadRatio * 100) / 100,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            timestamp: new Date().toISOString()
          }
        };
      }
    }
  });
  
  // Disk space check (simplified)
  createHealthCheck({
    name: 'disk',
    description: 'Checks available disk space',
    severity: HealthCheckSeverity.WARNING,
    timeout: 2000,
    tags: ['system'],
    async check(): Promise<HealthCheckResult> {
      // This is a simplified implementation - in a real system we'd use a library
      // to check actual disk space usage
      try {
        // Simulated check: In a real implementation, we would check actual disk space
        const freePercentage = 0.75; // 75% free (simulated)
        
        const status = freePercentage < 0.1
          ? HealthStatus.UNHEALTHY
          : freePercentage < 0.2
            ? HealthStatus.DEGRADED
            : HealthStatus.HEALTHY;
            
        return {
          status,
          details: {
            freePercentage: Math.round(freePercentage * 100),
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            timestamp: new Date().toISOString()
          }
        };
      }
    }
  });
  
  // External API health check
  createHealthCheck({
    name: 'externalApi',
    description: 'Checks connectivity to required external APIs',
    severity: HealthCheckSeverity.WARNING,
    timeout: 10000,
    tags: ['dependency', 'external'],
    async check(): Promise<HealthCheckResult> {
      try {
        // This is a placeholder - in a real implementation, we would check actual external APIs
        // Simulated check for now
        return {
          status: HealthStatus.HEALTHY,
          details: {
            timestamp: new Date().toISOString(),
            apis: {
              blockchain: 'healthy',
              priceOracle: 'healthy'
            }
          }
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            timestamp: new Date().toISOString()
          }
        };
      }
    }
  });
  
  // Web3 connectivity check
  createHealthCheck({
    name: 'web3',
    description: 'Checks blockchain connectivity',
    severity: HealthCheckSeverity.WARNING,
    timeout: 10000,
    tags: ['dependency', 'blockchain'],
    async check(): Promise<HealthCheckResult> {
      try {
        // This is a placeholder - in a real implementation, we would check actual blockchain connectivity
        // Simulated check for now
        return {
          status: HealthStatus.HEALTHY,
          details: {
            timestamp: new Date().toISOString(),
            latestBlock: 12345678, // Placeholder
            network: 'mainnet' // Placeholder
          }
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            timestamp: new Date().toISOString()
          }
        };
      }
    }
  });
}
