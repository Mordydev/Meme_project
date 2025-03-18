/**
 * Health Check Types
 * 
 * Type definitions for health checks
 */

/**
 * Health check status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

/**
 * Health check severity
 */
export enum HealthCheckSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /**
   * Health status
   */
  status: HealthStatus;
  
  /**
   * Error message if unhealthy
   */
  error?: string;
  
  /**
   * Additional details
   */
  details?: Record<string, any>;
}

/**
 * Health check definition
 */
export interface HealthCheckDefinition {
  /**
   * Health check name
   */
  name: string;
  
  /**
   * Function to perform the health check
   */
  check(): Promise<HealthCheckResult>;
  
  /**
   * Health check severity
   */
  severity: HealthCheckSeverity;
  
  /**
   * Health check timeout (ms)
   */
  timeout: number;
  
  /**
   * Health check description
   */
  description?: string;
  
  /**
   * Health check tags
   */
  tags?: string[];
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /**
   * Overall health status
   */
  status: HealthStatus;
  
  /**
   * Individual check results
   */
  checks: Record<string, HealthCheckResult>;
  
  /**
   * Response timestamp
   */
  timestamp: string;
  
  /**
   * Application version
   */
  version: string;
  
  /**
   * Server uptime in seconds
   */
  uptime: number;
  
  /**
   * Environment (development, staging, production)
   */
  environment?: string;
}

/**
 * Basic health response
 */
export interface BasicHealthResponse {
  /**
   * Health status
   */
  status: HealthStatus;
  
  /**
   * Response timestamp
   */
  timestamp: string;
  
  /**
   * Simplified dependency status
   */
  checks: Record<string, string>;
}

/**
 * Health metrics
 */
export interface HealthMetrics {
  /**
   * System CPU usage percentage
   */
  cpu: number;
  
  /**
   * System memory usage percentage
   */
  memory: number;
  
  /**
   * Application memory usage (MB)
   */
  processMemory: number;
  
  /**
   * Active database connections
   */
  dbConnections: number;
  
  /**
   * Requests per second
   */
  requestsPerSecond: number;
  
  /**
   * Average response time (ms)
   */
  avgResponseTime: number;
  
  /**
   * Error rate percentage
   */
  errorRate: number;
}
