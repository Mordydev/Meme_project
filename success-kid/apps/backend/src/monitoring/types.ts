/**
 * Monitoring Types
 */

/**
 * Metric definition
 */
export interface MetricDefinition {
  name: string;
  help: string;
  type: MetricType;
  labelNames?: string[];
}

/**
 * Metric types
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

/**
 * Metric instance
 */
export interface Metric {
  name: string;
  type: MetricType;
  inc(labels?: Record<string, string>, value?: number): void;
  dec(labels?: Record<string, string>, value?: number): void;
  set(labels: Record<string, string> | undefined, value: number): void;
  observe(labels: Record<string, string> | undefined, value: number): void;
  reset(): void;
}

/**
 * Health check severity
 */
export type HealthCheckSeverity = 'critical' | 'warning' | 'info';

/**
 * Health check definition
 */
export interface HealthCheckDefinition {
  name: string;
  check(): Promise<HealthCheckResult>;
  severity: HealthCheckSeverity;
  timeout: number;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  error?: string;
  details?: Record<string, any>;
}

/**
 * Alert rule definition
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne' | 'regex';
  threshold: number | string;
  duration: number; // seconds to violate before alerting
  severity: 'critical' | 'warning' | 'info';
  labels: Record<string, string>;
  annotations: Record<string, string>;
  channels: string[];
}

/**
 * Alert notification
 */
export interface AlertNotification {
  id: string;
  timestamp: Date;
  rule: AlertRule;
  value: number | string;
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Alert channel
 */
export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook';
  config: Record<string, any>;
  send(notification: AlertNotification): Promise<boolean>;
}
