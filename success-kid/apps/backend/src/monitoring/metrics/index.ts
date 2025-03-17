/**
 * Metrics Collection
 * 
 * System for collecting and managing application metrics.
 */
import { FastifyInstance } from 'fastify';
import { Registry, Counter, Gauge, Histogram, Summary } from 'prom-client';
import { logger } from '@/lib/logger';

/**
 * Metric definition interface
 */
export interface MetricDefinition {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labelNames?: string[];
}

/**
 * Monitoring service for metric collection and reporting
 */
export class MetricsService {
  private registry: Registry;
  private metrics: Map<string, any> = new Map();
  private defaultLabels: Record<string, string>;
  
  /**
   * Create a new metrics service
   * 
   * @param defaultLabels Default labels to apply to all metrics
   */
  constructor(defaultLabels: Record<string, string> = {}) {
    this.registry = new Registry();
    this.defaultLabels = defaultLabels;
    
    // Set default labels on registry
    this.registry.setDefaultLabels(defaultLabels);
    
    // Register default metrics
    this.registerDefaultMetrics();
  }
  
  /**
   * Register default metrics
   */
  private registerDefaultMetrics(): void {
    // Register Node.js metrics
    this.registry.registerMetric(
      new Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status']
      })
    );
    
    this.metrics.set('http_requests_total', this.registry.getSingleMetric('http_requests_total'));
    
    this.registry.registerMetric(
      new Histogram({
        name: 'http_request_duration_seconds',
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'route', 'status'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
      })
    );
    
    this.metrics.set('http_request_duration_seconds', this.registry.getSingleMetric('http_request_duration_seconds'));
    
    this.registry.registerMetric(
      new Gauge({
        name: 'app_memory_usage_bytes',
        help: 'Application memory usage in bytes',
        collect: () => {
          // Set the gauge value to the current memory usage
          (this.metrics.get('app_memory_usage_bytes') as Gauge<string>).set(
            process.memoryUsage().heapUsed
          );
        }
      })
    );
    
    this.metrics.set('app_memory_usage_bytes', this.registry.getSingleMetric('app_memory_usage_bytes'));
  }
  
  /**
   * Register a new metric
   * 
   * @param definition Metric definition
   * @returns The registered metric
   */
  registerMetric(definition: MetricDefinition): any {
    // Check if metric already exists
    if (this.metrics.has(definition.name)) {
      return this.metrics.get(definition.name);
    }
    
    // Create the metric based on type
    let metric;
    switch (definition.type) {
      case 'counter':
        metric = new Counter({
          name: definition.name,
          help: definition.help,
          labelNames: definition.labelNames
        });
        break;
        
      case 'gauge':
        metric = new Gauge({
          name: definition.name,
          help: definition.help,
          labelNames: definition.labelNames
        });
        break;
        
      case 'histogram':
        metric = new Histogram({
          name: definition.name,
          help: definition.help,
          labelNames: definition.labelNames,
          buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
        });
        break;
        
      case 'summary':
        metric = new Summary({
          name: definition.name,
          help: definition.help,
          labelNames: definition.labelNames,
          percentiles: [0.5, 0.9, 0.95, 0.99]
        });
        break;
        
      default:
        throw new Error(`Unsupported metric type: ${definition.type}`);
    }
    
    // Register the metric
    this.registry.registerMetric(metric);
    this.metrics.set(definition.name, metric);
    
    return metric;
  }
  
  /**
   * Increment a counter metric
   * 
   * @param name Metric name
   * @param labels Metric labels
   * @param value Increment value (default: 1)
   */
  incrementCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const metric = this.metrics.get(name);
    
    if (!metric) {
      logger.warn(`Metric not found: ${name}`);
      return;
    }
    
    if (metric instanceof Counter) {
      metric.inc(labels, value);
    } else {
      logger.warn(`Metric ${name} is not a counter`);
    }
  }
  
  /**
   * Set a gauge metric value
   * 
   * @param name Metric name
   * @param labels Metric labels
   * @param value Gauge value
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    
    if (!metric) {
      logger.warn(`Metric not found: ${name}`);
      return;
    }
    
    if (metric instanceof Gauge) {
      metric.set(labels, value);
    } else {
      logger.warn(`Metric ${name} is not a gauge`);
    }
  }
  
  /**
   * Record a histogram observation
   * 
   * @param name Metric name
   * @param labels Metric labels
   * @param value Observation value
   */
  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    
    if (!metric) {
      logger.warn(`Metric not found: ${name}`);
      return;
    }
    
    if (metric instanceof Histogram) {
      metric.observe(labels, value);
    } else {
      logger.warn(`Metric ${name} is not a histogram`);
    }
  }
  
  /**
   * Get the current value of a metric
   * 
   * @param name Metric name
   * @param labels Metric labels
   * @returns Metric value or undefined
   */
  async getMetricValue(name: string, labels: Record<string, string> = {}): Promise<number | undefined> {
    const metric = this.metrics.get(name);
    
    if (!metric) {
      logger.warn(`Metric not found: ${name}`);
      return undefined;
    }
    
    // Get the current value, behavior depends on metric type
    if (metric instanceof Counter || metric instanceof Gauge) {
      try {
        const values = await metric.get();
        
        // Find the value with matching labels
        const matchingValue = values.find(value => {
          // Check if all label values match
          for (const [key, val] of Object.entries(labels)) {
            if (value.labels[key] !== val) {
              return false;
            }
          }
          return true;
        });
        
        return matchingValue ? matchingValue.value : undefined;
      } catch (error) {
        logger.error('Error getting metric value', { name, labels, error });
        return undefined;
      }
    } else {
      logger.warn(`Getting value not supported for metric type: ${name}`);
      return undefined;
    }
  }
  
  /**
   * Get all metrics in Prometheus format
   * 
   * @returns Prometheus formatted metrics
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
  
  /**
   * Get the metric registry
   * 
   * @returns Prometheus registry
   */
  getRegistry(): Registry {
    return this.registry;
  }
}

/**
 * Create a monitoring middleware for Fastify
 * 
 * @param metricsService Metrics service instance
 * @returns Middleware function
 */
export function createMetricsMiddleware(metricsService: MetricsService) {
  return async (request: any, reply: any) => {
    // Record request start time
    const startTime = process.hrtime();
    
    // Add response hook to record metrics after request completes
    reply.addHook('onSend', (request: any, reply: any, payload: any) => {
      try {
        // Calculate response time
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const responseTime = seconds + nanoseconds / 1e9;
        
        // Extract route pattern or path if not available
        const route = request.routerPath || request.url;
        
        // Record request count
        metricsService.incrementCounter('http_requests_total', {
          method: request.method,
          route,
          status: String(reply.statusCode)
        });
        
        // Record request duration
        metricsService.recordHistogram('http_request_duration_seconds', responseTime, {
          method: request.method,
          route,
          status: String(reply.statusCode)
        });
      } catch (error) {
        // Don't let monitoring errors affect response
        logger.error('Error in metrics middleware', { error });
      }
      
      return payload;
    });
  };
}

/**
 * Set up metrics collection for a Fastify instance
 * 
 * @param app Fastify instance
 * @param options Configuration options
 * @returns Metrics service instance
 */
export function setupMetrics(
  app: FastifyInstance,
  options: {
    defaultLabels?: Record<string, string>;
    endpoint?: string;
    enableDefaultMetrics?: boolean;
  } = {}
): MetricsService {
  // Create metrics service
  const metricsService = new MetricsService(options.defaultLabels || {
    app: 'success-kid-api',
    environment: process.env.NODE_ENV || 'development'
  });
  
  // Add metrics middleware
  app.addHook('onRequest', createMetricsMiddleware(metricsService));
  
  // Enable default metrics collection if requested
  if (options.enableDefaultMetrics !== false) {
    require('prom-client').collectDefaultMetrics({
      register: metricsService.getRegistry()
    });
  }
  
  // Add metrics endpoint
  app.get(options.endpoint || '/metrics', {
    schema: {
      hide: true
    },
    handler: async (request, reply) => {
      const metrics = await metricsService.getMetrics();
      return reply
        .type('text/plain')
        .send(metrics);
    }
  });
  
  // Add metrics service to app instance
  app.decorate('metrics', metricsService);
  
  return metricsService;
}

// Create singleton instance
const metricsService = new MetricsService();

export default {
  MetricsService,
  createMetricsMiddleware,
  setupMetrics,
  service: metricsService
};
