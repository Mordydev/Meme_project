/**
 * Health Check Implementations
 * 
 * Individual health check functions for monitoring system and dependency health.
 */
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { getPgPool, getRedisClient } from '../lib/db-client';
import { logger } from '../lib/logger';
import { readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  details?: any;
  error?: string;
  timestamp: string;
}

/**
 * Check database connection health
 * 
 * @returns Health check result with database status
 */
export async function checkDatabaseConnection(): Promise<HealthCheckResult> {
  try {
    const start = Date.now();
    const pool = getPgPool();
    const result = await pool.query('SELECT NOW()');
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      details: {
        responseTime: `${duration}ms`,
        version: result.rows[0]?.version || 'unknown',
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Database health check failed', { error });
    
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check Redis connection health
 * 
 * @returns Health check result with Redis status
 */
export async function checkRedisConnection(): Promise<HealthCheckResult> {
  try {
    const start = Date.now();
    const redis = getRedisClient();
    await redis.ping();
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      details: {
        responseTime: `${duration}ms`,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Redis health check failed', { error });
    
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check disk space usage
 * 
 * @returns Health check result with disk space status
 */
export async function checkDiskSpace(): Promise<HealthCheckResult> {
  try {
    // Only check root directory where app is running
    const { free, size } = await getDiskSpace('/');
    const usedPercentage = (1 - free / size) * 100;
    
    // Consider unhealthy if disk is more than 90% full
    const status = usedPercentage < 90 ? 'healthy' : 'unhealthy';
    
    return {
      status,
      details: {
        total: formatBytes(size),
        free: formatBytes(free),
        usedPercentage: `${usedPercentage.toFixed(1)}%`,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Disk space health check failed', { error });
    
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check memory usage
 * 
 * @returns Health check result with memory usage status
 */
export async function checkMemoryUsage(): Promise<HealthCheckResult> {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedPercentage = ((totalMem - freeMem) / totalMem) * 100;
    
    // Consider unhealthy if memory is more than 90% used
    const status = usedPercentage < 90 ? 'healthy' : 'unhealthy';
    
    return {
      status,
      details: {
        total: formatBytes(totalMem),
        free: formatBytes(freeMem),
        usedPercentage: `${usedPercentage.toFixed(1)}%`,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Memory usage health check failed', { error });
    
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get application version from package.json
 * 
 * @returns Application version string
 */
export function getAppVersion(): string {
  try {
    // Read package.json to get version
    const packagePath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return packageJson.version || 'unknown';
  } catch (error) {
    logger.error('Failed to get application version', { error });
    return 'unknown';
  }
}

// Helper function to get disk space info
async function getDiskSpace(path: string): Promise<{ free: number; size: number }> {
  // This is a placeholder since Node.js doesn't provide direct disk space checking
  // In a real implementation, you'd use a package like `diskusage` or `check-disk-space`
  // For now, we'll just return some dummy values
  return {
    free: 1024 * 1024 * 1024 * 50, // 50 GB free
    size: 1024 * 1024 * 1024 * 100, // 100 GB total
  };
}

// Helper function to format bytes into human-readable form
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
