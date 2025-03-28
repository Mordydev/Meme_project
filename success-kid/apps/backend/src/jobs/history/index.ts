/**
 * Job History Module
 * 
 * Provides history tracking and analytics for jobs.
 */
import { JobHistoryService } from './service';
import { logger } from '../../lib/logger';

// Singleton service instance
let historyService: JobHistoryService | null = null;

/**
 * Get the job history service
 * @returns Job history service
 */
export function getJobHistoryService(): JobHistoryService {
  if (!historyService) {
    historyService = new JobHistoryService();
  }
  return historyService;
}

/**
 * Initialize the job history system
 */
export async function initializeJobHistory(): Promise<void> {
  try {
    const history = getJobHistoryService();
    await history.initialize();
    logger.info('Job history system initialized');
  } catch (error) {
    logger.error('Failed to initialize job history', { error });
    throw error;
  }
}

/**
 * Shutdown the job history system
 */
export async function shutdownJobHistory(): Promise<void> {
  try {
    if (historyService) {
      await historyService.shutdown();
      logger.info('Job history system shut down');
    }
  } catch (error) {
    logger.error('Failed to shut down job history', { error });
  }
}

// Export operations
export const recordJobCompletion = (queue: string, jobId: string, name: string, data: any, 
  result: any, options: any, processingTime: number) => 
  getJobHistoryService().recordJobCompletion(queue, jobId, name, data, result, options, processingTime);

export const recordJobFailure = (queue: string, jobId: string, name: string, data: any, 
  error: Error, options: any, processingTime: number) => 
  getJobHistoryService().recordJobFailure(queue, jobId, name, data, error, options, processingTime);

export const getJobHistory = (query: JobHistoryQuery) => 
  getJobHistoryService().getJobHistory(query);

export const generateJobAnalytics = (options: AnalyticsOptions) => 
  getJobHistoryService().generateJobAnalytics(options);

export const purgeOldHistory = (maxAge: number) => 
  getJobHistoryService().purgeOldRecords(maxAge);

// Export types
export {
  JobHistoryEntry,
  JobHistoryQuery,
  JobHistoryPage,
  AnalyticsOptions,
  JobAnalytics,
  TimeSeriesDataPoint,
  AggregationType,
  TimeRange
} from './types';
