/**
 * Job Monitoring Types
 * 
 * Type definitions for job monitoring and alerting.
 */

/**
 * Metric types tracked by the monitoring system
 */
export enum MetricType {
  // Queue size metrics
  WAITING_JOBS = 'waitingJobs',
  ACTIVE_JOBS = 'activeJobs',
  COMPLETED_JOBS = 'completedJobs',
  FAILED_JOBS = 'failedJobs',
  DELAYED_JOBS = 'delayedJobs',
  TOTAL_JOBS = 'totalJobs',
  
  // Performance metrics
  PROCESSING_TIME = 'processingTime',
  WAIT_TIME = 'waitTime',
  THROUGHPUT = 'throughput',
  
  // Reliability metrics
  ERROR_RATE = 'errorRate',
  RETRY_RATE = 'retryRate',
  SUCCESS_RATE = 'successRate',
  
  // System metrics
  CPU_USAGE = 'cpuUsage',
  MEMORY_USAGE = 'memoryUsage',
  JOB_MEMORY = 'jobMemory',
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Alert status
 */
export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

/**
 * Comparison operators for thresholds
 */
export enum ThresholdOperator {
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  EQUAL = 'eq',
  NOT_EQUAL = 'neq',
  GREATER_THAN_OR_EQUAL = 'gte',
  GREATER_THAN = 'gt',
}

/**
 * Threshold breach information
 */
export interface ThresholdBreach {
  /** Threshold that was breached */
  threshold: number;
  /** Actual value that caused the breach */
  value: number;
  /** Operator used for comparison */
  operator: ThresholdOperator;
  /** When the breach first occurred */
  firstSeen: Date;
  /** When the breach was last seen */
  lastSeen: Date;
  /** Number of consecutive checks the breach has been present */
  consecutiveCount: number;
}

/**
 * Time interval options for metrics
 */
export enum TimeInterval {
  MINUTE = '1m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  THIRTY_MINUTES = '30m',
  HOUR = '1h',
  THREE_HOURS = '3h',
  SIX_HOURS = '6h',
  TWELVE_HOURS = '12h',
  DAY = '1d',
  WEEK = '1w',
}

/**
 * Aggregation methods for metrics
 */
export enum AggregationMethod {
  AVERAGE = 'avg',
  SUM = 'sum',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  MEDIAN = 'median',
  PERCENTILE_90 = 'p90',
  PERCENTILE_95 = 'p95',
  PERCENTILE_99 = 'p99',
}
