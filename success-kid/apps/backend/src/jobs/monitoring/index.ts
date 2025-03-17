/**
 * Job Monitoring System
 * 
 * Provides monitoring and alerting for background jobs.
 */
import { logger } from '../../lib/logger';
import { JobMonitoringService } from './service';

// Singleton service instance
let monitoringService: JobMonitoringService | null = null;

/**
 * Get the job monitoring service
 * @returns Job monitoring service
 */
export function getJobMonitoringService(): JobMonitoringService {
  if (!monitoringService) {
    monitoringService = new JobMonitoringService();
  }
  return monitoringService;
}

/**
 * Start the job monitoring system
 */
export function startJobMonitoring(): void {
  try {
    const monitoring = getJobMonitoringService();
    monitoring.start();
    logger.info('Job monitoring system started');
  } catch (error) {
    logger.error('Failed to start job monitoring', { error });
    throw error;
  }
}

/**
 * Stop the job monitoring system
 */
export function stopJobMonitoring(): void {
  try {
    if (monitoringService) {
      monitoringService.stop();
      logger.info('Job monitoring system stopped');
    }
  } catch (error) {
    logger.error('Failed to stop job monitoring', { error });
  }
}

// Export monitoring operations
export const getQueueMetrics = (queue: string) => 
  getJobMonitoringService().getQueueMetrics(queue);

export const getAllQueueMetrics = () => 
  getJobMonitoringService().getAllQueueMetrics();

export const setAlertThreshold = (queue: string, metric: string, threshold: number) => 
  getJobMonitoringService().setAlertThreshold(queue, metric, threshold);

export const getAlerts = () => 
  getJobMonitoringService().getAlerts();

export const acknowledgeAlert = (alertId: string) => 
  getJobMonitoringService().acknowledgeAlert(alertId);

export const getDashboardData = () => 
  getJobMonitoringService().getDashboardData();

// Export types
export { JobMetrics, AlertThreshold, Alert, DashboardData } from './service';
export { MetricType, AlertSeverity, AlertStatus } from './types';
