/**
 * Metrics Module
 * 
 * Provides comprehensive metrics collection and reporting
 */
import { FastifyInstance } from 'fastify';
import { performance } from 'perf_hooks';
import { Metric, MetricType } from './types';
import { logger } from '../lib/logger';

// Store metrics
const metrics: Map<string, Metric> = new Map();

/**
 * Initialize metrics module
 */
export async function setupMetrics(fastify: FastifyInstance): Promise<void> {
  // Register metrics endpoint
  fastify.get('/metrics', {
    schema: {
      hide: true, // Hide from Swagger docs
    },
    handler: async (request, reply) => {
      return formatMetricsOutput();
    },
  });
  
  // Register default metrics
  registerDefaultMetrics();
  
  // Start metrics collection
  startMetricsCollection(fastify);
  
  fastify.log.info(`Metrics system initialized with ${metrics.size} metrics`);
}

/**
 * Register a new metric
 */
export function registerMetric(
  name: string,
  help: string,
  type: MetricType,
  labelNames: string[] = []
): Metric {
  const metric: Metric = {
    name,
    type,
    
    // Counter methods
    inc: (labels?: Record<string, string>, value: number = 1) => {
      incrementCounter(name, labels, value);
    },
    
    // Gauge methods
    dec: (labels?: Record<string, string>, value: number = 1) => {
      incrementCounter(name, labels, -value);
    },
    set: (labels: Record<string, string> | undefined, value: number) => {
      setGauge(name, value, labels);
    },
    
    // Histogram/Summary methods
    observe: (labels: Record<string, string> | undefined, value: number) => {
      observeHistogram(name, value, labels);
    },
    
    // Reset method
    reset: () => {
      // Implementation depends on metric type
    }
  };
  
  metrics.set(name, metric);
  return metric;
}

/**
 * Increment a counter metric
 */
export function incrementCounter(
  name: string, 
  labels?: Record<string, string>,
  value: number = 1
): void {
  const metric = metrics.get(name);
  
  if (!metric) {
    logger.warn(`Attempted to increment non-existent metric: ${name}`);
    return;
  }
  
  if (metric.type !== 'counter') {
    logger.warn(`Attempted to increment non-counter metric: ${name}`);
    return;
  }
  
  // In a real implementation, we would track these metrics
  // For now, we're just logging them
  logger.debug(`Metric ${name} incremented by ${value}`, { labels });
}

/**
 * Set a gauge metric
 */
export function setGauge(
  name: string,
  value: number,
  labels?: Record<string, string>
): void {
  const metric = metrics.get(name);
  
  if (!metric) {
    logger.warn(`Attempted to set non-existent metric: ${name}`);
    return;
  }
  
  if (metric.type !== 'gauge') {
    logger.warn(`Attempted to set non-gauge metric: ${name}`);
    return;
  }
  
  // In a real implementation, we would track these metrics
  logger.debug(`Metric ${name} set to ${value}`, { labels });
}

/**
 * Observe a histogram/summary value
 */
export function observeHistogram(
  name: string,
  value: number,
  labels?: Record<string, string>
): void {
  const metric = metrics.get(name);
  
  if (!metric) {
    logger.warn(`Attempted to observe non-existent metric: ${name}`);
    return;
  }
  
  if (metric.type !== 'histogram' && metric.type !== 'summary') {
    logger.warn(`Attempted to observe non-histogram/summary metric: ${name}`);
    return;
  }
  
  // In a real implementation, we would track these metrics
  logger.debug(`Metric ${name} observed value ${value}`, { labels });
}

/**
 * Record arbitrary metric
 */
export function recordMetric(
  name: string,
  value: number,
  labels?: Record<string, string>
): void {
  const metric = metrics.get(name);
  
  if (!metric) {
    logger.warn(`Attempted to record non-existent metric: ${name}`);
    return;
  }
  
  switch (metric.type) {
    case 'counter':
      incrementCounter(name, labels, value);
      break;
    case 'gauge':
      setGauge(name, value, labels);
      break;
    case 'histogram':
    case 'summary':
      observeHistogram(name, value, labels);
      break;
    default:
      logger.warn(`Unknown metric type for ${name}: ${metric.type}`);
  }
}

/**
 * Format metrics for output
 */
function formatMetricsOutput(): string {
  // In a real implementation, we would format metrics in Prometheus format
  // For now, just return a JSON representation
  const result: Record<string, any> = {};
  
  for (const [name, metric] of metrics.entries()) {
    // In a real implementation, this would include actual values
    result[name] = { type: metric.type };
  }
  
  return JSON.stringify(result, null, 2);
}

/**
 * Register default metrics
 */
function registerDefaultMetrics(): void {
  // HTTP request metrics
  registerMetric(
    'http_requests_total',
    'Total number of HTTP requests',
    'counter',
    ['method', 'route', 'status_code']
  );
  
  registerMetric(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    'histogram',
    ['method', 'route', 'status_code']
  );
  
  registerMetric(
    'http_active_connections',
    'Number of active HTTP connections',
    'gauge'
  );
  
  // Database metrics
  registerMetric(
    'db_queries_total',
    'Total number of database queries',
    'counter',
    ['type', 'table']
  );
  
  registerMetric(
    'db_query_duration_seconds',
    'Database query duration in seconds',
    'histogram',
    ['type', 'table']
  );
  
  registerMetric(
    'db_pool_size',
    'Database connection pool size',
    'gauge',
    ['state']
  );
  
  // Application metrics
  registerMetric(
    'app_uptime_seconds',
    'Application uptime in seconds',
    'counter'
  );
  
  registerMetric(
    'app_version_info',
    'Application version information',
    'gauge',
    ['version', 'commit', 'branch']
  );
  
  // System metrics
  registerMetric(
    'system_memory_bytes',
    'System memory information in bytes',
    'gauge',
    ['type']
  );
  
  registerMetric(
    'system_cpu_usage',
    'System CPU usage',
    'gauge',
    ['core']
  );
  
  registerMetric(
    'system_load_average',
    'System load average',
    'gauge',
    ['period']
  );
  
  // Business metrics
  registerMetric(
    'points_awarded_total',
    'Total points awarded',
    'counter',
    ['source']
  );
  
  registerMetric(
    'points_redeemed_total',
    'Total points redeemed',
    'counter'
  );
  
  registerMetric(
    'user_registrations_total',
    'Total user registrations',
    'counter',
    ['method']
  );
  
  registerMetric(
    'wallet_connections_total',
    'Total wallet connections',
    'counter',
    ['type']
  );
  
  registerMetric(
    'content_created_total',
    'Total content items created',
    'counter',
    ['type']
  );
  
  // Process metrics
  registerMetric(
    'process_memory_usage_bytes',
    'Process memory usage in bytes',
    'gauge',
    ['type']
  );
  
  registerMetric(
    'process_cpu_usage',
    'Process CPU usage',
    'gauge'
  );
  
  // Performance metrics
  registerMetric(
    'performance_mark',
    'Performance timing marks',
    'histogram',
    ['name']
  );
  
  registerMetric(
    'health_check_execution_time_ms',
    'Health check execution time in milliseconds',
    'gauge'
  );
  
  registerMetric(
    'health_check_status',
    'Health check status (1 = healthy, 0 = unhealthy)',
    'gauge'
  );
}

/**
 * Start metrics collection for automatic metrics
 */
function startMetricsCollection(fastify: FastifyInstance): void {
  // Update system metrics every 15 seconds
  const updateInterval = 15000;
  
  const updateMetrics = () => {
    try {
      // Update uptime
      incrementCounter('app_uptime_seconds', undefined, updateInterval / 1000);
      
      // Update process memory metrics
      const memoryUsage = process.memoryUsage();
      setGauge('process_memory_usage_bytes', memoryUsage.rss, { type: 'rss' });
      setGauge('process_memory_usage_bytes', memoryUsage.heapTotal, { type: 'heapTotal' });
      setGauge('process_memory_usage_bytes', memoryUsage.heapUsed, { type: 'heapUsed' });
      
      // Application version info (set once)
      setGauge(
        'app_version_info', 
        1, 
        {
          version: process.env.npm_package_version || 'unknown',
          commit: process.env.GIT_COMMIT || 'unknown',
          branch: process.env.GIT_BRANCH || 'unknown'
        }
      );
    } catch (error) {
      fastify.log.error({ err: error }, 'Error updating metrics');
    } finally {
      // Schedule next update
      setTimeout(updateMetrics, updateInterval);
    }
  };
  
  // Start initial update
  setTimeout(updateMetrics, 5000);
}

/**
 * Performance timing utility
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  labels?: Record<string, string>
): T {
  const startTime = performance.now();
  
  try {
    return fn();
  } finally {
    const duration = performance.now() - startTime;
    observeHistogram('performance_mark', duration / 1000, { name, ...labels });
  }
}