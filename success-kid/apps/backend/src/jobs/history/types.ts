/**
 * Job History Types
 * 
 * Types for job history and analytics.
 */

/**
 * Job history entry
 */
export interface JobHistoryEntry {
  /** Unique identifier */
  id: string;
  /** Queue name */
  queue: string;
  /** Job ID */
  jobId: string;
  /** Job name */
  name: string;
  /** Job data */
  data: any;
  /** Job options */
  options: any;
  /** Job result (if completed) */
  result?: any;
  /** Error information (if failed) */
  error?: {
    /** Error message */
    message: string;
    /** Error stack trace */
    stack?: string;
    /** Error name */
    name?: string;
    /** Additional error details */
    details?: any;
  };
  /** When the job started processing */
  startedAt: Date;
  /** When the job finished processing */
  finishedAt?: Date;
  /** Processing time in milliseconds */
  processingTime?: number;
  /** Number of attempts made */
  attempts: number;
  /** Job status */
  status: 'completed' | 'failed' | 'cancelled';
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Job history query parameters
 */
export interface JobHistoryQuery {
  /** Filter by queues */
  queues?: string[];
  /** Filter by job names */
  names?: string[];
  /** Filter by status */
  status?: ('completed' | 'failed' | 'cancelled')[];
  /** Filter by time range start */
  startTime?: Date;
  /** Filter by time range end */
  endTime?: Date;
  /** Filter by minimum processing time */
  minProcessingTime?: number;
  /** Filter by maximum processing time */
  maxProcessingTime?: number;
  /** Pagination page number */
  page?: number;
  /** Pagination page size */
  pageSize?: number;
  /** Sort field */
  sortBy?: 'startedAt' | 'finishedAt' | 'processingTime' | 'createdAt';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Paginated job history results
 */
export interface JobHistoryPage {
  /** Job history entries */
  entries: JobHistoryEntry[];
  /** Total number of entries matching query */
  totalCount: number;
  /** Current page number */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Time aggregation types
 */
export enum AggregationType {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

/**
 * Time range for analytics
 */
export interface TimeRange {
  /** Start time */
  startTime: Date;
  /** End time */
  endTime: Date;
}

/**
 * Analytics options
 */
export interface AnalyticsOptions {
  /** Time range */
  timeRange: TimeRange;
  /** Queues to include (empty for all) */
  queues?: string[];
  /** Job names to include (empty for all) */
  names?: string[];
  /** Time aggregation type */
  aggregationType: AggregationType;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  /** Timestamp */
  timestamp: Date;
  /** Number of completed jobs */
  completed: number;
  /** Number of failed jobs */
  failed: number;
  /** Average processing time (ms) */
  averageProcessingTime: number;
  /** Throughput (jobs per aggregation period) */
  throughput: number;
  /** Error rate (percentage) */
  errorRate: number;
}

/**
 * Job analytics result
 */
export interface JobAnalytics {
  /** Time range */
  timeRange: TimeRange;
  /** Metrics for each time period */
  timeSeries: TimeSeriesDataPoint[];
  /** Summary metrics */
  summary: {
    /** Total number of completed jobs */
    totalCompleted: number;
    /** Total number of failed jobs */
    totalFailed: number;
    /** Overall average processing time */
    overallAverageProcessingTime: number;
    /** Overall throughput (jobs per hour) */
    overallThroughput: number;
    /** Overall error rate */
    overallErrorRate: number;
    /** Peak throughput period */
    peakThroughput: {
      /** Time period */
      period: Date;
      /** Throughput value */
      value: number;
    };
    /** Slowest processing time period */
    slowestProcessing: {
      /** Time period */
      period: Date;
      /** Processing time value */
      value: number;
    };
  };
  /** Aggregation type used */
  aggregationType: AggregationType;
}
