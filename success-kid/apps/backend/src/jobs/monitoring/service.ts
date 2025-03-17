/**
 * Job Monitoring Service
 * 
 * Manages monitoring, metrics collection, and alerting for background jobs.
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { redisClient } from '../../lib/redis-client';
import { getAllQueues } from '../queues';
import { eventBus, EventType } from '../../lib/event-bus';
import { 
  MetricType, 
  AlertSeverity, 
  AlertStatus, 
  ThresholdOperator, 
  ThresholdBreach,
  TimeInterval,
  AggregationMethod
} from './types';

/**
 * Job metrics interface
 */
export interface JobMetrics {
  /** Queue name */
  queue: string;
  /** Number of completed jobs */
  completed: number;
  /** Number of failed jobs */
  failed: number;
  /** Number of delayed jobs */
  delayed: number;
  /** Number of active jobs */
  active: number;
  /** Number of waiting jobs */
  waiting: number;
  /** Average processing time (ms) */
  averageProcessingTime: number;
  /** Throughput (jobs/minute) */
  throughput: number;
  /** Error rate (percentage) */
  errorRate: number;
  /** Collected at timestamp */
  timestamp: Date;
}

/**
 * Alert threshold definition
 */
export interface AlertThreshold {
  /** Unique threshold ID */
  id: string;
  /** Queue name (or 'all' for all queues) */
  queue: string;
  /** Metric to monitor */
  metric: MetricType;
  /** Comparison operator */
  operator: ThresholdOperator;
  /** Threshold value */
  value: number;
  /** Alert severity */
  severity: AlertSeverity;
  /** Minimum consecutive breaches before alerting */
  minConsecutiveBreaches: number;
  /** Whether the threshold is enabled */
  enabled: boolean;
  /** Threshold created at timestamp */
  createdAt: Date;
  /** Threshold updated at timestamp */
  updatedAt: Date;
}

/**
 * Alert interface
 */
export interface Alert {
  /** Unique alert ID */
  id: string;
  /** Associated threshold ID */
  thresholdId: string;
  /** Queue name */
  queue: string;
  /** Metric that triggered the alert */
  metric: MetricType;
  /** Alert severity */
  severity: AlertSeverity;
  /** Alert status */
  status: AlertStatus;
  /** Alert message */
  message: string;
  /** Threshold breach details */
  breach: ThresholdBreach;
  /** Alert created at timestamp */
  createdAt: Date;
  /** Alert acknowledged at timestamp */
  acknowledgedAt?: Date;
  /** Alert resolved at timestamp */
  resolvedAt?: Date;
}

/**
 * Dashboard data interface
 */
export interface DashboardData {
  /** Overall metrics across all queues */
  overall: {
    /** Total jobs processed */
    totalProcessed: number;
    /** Average error rate */
    averageErrorRate: number;
    /** Average throughput */
    averageThroughput: number;
    /** Total active jobs */
    activeJobs: number;
    /** Total waiting jobs */
    waitingJobs: number;
  };
  /** Metrics for each queue */
  queues: JobMetrics[];
  /** Active alerts */
  activeAlerts: number;
  /** Recently completed jobs */
  recentlyCompleted: any[];
  /** Recently failed jobs */
  recentlyFailed: any[];
  /** Timestamp of data collection */
  timestamp: Date;
}

/**
 * Job monitoring service
 */
export class JobMonitoringService {
  private thresholds: Map<string, AlertThreshold> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private breachCounts: Map<string, number> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  private alertsInterval: NodeJS.Timeout | null = null;
  private storageKeyThresholds = 'sk:job_monitoring:thresholds';
  private storageKeyAlerts = 'sk:job_monitoring:alerts';
  private isInitialized = false;
  private readonly metricsCheckIntervalMs = 60 * 1000; // 1 minute
  private readonly alertsCheckIntervalMs = 30 * 1000; // 30 seconds
  
  /**
   * Create a new job monitoring service
   */
  constructor() {}
  
  /**
   * Start the monitoring service
   */
  async start(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Job monitoring already started');
      return;
    }
    
    try {
      // Load thresholds and alerts from storage
      await this.loadThresholds();
      await this.loadAlerts();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      // Start alerts checking
      this.startAlertsChecking();
      
      this.isInitialized = true;
      logger.info('Job monitoring started', { 
        thresholdCount: this.thresholds.size,
        alertCount: this.alerts.size
      });
    } catch (error) {
      logger.error('Failed to start job monitoring', { error });
      throw error;
    }
  }
  
  /**
   * Stop the monitoring service
   */
  stop(): void {
    try {
      // Stop metrics collection
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }
      
      // Stop alerts checking
      if (this.alertsInterval) {
        clearInterval(this.alertsInterval);
        this.alertsInterval = null;
      }
      
      this.isInitialized = false;
      logger.info('Job monitoring stopped');
    } catch (error) {
      logger.error('Failed to stop job monitoring', { error });
      throw error;
    }
  }
  
  /**
   * Get metrics for a specific queue
   * 
   * @param queue Queue name
   * @returns Queue metrics or null if queue not found
   */
  async getQueueMetrics(queue: string): Promise<JobMetrics | null> {
    try {
      const bullQueue = getAllQueues()[queue];
      if (!bullQueue) {
        return null;
      }
      
      const [
        completed,
        failed,
        delayed,
        active,
        waiting,
      ] = await Promise.all([
        bullQueue.getCompletedCount(),
        bullQueue.getFailedCount(),
        bullQueue.getDelayedCount(),
        bullQueue.getActiveCount(),
        bullQueue.getWaitingCount(),
      ]);
      
      // Get recently completed jobs for processing time calculation
      const completedJobs = await bullQueue.getJobs(
        ['completed'], 
        0,
        100 // Last 100 completed jobs
      );
      
      // Calculate average processing time
      const processingTimes = completedJobs
        .filter(job => job.finishedOn && job.processedOn)
        .map(job => job.finishedOn! - job.processedOn!);
      
      const averageProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;
      
      // Calculate throughput (jobs per minute)
      const nowMs = Date.now();
      const oneMinuteAgoMs = nowMs - 60 * 1000;
      
      const recentlyCompletedCount = completedJobs
        .filter(job => job.finishedOn && job.finishedOn > oneMinuteAgoMs)
        .length;
      
      const throughput = recentlyCompletedCount;
      
      // Calculate error rate
      const total = completed + failed;
      const errorRate = total > 0 ? (failed / total) * 100 : 0;
      
      return {
        queue,
        completed,
        failed,
        delayed,
        active,
        waiting,
        averageProcessingTime,
        throughput,
        errorRate,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Failed to get queue metrics', { queue, error });
      return null;
    }
  }
  
  /**
   * Get metrics for all queues
   * 
   * @returns Metrics for all queues
   */
  async getAllQueueMetrics(): Promise<JobMetrics[]> {
    const metrics: JobMetrics[] = [];
    const queues = getAllQueues();
    
    for (const queue of Object.keys(queues)) {
      const queueMetrics = await this.getQueueMetrics(queue);
      if (queueMetrics) {
        metrics.push(queueMetrics);
      }
    }
    
    return metrics;
  }
  
  /**
   * Set an alert threshold
   * 
   * @param queue Queue name (or 'all' for all queues)
   * @param metric Metric to monitor
   * @param threshold Threshold details
   * @returns Created or updated threshold
   */
  async setAlertThreshold(
    queue: string,
    metric: MetricType,
    threshold: Omit<AlertThreshold, 'id' | 'queue' | 'metric' | 'createdAt' | 'updatedAt'>
  ): Promise<AlertThreshold> {
    // Check if threshold already exists
    const existingThreshold = Array.from(this.thresholds.values()).find(
      t => t.queue === queue && t.metric === metric && t.operator === threshold.operator
    );
    
    if (existingThreshold) {
      // Update existing threshold
      const updatedThreshold: AlertThreshold = {
        ...existingThreshold,
        ...threshold,
        updatedAt: new Date()
      };
      
      this.thresholds.set(existingThreshold.id, updatedThreshold);
      await this.saveThresholds();
      
      logger.info('Updated alert threshold', { 
        thresholdId: existingThreshold.id, 
        queue, 
        metric 
      });
      
      return updatedThreshold;
    } else {
      // Create new threshold
      const now = new Date();
      const newThreshold: AlertThreshold = {
        id: uuidv4(),
        queue,
        metric,
        ...threshold,
        createdAt: now,
        updatedAt: now
      };
      
      this.thresholds.set(newThreshold.id, newThreshold);
      await this.saveThresholds();
      
      logger.info('Created alert threshold', { 
        thresholdId: newThreshold.id, 
        queue, 
        metric 
      });
      
      return newThreshold;
    }
  }
  
  /**
   * Get all alert thresholds
   * 
   * @returns All thresholds
   */
  getAlertThresholds(): AlertThreshold[] {
    return Array.from(this.thresholds.values());
  }
  
  /**
   * Delete an alert threshold
   * 
   * @param id Threshold ID
   * @returns true if deleted, false if not found
   */
  async deleteAlertThreshold(id: string): Promise<boolean> {
    if (!this.thresholds.has(id)) {
      return false;
    }
    
    this.thresholds.delete(id);
    await this.saveThresholds();
    
    logger.info('Deleted alert threshold', { thresholdId: id });
    
    return true;
  }
  
  /**
   * Get all alerts
   * 
   * @param statuses Optional filter by alert status
   * @returns Filtered alerts
   */
  getAlerts(statuses?: AlertStatus[]): Alert[] {
    const alerts = Array.from(this.alerts.values());
    
    if (statuses && statuses.length > 0) {
      return alerts.filter(alert => statuses.includes(alert.status));
    }
    
    return alerts;
  }
  
  /**
   * Acknowledge an alert
   * 
   * @param alertId Alert ID
   * @returns Updated alert or null if not found
   */
  async acknowledgeAlert(alertId: string): Promise<Alert | null> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return null;
    }
    
    // Update alert status
    const updatedAlert: Alert = {
      ...alert,
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date()
    };
    
    this.alerts.set(alertId, updatedAlert);
    await this.saveAlerts();
    
    logger.info('Acknowledged alert', { alertId });
    
    return updatedAlert;
  }
  
  /**
   * Get dashboard data
   * 
   * @returns Dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    // Get metrics for all queues
    const queueMetrics = await this.getAllQueueMetrics();
    
    // Calculate overall metrics
    const totalProcessed = queueMetrics.reduce(
      (sum, metrics) => sum + metrics.completed + metrics.failed, 
      0
    );
    
    const totalErrors = queueMetrics.reduce(
      (sum, metrics) => sum + metrics.failed, 
      0
    );
    
    const averageErrorRate = totalProcessed > 0 
      ? (totalErrors / totalProcessed) * 100 
      : 0;
    
    const averageThroughput = queueMetrics.reduce(
      (sum, metrics) => sum + metrics.throughput, 
      0
    );
    
    const activeJobs = queueMetrics.reduce(
      (sum, metrics) => sum + metrics.active, 
      0
    );
    
    const waitingJobs = queueMetrics.reduce(
      (sum, metrics) => sum + metrics.waiting, 
      0
    );
    
    // Get active alerts
    const activeAlerts = this.getAlerts([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]);
    
    // TODO: Get recently completed and failed jobs
    // This would require more complex querying from Bull
    // For now, we'll return empty arrays
    const recentlyCompleted: any[] = [];
    const recentlyFailed: any[] = [];
    
    return {
      overall: {
        totalProcessed,
        averageErrorRate,
        averageThroughput,
        activeJobs,
        waitingJobs
      },
      queues: queueMetrics,
      activeAlerts: activeAlerts.length,
      recentlyCompleted,
      recentlyFailed,
      timestamp: new Date()
    };
  }
  
  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(
      async () => {
        try {
          await this.collectAndStoreMetrics();
        } catch (error) {
          logger.error('Error collecting metrics', { error });
        }
      },
      this.metricsCheckIntervalMs
    );
  }
  
  /**
   * Start alerts checking
   */
  private startAlertsChecking(): void {
    this.alertsInterval = setInterval(
      async () => {
        try {
          await this.checkThresholds();
        } catch (error) {
          logger.error('Error checking thresholds', { error });
        }
      },
      this.alertsCheckIntervalMs
    );
  }
  
  /**
   * Collect and store metrics for all queues
   */
  private async collectAndStoreMetrics(): Promise<void> {
    logger.debug('Collecting job metrics');
    
    // Get metrics for all queues
    const metrics = await this.getAllQueueMetrics();
    
    // Store metrics in Redis for time-series data
    // We use a Redis sorted set with timestamp as score
    const now = Date.now();
    
    for (const queueMetrics of metrics) {
      const key = `sk:job_metrics:${queueMetrics.queue}`;
      const value = JSON.stringify(queueMetrics);
      
      try {
        // Add to sorted set with timestamp as score
        await redisClient.client.zadd(key, now, value);
        
        // Keep only the last 1440 entries (1 day at 1 entry per minute)
        await redisClient.client.zremrangebyrank(key, 0, -1441);
      } catch (error) {
        logger.error('Error storing metrics', { 
          queue: queueMetrics.queue, 
          error 
        });
      }
    }
    
    logger.debug('Job metrics collected', { count: metrics.length });
  }
  
  /**
   * Check thresholds against current metrics
   */
  private async checkThresholds(): Promise<void> {
    if (this.thresholds.size === 0) {
      return;
    }
    
    logger.debug('Checking alert thresholds');
    
    // Get metrics for all queues
    const queueMetrics = await this.getAllQueueMetrics();
    
    // Check each threshold
    for (const threshold of this.thresholds.values()) {
      if (!threshold.enabled) {
        continue;
      }
      
      try {
        // Filter metrics based on queue
        const metricsToCheck = threshold.queue === 'all'
          ? queueMetrics
          : queueMetrics.filter(m => m.queue === threshold.queue);
        
        if (metricsToCheck.length === 0) {
          continue;
        }
        
        // Check each queue's metrics against the threshold
        for (const metrics of metricsToCheck) {
          const value = this.getMetricValue(metrics, threshold.metric);
          const thresholdKey = `${threshold.id}:${metrics.queue}`;
          
          const isBreached = this.evaluateThreshold(
            value, 
            threshold.value, 
            threshold.operator
          );
          
          if (isBreached) {
            // Increment breach count
            const currentCount = this.breachCounts.get(thresholdKey) || 0;
            const newCount = currentCount + 1;
            this.breachCounts.set(thresholdKey, newCount);
            
            // Check if breach count exceeds minimum consecutive breaches
            if (newCount >= threshold.minConsecutiveBreaches) {
              // Create or update alert
              await this.createOrUpdateAlert(
                threshold,
                metrics.queue,
                value
              );
            }
          } else {
            // Reset breach count
            this.breachCounts.delete(thresholdKey);
            
            // Resolve any active alerts for this threshold and queue
            await this.resolveAlert(threshold.id, metrics.queue);
          }
        }
      } catch (error) {
        logger.error('Error checking threshold', { 
          thresholdId: threshold.id, 
          error 
        });
      }
    }
  }
  
  /**
   * Get a metric value from queue metrics
   * 
   * @param metrics Queue metrics
   * @param metricType Metric type
   * @returns Metric value
   */
  private getMetricValue(metrics: JobMetrics, metricType: MetricType): number {
    switch (metricType) {
      case MetricType.WAITING_JOBS:
        return metrics.waiting;
      case MetricType.ACTIVE_JOBS:
        return metrics.active;
      case MetricType.COMPLETED_JOBS:
        return metrics.completed;
      case MetricType.FAILED_JOBS:
        return metrics.failed;
      case MetricType.DELAYED_JOBS:
        return metrics.delayed;
      case MetricType.TOTAL_JOBS:
        return metrics.waiting + metrics.active + metrics.completed + metrics.failed + metrics.delayed;
      case MetricType.PROCESSING_TIME:
        return metrics.averageProcessingTime;
      case MetricType.THROUGHPUT:
        return metrics.throughput;
      case MetricType.ERROR_RATE:
        return metrics.errorRate;
      case MetricType.SUCCESS_RATE:
        return 100 - metrics.errorRate;
      default:
        return 0;
    }
  }
  
  /**
   * Evaluate a threshold
   * 
   * @param value Actual value
   * @param threshold Threshold value
   * @param operator Comparison operator
   * @returns true if threshold is breached, false otherwise
   */
  private evaluateThreshold(
    value: number, 
    threshold: number, 
    operator: ThresholdOperator
  ): boolean {
    switch (operator) {
      case ThresholdOperator.LESS_THAN:
        return value < threshold;
      case ThresholdOperator.LESS_THAN_OR_EQUAL:
        return value <= threshold;
      case ThresholdOperator.EQUAL:
        return value === threshold;
      case ThresholdOperator.NOT_EQUAL:
        return value !== threshold;
      case ThresholdOperator.GREATER_THAN_OR_EQUAL:
        return value >= threshold;
      case ThresholdOperator.GREATER_THAN:
        return value > threshold;
      default:
        return false;
    }
  }
  
  /**
   * Create or update an alert
   * 
   * @param threshold Threshold that was breached
   * @param queue Queue name
   * @param value Actual value that caused the breach
   * @returns Created or updated alert
   */
  private async createOrUpdateAlert(
    threshold: AlertThreshold,
    queue: string,
    value: number
  ): Promise<Alert> {
    // Check for existing active alert
    const existingAlert = Array.from(this.alerts.values()).find(
      alert => 
        alert.thresholdId === threshold.id && 
        alert.queue === queue && 
        (alert.status === AlertStatus.ACTIVE || alert.status === AlertStatus.ACKNOWLEDGED)
    );
    
    if (existingAlert) {
      // Update existing alert
      const updatedAlert: Alert = {
        ...existingAlert,
        breach: {
          ...existingAlert.breach,
          value,
          lastSeen: new Date(),
          consecutiveCount: existingAlert.breach.consecutiveCount + 1
        }
      };
      
      this.alerts.set(existingAlert.id, updatedAlert);
      await this.saveAlerts();
      
      return updatedAlert;
    } else {
      // Create new alert
      const now = new Date();
      const operatorText = this.getOperatorText(threshold.operator);
      const metricText = this.getMetricText(threshold.metric);
      
      const message = `${metricText} is ${operatorText} threshold of ${threshold.value} (current value: ${value.toFixed(2)})`;
      
      const newAlert: Alert = {
        id: uuidv4(),
        thresholdId: threshold.id,
        queue,
        metric: threshold.metric,
        severity: threshold.severity,
        status: AlertStatus.ACTIVE,
        message,
        breach: {
          threshold: threshold.value,
          value,
          operator: threshold.operator,
          firstSeen: now,
          lastSeen: now,
          consecutiveCount: 1
        },
        createdAt: now
      };
      
      this.alerts.set(newAlert.id, newAlert);
      await this.saveAlerts();
      
      // Emit event for alert creation
      eventBus.publish('alert.created', {
        alertId: newAlert.id,
        queue,
        metric: threshold.metric,
        severity: threshold.severity,
        message,
        value,
        threshold: threshold.value
      });
      
      logger.warn('Alert created', { 
        alertId: newAlert.id, 
        queue, 
        metric: threshold.metric, 
        severity: threshold.severity, 
        message 
      });
      
      return newAlert;
    }
  }
  
  /**
   * Resolve an alert
   * 
   * @param thresholdId Threshold ID
   * @param queue Queue name
   * @returns true if resolved, false if not found
   */
  private async resolveAlert(thresholdId: string, queue: string): Promise<boolean> {
    const alertToResolve = Array.from(this.alerts.values()).find(
      alert => 
        alert.thresholdId === thresholdId && 
        alert.queue === queue && 
        (alert.status === AlertStatus.ACTIVE || alert.status === AlertStatus.ACKNOWLEDGED)
    );
    
    if (!alertToResolve) {
      return false;
    }
    
    // Update alert status
    const resolvedAlert: Alert = {
      ...alertToResolve,
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date()
    };
    
    this.alerts.set(alertToResolve.id, resolvedAlert);
    await this.saveAlerts();
    
    // Emit event for alert resolution
    eventBus.publish('alert.resolved', {
      alertId: resolvedAlert.id,
      queue,
      metric: resolvedAlert.metric,
      severity: resolvedAlert.severity
    });
    
    logger.info('Alert resolved', { 
      alertId: resolvedAlert.id, 
      queue 
    });
    
    return true;
  }
  
  /**
   * Get human-readable operator text
   * 
   * @param operator Threshold operator
   * @returns Human-readable text
   */
  private getOperatorText(operator: ThresholdOperator): string {
    switch (operator) {
      case ThresholdOperator.LESS_THAN:
        return 'less than';
      case ThresholdOperator.LESS_THAN_OR_EQUAL:
        return 'less than or equal to';
      case ThresholdOperator.EQUAL:
        return 'equal to';
      case ThresholdOperator.NOT_EQUAL:
        return 'not equal to';
      case ThresholdOperator.GREATER_THAN_OR_EQUAL:
        return 'greater than or equal to';
      case ThresholdOperator.GREATER_THAN:
        return 'greater than';
      default:
        return operator;
    }
  }
  
  /**
   * Get human-readable metric text
   * 
   * @param metric Metric type
   * @returns Human-readable text
   */
  private getMetricText(metric: MetricType): string {
    switch (metric) {
      case MetricType.WAITING_JOBS:
        return 'Waiting jobs';
      case MetricType.ACTIVE_JOBS:
        return 'Active jobs';
      case MetricType.COMPLETED_JOBS:
        return 'Completed jobs';
      case MetricType.FAILED_JOBS:
        return 'Failed jobs';
      case MetricType.DELAYED_JOBS:
        return 'Delayed jobs';
      case MetricType.TOTAL_JOBS:
        return 'Total jobs';
      case MetricType.PROCESSING_TIME:
        return 'Processing time';
      case MetricType.WAIT_TIME:
        return 'Wait time';
      case MetricType.THROUGHPUT:
        return 'Throughput';
      case MetricType.ERROR_RATE:
        return 'Error rate';
      case MetricType.RETRY_RATE:
        return 'Retry rate';
      case MetricType.SUCCESS_RATE:
        return 'Success rate';
      case MetricType.CPU_USAGE:
        return 'CPU usage';
      case MetricType.MEMORY_USAGE:
        return 'Memory usage';
      case MetricType.JOB_MEMORY:
        return 'Job memory usage';
      default:
        return metric;
    }
  }
  
  /**
   * Load thresholds from storage
   */
  private async loadThresholds(): Promise<void> {
    try {
      // Get thresholds from Redis
      const data = await redisClient.get(this.storageKeyThresholds);
      
      if (data) {
        const thresholds = JSON.parse(data) as AlertThreshold[];
        
        // Add to in-memory store
        thresholds.forEach(threshold => {
          // Convert string dates to Date objects
          threshold.createdAt = new Date(threshold.createdAt);
          threshold.updatedAt = new Date(threshold.updatedAt);
          
          this.thresholds.set(threshold.id, threshold);
        });
        
        logger.info('Loaded thresholds from storage', { count: thresholds.length });
      } else {
        logger.info('No thresholds found in storage');
      }
    } catch (error) {
      logger.error('Failed to load thresholds', { error });
      // Start with empty thresholds rather than failing
      this.thresholds.clear();
    }
  }
  
  /**
   * Save thresholds to storage
   */
  private async saveThresholds(): Promise<void> {
    try {
      const thresholds = Array.from(this.thresholds.values());
      await redisClient.set(this.storageKeyThresholds, JSON.stringify(thresholds));
      logger.debug('Saved thresholds to storage', { count: thresholds.length });
    } catch (error) {
      logger.error('Failed to save thresholds', { error });
      throw error;
    }
  }
  
  /**
   * Load alerts from storage
   */
  private async loadAlerts(): Promise<void> {
    try {
      // Get alerts from Redis
      const data = await redisClient.get(this.storageKeyAlerts);
      
      if (data) {
        const alerts = JSON.parse(data) as Alert[];
        
        // Add to in-memory store
        alerts.forEach(alert => {
          // Convert string dates to Date objects
          alert.createdAt = new Date(alert.createdAt);
          if (alert.acknowledgedAt) {
            alert.acknowledgedAt = new Date(alert.acknowledgedAt);
          }
          if (alert.resolvedAt) {
            alert.resolvedAt = new Date(alert.resolvedAt);
          }
          alert.breach.firstSeen = new Date(alert.breach.firstSeen);
          alert.breach.lastSeen = new Date(alert.breach.lastSeen);
          
          this.alerts.set(alert.id, alert);
        });
        
        logger.info('Loaded alerts from storage', { count: alerts.length });
      } else {
        logger.info('No alerts found in storage');
      }
    } catch (error) {
      logger.error('Failed to load alerts', { error });
      // Start with empty alerts rather than failing
      this.alerts.clear();
    }
  }
  
  /**
   * Save alerts to storage
   */
  private async saveAlerts(): Promise<void> {
    try {
      const alerts = Array.from(this.alerts.values());
      await redisClient.set(this.storageKeyAlerts, JSON.stringify(alerts));
      logger.debug('Saved alerts to storage', { count: alerts.length });
    } catch (error) {
      logger.error('Failed to save alerts', { error });
      throw error;
    }
  }
}
