/**
 * Monitoring Service
 * 
 * Provides centralized metrics recording, monitoring, and alerting for the application.
 */
import { logger } from '@/lib/logger';
import { Registry, Counter, Gauge, Histogram, Summary } from 'prom-client';

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = 'counter', // Monotonically increasing counter
  GAUGE = 'gauge',     // Value that can go up and down
  HISTOGRAM = 'histogram', // Distribution of values
  SUMMARY = 'summary'  // Similar to histogram but calculates quantiles
}

/**
 * Metric value type
 */
export type MetricValue = number;

/**
 * Metric labels/tags type
 */
export type MetricLabels = Record<string, string | number | boolean>;

/**
 * Monitoring service class
 */
export class MonitoringService {
  private metrics: Map<string, {
    type: MetricType;
    value: MetricValue;
    labels?: MetricLabels;
    lastUpdated: number;
  }> = new Map();
  
  private alertThresholds: Map<string, {
    min?: number;
    max?: number;
    duration?: number; // How long the condition must be true before alerting
    alertSent?: boolean;
    firstExceeded?: number;
  }> = new Map();
  
  // Track availability for health checks
  private availability: Map<string, {
    status: 'up' | 'down' | 'degraded';
    lastCheck: number;
    responseTime?: number;
    error?: any;
  }> = new Map();
  
  // Prometheus registry for Prometheus metrics format
  private registry: Registry;
  private prometheusMetrics: Map<string, Counter<string> | Gauge<string> | Histogram<string> | Summary<string>> = new Map();
  
  constructor() {
    this.registry = new Registry();
    
    // Register default metrics
    this.setupDefaultMetrics();
  }
  
  /**
   * Set up default application metrics
   */
  private setupDefaultMetrics(): void {
    // Register Node.js metrics
    this.registry.registerMetric(
      new Counter({
        name: 'app_http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status']
      })
    );
    
    this.prometheusMetrics.set('app_http_requests_total', 
      this.registry.getSingleMetric('app_http_requests_total') as Counter<string>);
    
    this.registry.registerMetric(
      new Histogram({
        name: 'app_http_request_duration_seconds',
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'route', 'status'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
      })
    );
    
    this.prometheusMetrics.set('app_http_request_duration_seconds', 
      this.registry.getSingleMetric('app_http_request_duration_seconds') as Histogram<string>);
    
    this.registry.registerMetric(
      new Counter({
        name: 'app_errors_total',
        help: 'Total number of application errors',
        labelNames: ['category', 'code', 'path']
      })
    );
    
    this.prometheusMetrics.set('app_errors_total', 
      this.registry.getSingleMetric('app_errors_total') as Counter<string>);
    
    this.registry.registerMetric(
      new Gauge({
        name: 'app_points_transactions_rate',
        help: 'Rate of points transactions per minute',
        labelNames: ['type', 'source']
      })
    );
    
    this.prometheusMetrics.set('app_points_transactions_rate', 
      this.registry.getSingleMetric('app_points_transactions_rate') as Gauge<string>);
    
    this.registry.registerMetric(
      new Gauge({
        name: 'app_active_users',
        help: 'Number of currently active users',
        labelNames: ['authenticated']
      })
    );
    
    this.prometheusMetrics.set('app_active_users', 
      this.registry.getSingleMetric('app_active_users') as Gauge<string>);
    
    this.registry.registerMetric(
      new Gauge({
        name: 'app_memory_usage_bytes',
        help: 'Application memory usage in bytes',
        collect: () => {
          // Set the gauge value to the current memory usage
          const mem = process.memoryUsage();
          (this.prometheusMetrics.get('app_memory_usage_bytes') as Gauge<string>).set(mem.heapUsed);
        }
      })
    );
    
    this.prometheusMetrics.set('app_memory_usage_bytes', 
      this.registry.getSingleMetric('app_memory_usage_bytes') as Gauge<string>);
  }
  
  /**
   * Record a metric value
   * 
   * @param name Metric name
   * @param value Metric value
   * @param labels Optional labels/tags
   * @param type Metric type (default: counter)
   */
  recordMetric(
    name: string,
    value: MetricValue,
    labels: MetricLabels = {},
    type: MetricType = MetricType.COUNTER
  ): void {
    try {
      // Create unique key including labels
      const key = this.createMetricKey(name, labels);
      
      // Get current metric
      const current = this.metrics.get(key);
      
      // Calculate new value based on type
      let newValue = value;
      
      if (current) {
        if (type === MetricType.COUNTER) {
          // Counters are cumulative
          newValue = current.value + value;
        }
        // For gauges, histograms, and summaries, use the provided value directly
      }
      
      // Store updated metric
      this.metrics.set(key, {
        type,
        value: newValue,
        labels,
        lastUpdated: Date.now()
      });
      
      // Update Prometheus metric if it exists
      this.updatePrometheusMetric(name, value, type, labels);
      
      // Check for alerts
      this.checkAlerts(name, newValue, labels);
      
      // Debug logging for certain metrics
      if (
        name.startsWith('websocket.') || 
        name.startsWith('error.') ||
        name.includes('.error') ||
        type === MetricType.GAUGE
      ) {
        logger.debug(`Metric recorded: ${name}=${newValue}`, { labels });
      }
    } catch (error) {
      logger.error('Failed to record metric', { error, name, value, labels });
    }
  }
  
  /**
   * Update Prometheus metric
   */
  private updatePrometheusMetric(
    name: string,
    value: number,
    type: MetricType,
    labels: MetricLabels
  ): void {
    const prometheusName = `app_${name.replace(/\./g, '_')}`;
    let metric = this.prometheusMetrics.get(prometheusName);
    
    if (!metric) {
      // Try to create metric on-demand
      try {
        switch (type) {
          case MetricType.COUNTER:
            metric = new Counter({
              name: prometheusName,
              help: `Counter for ${name}`,
              labelNames: Object.keys(labels)
            });
            break;
            
          case MetricType.GAUGE:
            metric = new Gauge({
              name: prometheusName,
              help: `Gauge for ${name}`,
              labelNames: Object.keys(labels)
            });
            break;
            
          case MetricType.HISTOGRAM:
            metric = new Histogram({
              name: prometheusName,
              help: `Histogram for ${name}`,
              labelNames: Object.keys(labels),
              buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10]
            });
            break;
            
          case MetricType.SUMMARY:
            metric = new Summary({
              name: prometheusName,
              help: `Summary for ${name}`,
              labelNames: Object.keys(labels),
              percentiles: [0.5, 0.9, 0.95, 0.99]
            });
            break;
        }
        
        if (metric) {
          this.registry.registerMetric(metric);
          this.prometheusMetrics.set(prometheusName, metric);
        }
      } catch (error) {
        logger.warn(`Failed to create Prometheus metric ${prometheusName}`, { error });
        return;
      }
    }
    
    if (!metric) return;
    
    // Convert label values to strings for Prometheus
    const stringLabels: Record<string, string> = {};
    for (const [key, value] of Object.entries(labels)) {
      stringLabels[key] = String(value);
    }
    
    try {
      // Update the metric based on type
      switch (type) {
        case MetricType.COUNTER:
          (metric as Counter<string>).inc(stringLabels, value);
          break;
          
        case MetricType.GAUGE:
          (metric as Gauge<string>).set(stringLabels, value);
          break;
          
        case MetricType.HISTOGRAM:
          (metric as Histogram<string>).observe(stringLabels, value);
          break;
          
        case MetricType.SUMMARY:
          (metric as Summary<string>).observe(stringLabels, value);
          break;
      }
    } catch (error) {
      logger.warn(`Failed to update Prometheus metric ${prometheusName}`, { error });
    }
  }
  
  /**
   * Update service availability status
   * 
   * @param service Service name
   * @param status Availability status
   * @param responseTime Response time in ms (if available)
   * @param error Error details (if service is down)
   */
  updateServiceStatus(
    service: string,
    status: 'up' | 'down' | 'degraded',
    responseTime?: number,
    error?: any
  ): void {
    this.availability.set(service, {
      status,
      lastCheck: Date.now(),
      responseTime,
      error
    });
    
    // Record as metric for alerting
    this.recordMetric(`service.${service}.status`, status === 'up' ? 1 : 0, {}, MetricType.GAUGE);
    
    if (responseTime !== undefined) {
      this.recordMetric(`service.${service}.response_time`, responseTime, {}, MetricType.HISTOGRAM);
    }
    
    // Log status changes
    if (status !== 'up') {
      logger.warn(`Service status changed: ${service} is ${status}`, {
        service,
        status,
        responseTime,
        error
      });
    } else {
      logger.debug(`Service status: ${service} is up`, {
        service,
        responseTime
      });
    }
  }
  
  /**
   * Get current service availability status
   * 
   * @param service Service name
   * @returns Service availability or undefined if not tracked
   */
  getServiceStatus(service: string): {
    status: 'up' | 'down' | 'degraded';
    lastCheck: number;
    responseTime?: number;
    error?: any;
  } | undefined {
    return this.availability.get(service);
  }
  
  /**
   * Get all service statuses
   * 
   * @returns Map of service names to availability status
   */
  getAllServiceStatuses(): Map<string, {
    status: 'up' | 'down' | 'degraded';
    lastCheck: number;
    responseTime?: number;
    error?: any;
  }> {
    return new Map(this.availability);
  }
  
  /**
   * Get current metric value
   * 
   * @param name Metric name
   * @param labels Optional labels/tags
   * @returns Current metric value or undefined
   */
  getMetric(name: string, labels: MetricLabels = {}): MetricValue | undefined {
    const key = this.createMetricKey(name, labels);
    return this.metrics.get(key)?.value;
  }
  
  /**
   * Get all metrics matching a prefix
   * 
   * @param prefix Metric name prefix
   * @returns Map of metric keys to values
   */
  getMetricsByPrefix(prefix: string): Map<string, MetricValue> {
    const result = new Map<string, MetricValue>();
    
    for (const [key, metric] of this.metrics.entries()) {
      // Extract name from key (remove label part)
      const name = key.split('{')[0];
      
      if (name.startsWith(prefix)) {
        result.set(key, metric.value);
      }
    }
    
    return result;
  }
  
  /**
   * Set an alert threshold for a metric
   * 
   * @param name Metric name
   * @param options Alert options
   * @param labels Optional labels/tags
   */
  setAlertThreshold(
    name: string,
    options: {
      min?: number;
      max?: number;
      duration?: number; // milliseconds
    },
    labels: MetricLabels = {}
  ): void {
    const key = this.createMetricKey(name, labels);
    this.alertThresholds.set(key, { ...options, alertSent: false });
  }
  
  /**
   * Check if a metric exceeds alert thresholds
   * 
   * @param name Metric name
   * @param value Current value
   * @param labels Optional labels/tags
   */
  private checkAlerts(name: string, value: MetricValue, labels: MetricLabels = {}): void {
    const key = this.createMetricKey(name, labels);
    const threshold = this.alertThresholds.get(key);
    
    if (!threshold) {
      return;
    }
    
    const now = Date.now();
    const exceededThreshold = 
      (threshold.min !== undefined && value < threshold.min) ||
      (threshold.max !== undefined && value > threshold.max);
    
    if (exceededThreshold) {
      // First time exceeding threshold
      if (!threshold.firstExceeded) {
        threshold.firstExceeded = now;
      }
      
      // Check if duration threshold is met
      const durationExceeded = !threshold.duration || 
        (now - threshold.firstExceeded) >= threshold.duration;
      
      if (durationExceeded && !threshold.alertSent) {
        // Send alert
        this.sendAlert(name, value, threshold, labels);
        threshold.alertSent = true;
      }
    } else {
      // Reset if no longer exceeding
      threshold.firstExceeded = undefined;
      threshold.alertSent = false;
    }
  }
  
  /**
   * Send an alert when a metric exceeds thresholds
   * 
   * @param name Metric name
   * @param value Current value
   * @param threshold Alert threshold
   * @param labels Optional labels/tags
   */
  private sendAlert(
    name: string,
    value: MetricValue,
    threshold: {
      min?: number;
      max?: number;
      duration?: number;
    },
    labels: MetricLabels = {}
  ): void {
    try {
      // Determine threshold type
      const thresholdType = threshold.min !== undefined ? 'below' : 'above';
      const thresholdValue = threshold.min !== undefined ? threshold.min : threshold.max;
      
      // Record alert metric
      this.recordMetric('alerts.triggered', 1, {
        metric_name: name,
        threshold_type: thresholdType,
        threshold_value: String(thresholdValue),
        current_value: String(value),
        ...labels
      });
      
      // Log alert
      logger.warn(`Metric alert: ${name} is ${thresholdType} threshold`, {
        metricName: name,
        value,
        threshold: thresholdValue,
        labels
      });
      
      // In a production environment, this would send to monitoring system
      // such as Datadog, New Relic, or PagerDuty
      
      // For demonstration, just log the alert
    } catch (error) {
      logger.error('Failed to send metric alert', { error, name, value, threshold });
    }
  }
  
  /**
   * Create a unique key for a metric including labels
   * 
   * @param name Metric name
   * @param labels Labels/tags
   * @returns Unique metric key
   */
  private createMetricKey(name: string, labels: MetricLabels = {}): string {
    if (Object.keys(labels).length === 0) {
      return name;
    }
    
    // Sort labels for consistent keys
    const sortedLabels = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    
    // Create labels string
    const labelsStr = sortedLabels
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    return `${name}{${labelsStr}}`;
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    
    // Reset prometheus metrics
    for (const [name, metric] of this.prometheusMetrics.entries()) {
      try {
        this.registry.removeSingleMetric(name);
      } catch (e) {
        // Ignore removal errors
      }
    }
    this.prometheusMetrics.clear();
    
    // Recreate default metrics
    this.setupDefaultMetrics();
  }
  
  /**
   * Get a summary of all recorded metrics
   * 
   * @returns Object with all metrics
   */
  getMetricsSummary(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, metric] of this.metrics.entries()) {
      result[key] = {
        value: metric.value,
        type: metric.type,
        labels: metric.labels,
        lastUpdated: new Date(metric.lastUpdated).toISOString()
      };
    }
    
    return result;
  }
  
  /**
   * Get Prometheus metrics
   * 
   * @returns Prometheus formatted metrics
   */
  async getPrometheusMetrics(): Promise<string> {
    return this.registry.metrics();
  }
  
  /**
   * Get the Prometheus registry
   * 
   * @returns Prometheus registry
   */
  getRegistry(): Registry {
    return this.registry;
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();