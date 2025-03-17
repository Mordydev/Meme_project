/**
 * Job Monitoring Alerts
 * 
 * Defines and triggers alerts for job processing issues
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';
import { JobMetrics } from './metrics';

/**
 * Alert types for job monitoring
 */
export enum AlertType {
  HIGH_ERROR_RATE = 'high_error_rate',
  QUEUE_BACKLOG = 'queue_backlog',
  STALLED_JOBS = 'stalled_jobs',
  LOW_THROUGHPUT = 'low_throughput',
  HIGH_PROCESSING_TIME = 'high_processing_time',
  REPEATED_FAILURES = 'repeated_failures',
  QUEUE_PAUSED = 'queue_paused',
  RESOURCE_EXHAUSTION = 'resource_exhaustion'
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  queueName: string;
  metrics?: Partial<JobMetrics>;
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * Alert threshold interface
 */
export interface AlertThreshold {
  metric: keyof JobMetrics | string;
  threshold: number;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
}

/**
 * Service for job monitoring alerts
 */
export class AlertService {
  private readonly alertsKey = 'job:alerts';
  private readonly thresholdsKey = 'job:alert:thresholds';
  private readonly defaultThresholds: AlertThreshold[] = [
    {
      metric: 'errorRate',
      threshold: 0.1, // 10% error rate
      type: AlertType.HIGH_ERROR_RATE,
      severity: AlertSeverity.WARNING,
      message: 'High error rate detected'
    },
    {
      metric: 'waiting',
      threshold: 100, // 100 jobs waiting
      type: AlertType.QUEUE_BACKLOG,
      severity: AlertSeverity.WARNING,
      message: 'Queue backlog detected'
    },
    {
      metric: 'averageProcessingTime',
      threshold: 10000, // 10 seconds
      type: AlertType.HIGH_PROCESSING_TIME,
      severity: AlertSeverity.WARNING,
      message: 'High processing time detected'
    },
    {
      metric: 'throughput',
      threshold: 1, // Less than 1 job per minute
      type: AlertType.LOW_THROUGHPUT,
      severity: AlertSeverity.WARNING,
      message: 'Low throughput detected',
      comparison: 'lt' // Less than
    }
  ];
  
  constructor() {
    // Initialize default thresholds
    this.initializeDefaultThresholds();
  }
  
  /**
   * Initialize default alert thresholds
   */
  private async initializeDefaultThresholds(): Promise<void> {
    try {
      // Check if thresholds already exist
      const thresholdsExist = await redis.exists(this.thresholdsKey);
      
      if (!thresholdsExist) {
        // Set default thresholds
        for (const threshold of this.defaultThresholds) {
          const key = `${threshold.metric}:${threshold.type}`;
          await redis.hset(
            this.thresholdsKey,
            key,
            JSON.stringify(threshold)
          );
        }
        
        logger.info('Initialized default alert thresholds', {
          thresholdCount: this.defaultThresholds.length
        });
      }
    } catch (error) {
      logger.error('Error initializing default alert thresholds', { error });
    }
  }
  
  /**
   * Set an alert threshold
   * 
   * @param metric The metric to monitor
   * @param threshold The threshold value
   * @param type Alert type
   * @param severity Alert severity
   * @param message Alert message
   * @param comparison Comparison type ('gt' for greater than, 'lt' for less than)
   */
  async setAlertThreshold(
    metric: keyof JobMetrics | string,
    threshold: number,
    type: AlertType,
    severity: AlertSeverity = AlertSeverity.WARNING,
    message?: string,
    comparison: 'gt' | 'lt' = 'gt'
  ): Promise<void> {
    try {
      const alertThreshold: AlertThreshold = {
        metric,
        threshold,
        type,
        severity,
        message: message || `${metric} threshold exceeded`,
        comparison
      };
      
      // Set threshold in Redis
      const key = `${metric}:${type}`;
      await redis.hset(
        this.thresholdsKey,
        key,
        JSON.stringify(alertThreshold)
      );
      
      logger.info('Set alert threshold', {
        metric,
        threshold,
        type,
        severity
      });
    } catch (error) {
      logger.error('Error setting alert threshold', {
        metric,
        threshold,
        error
      });
      throw error;
    }
  }
  
  /**
   * Get all alert thresholds
   * 
   * @returns List of alert thresholds
   */
  async getAlertThresholds(): Promise<AlertThreshold[]> {
    try {
      // Get all thresholds from Redis
      const thresholds = await redis.hgetall(this.thresholdsKey);
      
      // Parse thresholds
      return Object.values(thresholds).map(thresholdJson => 
        JSON.parse(thresholdJson)
      );
    } catch (error) {
      logger.error('Error getting alert thresholds', { error });
      return [];
    }
  }
  
  /**
   * Check metrics against thresholds and trigger alerts
   * 
   * @param metrics Job metrics to check
   * @returns Triggered alerts
   */
  async checkMetricsForAlerts(metrics: JobMetrics): Promise<Alert[]> {
    try {
      const thresholds = await this.getAlertThresholds();
      const alerts: Alert[] = [];
      
      // Check each threshold
      for (const threshold of thresholds) {
        const metricValue = metrics[threshold.metric as keyof JobMetrics];
        
        // Skip if metric is not available
        if (metricValue === undefined) {
          continue;
        }
        
        // Check if threshold is exceeded
        const comparison = threshold.comparison || 'gt'; // Default to 'greater than'
        let thresholdExceeded = false;
        
        if (comparison === 'gt') {
          thresholdExceeded = metricValue > threshold.threshold;
        } else {
          thresholdExceeded = metricValue < threshold.threshold;
        }
        
        if (thresholdExceeded) {
          // Create alert
          const alert: Alert = {
            id: uuidv4(),
            type: threshold.type,
            message: threshold.message,
            severity: threshold.severity,
            queueName: metrics.queue,
            metrics: {
              [threshold.metric]: metricValue,
              queue: metrics.queue,
              timestamp: metrics.timestamp
            },
            timestamp: new Date(),
            acknowledged: false
          };
          
          // Trigger alert
          await this.triggerAlert(alert);
          alerts.push(alert);
        }
      }
      
      return alerts;
    } catch (error) {
      logger.error('Error checking metrics for alerts', {
        queueName: metrics.queue,
        error
      });
      return [];
    }
  }
  
  /**
   * Trigger a custom alert
   * 
   * @param alert The alert to trigger
   */
  async triggerAlert(alert: Alert): Promise<void> {
    try {
      // Store alert in Redis
      await redis.zadd(
        this.alertsKey,
        alert.timestamp.getTime(),
        JSON.stringify(alert)
      );
      
      // Log alert
      logger.warn('Alert triggered', {
        alertId: alert.id,
        type: alert.type,
        queue: alert.queueName,
        severity: alert.severity,
        message: alert.message
      });
      
      // TODO: Integration with notification systems (email, Slack, etc.)
    } catch (error) {
      logger.error('Error triggering alert', {
        alertId: alert.id,
        error
      });
    }
  }
  
  /**
   * Get active alerts
   * 
   * @param acknowledged Include acknowledged alerts
   * @param limit Maximum number of alerts to return
   * @returns List of alerts
   */
  async getAlerts(acknowledged: boolean = false, limit: number = 100): Promise<Alert[]> {
    try {
      // Get alerts from Redis
      const alertsJson = await redis.zrevrange(this.alertsKey, 0, limit - 1);
      
      // Parse alerts
      const alerts = alertsJson.map(alertJson => JSON.parse(alertJson) as Alert);
      
      // Filter by acknowledgement status if requested
      if (!acknowledged) {
        return alerts.filter(alert => !alert.acknowledged);
      }
      
      return alerts;
    } catch (error) {
      logger.error('Error getting alerts', { error });
      return [];
    }
  }
  
  /**
   * Acknowledge an alert
   * 
   * @param alertId The alert ID
   * @returns True if the alert was acknowledged
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      // Get alerts
      const alertsJson = await redis.zrange(this.alertsKey, 0, -1);
      
      // Find the alert
      for (const alertJson of alertsJson) {
        const alert = JSON.parse(alertJson) as Alert;
        
        if (alert.id === alertId) {
          // Update alert
          alert.acknowledged = true;
          
          // Remove old alert
          await redis.zrem(this.alertsKey, alertJson);
          
          // Add updated alert
          await redis.zadd(
            this.alertsKey,
            alert.timestamp.getTime(),
            JSON.stringify(alert)
          );
          
          logger.info('Alert acknowledged', { alertId });
          return true;
        }
      }
      
      logger.warn('Alert not found for acknowledgement', { alertId });
      return false;
    } catch (error) {
      logger.error('Error acknowledging alert', { alertId, error });
      return false;
    }
  }
  
  /**
   * Clean up old alerts
   * 
   * @param olderThan Time in milliseconds (default: 7 days)
   * @returns Number of alerts removed
   */
  async cleanUpOldAlerts(olderThan: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const cutoff = Date.now() - olderThan;
      
      // Remove old alerts
      const removed = await redis.zremrangebyscore(this.alertsKey, 0, cutoff);
      
      logger.info('Cleaned up old alerts', { removed });
      return removed;
    } catch (error) {
      logger.error('Error cleaning up old alerts', { error });
      return 0;
    }
  }
}

// Export singleton instance
export const alertService = new AlertService();
