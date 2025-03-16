/**
 * Health Check Functions
 */
import { HealthCheckResult } from './types';
import { getPgPool, getRedisClient, checkDatabaseHealth } from '../lib/db-client';
import os from 'os';
import { logger } from '../lib/logger';

/**
 * Check database connection
 */
export async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    const pg = getPgPool();
    await pg.query('SELECT 1');
    
    return {
      status: 'healthy',
      details: {
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Check Redis connection
 */
export async function checkRedis(): Promise<HealthCheckResult> {
  try {
    const redis = getRedisClient();
    await redis.ping();
    
    return {
      status: 'healthy',
      details: {
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error({ err: error }, 'Redis health check failed');
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Check memory usage
 */
export async function checkMemory(): Promise<HealthCheckResult> {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = process.memoryUsage();
    
    // Consider unhealthy if less than 10% free memory
    const status = freeMemory / totalMemory < 0.1 ? 'unhealthy' : 'healthy';
    
    return {
      status,
      details: {
        totalMemoryMB: Math.round(totalMemory / 1024 / 1024),
        freeMemoryMB: Math.round(freeMemory / 1024 / 1024),
        usedMemoryMB: Math.round(usedMemory / 1024 / 1024),
        memoryUsagePercentage: Math.round((usedMemory / totalMemory) * 100),
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error({ err: error }, 'Memory health check failed');
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Check disk space
 */
export async function checkDiskSpace(): Promise<HealthCheckResult> {
  try {
    // This is a simplified check - in a real system, we'd use a library 
    // to check actual disk space usage, but for now we'll just return healthy
    return {
      status: 'healthy',
      details: {
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error({ err: error }, 'Disk space health check failed');
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Check CPU usage
 */
export async function checkCpu(): Promise<HealthCheckResult> {
  try {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    // Consider unhealthy if 5 minute load average is greater than number of CPUs
    const status = loadAvg[1] > cpus.length ? 'unhealthy' : 'healthy';
    
    return {
      status,
      details: {
        cpuCount: cpus.length,
        loadAverage1min: loadAvg[0],
        loadAverage5min: loadAvg[1],
        loadAverage15min: loadAvg[2],
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error({ err: error }, 'CPU health check failed');
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Run all health checks
 */
export async function runAllChecks(): Promise<Record<string, HealthCheckResult>> {
  // Run all checks in parallel
  const [database, redis, memory, disk, cpu] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkMemory(),
    checkDiskSpace(),
    checkCpu(),
  ]);
  
  return {
    database,
    redis,
    memory,
    disk,
    cpu,
  };
}
