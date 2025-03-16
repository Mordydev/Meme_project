/**
 * Health Check Types
 */

/**
 * Health check status
 */
export type HealthStatus = 'healthy' | 'unhealthy';

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: HealthStatus;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Health check information
 */
export interface HealthCheck {
  name: string;
  check(): Promise<HealthCheckResult>;
  timeout: number;
}

/**
 * Health status response
 */
export interface HealthStatus {
  status: HealthStatus;
  checks: Record<string, HealthCheckResult>;
  timestamp: string;
  version: string;
  uptime: number;
}
