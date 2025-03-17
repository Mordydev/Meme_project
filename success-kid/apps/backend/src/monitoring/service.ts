/**
 * Monitoring Service
 * 
 * Provides centralized metrics recording, monitoring, and alerting for the application.
 */
import { logger } from '../lib/logger';

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
}

// Export singleton instance
export const monitoringService = new MonitoringService();
