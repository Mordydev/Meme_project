/**
 * Job Monitoring Dashboard
 * 
 * Provides dashboard data for job monitoring
 */
import { JobMetrics, metricsService } from './metrics';
import { Alert, alertService } from './alerts';
import { logger } from '../../lib/logger';
import { QueueName } from '../queues';

/**
 * Queue health status
 */
export enum QueueHealth {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

/**
 * Health status for a queue
 */
export interface QueueHealthStatus {
  queue: string;
  status: QueueHealth;
  metrics: Partial<JobMetrics>;
  activeAlerts: Alert[];
}

/**
 * System overview for all queues
 */
export interface SystemOverview {
  totalQueues: number;
  healthSummary: {
    healthy: number;
    warning: number;
    critical: number;
    unknown: number;
  };
  totalActiveJobs: number;
  totalWaitingJobs: number;
  totalProcessedJobs: number;
  errorRate: number;
  alertsCount: number;
}

/**
 * Performance trends over time
 */
export interface PerformanceTrends {
  throughputTrend: Array<{ timestamp: Date; value: number }>;
  errorRateTrend: Array<{ timestamp: Date; value: number }>;
  processingTimeTrend: Array<{ timestamp: Date; value: number }>;
}

/**
 * Dashboard data for jobs monitoring
 */
export interface DashboardData {
  overview: SystemOverview;
  queueHealth: QueueHealthStatus[];
  performanceTrends: PerformanceTrends;
  recentAlerts: Alert[];
  timestamp: Date;
}

/**
 * Service for providing monitoring dashboard data
 */
export class DashboardService {
  /**
   * Get dashboard data for all queues
   * 
   * @returns Dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      // Get current metrics for all queues
      const metricsMap = await metricsService.getCurrentMetrics();
      
      // Get active alerts
      const alerts = await alertService.getAlerts(false, 10);
      
      // Calculate queue health status
      const queueHealth = await this.calculateQueueHealth(metricsMap, alerts);
      
      // Calculate system overview
      const overview = this.calculateSystemOverview(queueHealth);
      
      // Get performance trends
      const performanceTrends = await this.getPerformanceTrends();
      
      return {
        overview,
        queueHealth,
        performanceTrends,
        recentAlerts: alerts,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error getting dashboard data', { error });
      
      // Return empty dashboard on error
      return {
        overview: {
          totalQueues: 0,
          healthSummary: {
            healthy: 0,
            warning: 0,
            critical: 0,
            unknown: 0
          },
          totalActiveJobs: 0,
          totalWaitingJobs: 0,
          totalProcessedJobs: 0,
          errorRate: 0,
          alertsCount: 0
        },
        queueHealth: [],
        performanceTrends: {
          throughputTrend: [],
          errorRateTrend: [],
          processingTimeTrend: []
        },
        recentAlerts: [],
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Calculate health status for each queue
   * 
   * @param metricsMap Map of queue name to metrics
   * @param alerts List of active alerts
   * @returns Queue health status
   */
  private async calculateQueueHealth(
    metricsMap: Map<string, JobMetrics>,
    alerts: Alert[]
  ): Promise<QueueHealthStatus[]> {
    const queueHealth: QueueHealthStatus[] = [];
    
    // Process each queue
    for (const queueName of Object.values(QueueName)) {
      const metrics = metricsMap.get(queueName);
      
      // If no metrics, mark as unknown
      if (!metrics) {
        queueHealth.push({
          queue: queueName,
          status: QueueHealth.UNKNOWN,
          metrics: { queue: queueName },
          activeAlerts: []
        });
        continue;
      }
      
      // Get alerts for this queue
      const queueAlerts = alerts.filter(alert => alert.queueName === queueName);
      
      // Determine health status
      let status = QueueHealth.HEALTHY;
      
      // Check for critical alerts
      if (queueAlerts.some(alert => alert.severity === 'critical')) {
        status = QueueHealth.CRITICAL;
      }
      // Check for warning alerts
      else if (queueAlerts.some(alert => alert.severity === 'warning')) {
        status = QueueHealth.WARNING;
      }
      // Check error rate
      else if (metrics.errorRate > 0.05) { // 5% error rate threshold
        status = QueueHealth.WARNING;
      }
      // Check backlog
      else if (metrics.waiting > 50 && metrics.active > 0) { // Significant backlog
        status = QueueHealth.WARNING;
      }
      
      queueHealth.push({
        queue: queueName,
        status,
        metrics,
        activeAlerts: queueAlerts
      });
    }
    
    return queueHealth;
  }
  
  /**
   * Calculate system overview from queue health status
   * 
   * @param queueHealth Queue health status
   * @returns System overview
   */
  private calculateSystemOverview(queueHealth: QueueHealthStatus[]): SystemOverview {
    // Count queues by health status
    const healthSummary = {
      healthy: 0,
      warning: 0,
      critical: 0,
      unknown: 0
    };
    
    let totalActiveJobs = 0;
    let totalWaitingJobs = 0;
    let totalProcessedJobs = 0;
    let totalErrors = 0;
    let totalAlerts = 0;
    
    // Calculate totals
    for (const health of queueHealth) {
      // Count by status
      healthSummary[health.status]++;
      
      // Sum metrics
      totalActiveJobs += health.metrics.active || 0;
      totalWaitingJobs += health.metrics.waiting || 0;
      totalProcessedJobs += (health.metrics.completed || 0) + (health.metrics.failed || 0);
      totalErrors += health.metrics.failed || 0;
      totalAlerts += health.activeAlerts.length;
    }
    
    // Calculate overall error rate
    const errorRate = totalProcessedJobs > 0 ? totalErrors / totalProcessedJobs : 0;
    
    return {
      totalQueues: queueHealth.length,
      healthSummary,
      totalActiveJobs,
      totalWaitingJobs,
      totalProcessedJobs,
      errorRate,
      alertsCount: totalAlerts
    };
  }
  
  /**
   * Get performance trends for all queues
   * 
   * @returns Performance trends
   */
  private async getPerformanceTrends(): Promise<PerformanceTrends> {
    try {
      // Initialize trend arrays
      const throughputTrend: Array<{ timestamp: Date; value: number }> = [];
      const errorRateTrend: Array<{ timestamp: Date; value: number }> = [];
      const processingTimeTrend: Array<{ timestamp: Date; value: number }> = [];
      
      // Get historical metrics for all queues
      for (const queueName of Object.values(QueueName)) {
        const history = await metricsService.getHistoricalMetrics(queueName, 24);
        
        // No data for this queue
        if (history.metrics.length === 0) {
          continue;
        }
        
        // Aggregate trends across all queues
        history.metrics.forEach((metric, index) => {
          // Only add timestamps from first queue
          if (throughputTrend.length <= index) {
            throughputTrend.push({ timestamp: metric.timestamp, value: metric.throughput });
            errorRateTrend.push({ timestamp: metric.timestamp, value: metric.errorRate });
            processingTimeTrend.push({ timestamp: metric.timestamp, value: metric.averageProcessingTime });
          } else {
            // Add values from other queues
            throughputTrend[index].value += metric.throughput;
            errorRateTrend[index].value = (errorRateTrend[index].value + metric.errorRate) / 2; // Average error rate
            processingTimeTrend[index].value = Math.max(processingTimeTrend[index].value, metric.averageProcessingTime);
          }
        });
      }
      
      return {
        throughputTrend,
        errorRateTrend,
        processingTimeTrend
      };
    } catch (error) {
      logger.error('Error getting performance trends', { error });
      
      // Return empty trends on error
      return {
        throughputTrend: [],
        errorRateTrend: [],
        processingTimeTrend: []
      };
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
