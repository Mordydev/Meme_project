/**
 * Jobs configuration
 */

/**
 * Job processing configuration
 */
export const jobsConfig = {
  // Queue concurrency settings
  concurrency: {
    points: parseInt(process.env.POINTS_QUEUE_CONCURRENCY || '5', 10),
    content: parseInt(process.env.CONTENT_QUEUE_CONCURRENCY || '10', 10),
    media: parseInt(process.env.MEDIA_QUEUE_CONCURRENCY || '3', 10),
    notifications: parseInt(process.env.NOTIFICATIONS_QUEUE_CONCURRENCY || '10', 10)
  },
  
  // Queue prefix
  prefix: process.env.QUEUE_PREFIX || 'sk:bull:',
  
  // Default job options
  defaultOptions: {
    attempts: parseInt(process.env.JOB_DEFAULT_ATTEMPTS || '3', 10),
    backoff: {
      type: process.env.JOB_BACKOFF_TYPE || 'exponential',
      delay: parseInt(process.env.JOB_BACKOFF_DELAY || '5000', 10)
    },
    removeOnComplete: process.env.JOB_REMOVE_ON_COMPLETE === 'false' ? false : true,
    removeOnFail: process.env.JOB_REMOVE_ON_FAIL === 'true' ? true : false
  },
  
  // Retry settings
  retry: {
    maxAttempts: parseInt(process.env.JOB_MAX_RETRY_ATTEMPTS || '5', 10),
    maxDelayMs: parseInt(process.env.JOB_MAX_RETRY_DELAY || '60000', 10) // 1 minute
  },
  
  // Scheduler settings
  scheduler: {
    checkIntervalMs: parseInt(process.env.SCHEDULER_CHECK_INTERVAL || '60000', 10), // 1 minute
    defaultTimezone: process.env.SCHEDULER_DEFAULT_TIMEZONE || 'UTC'
  },
  
  // Monitoring settings
  monitoring: {
    metricsIntervalMs: parseInt(process.env.METRICS_COLLECTION_INTERVAL || '60000', 10), // 1 minute
    cleanupIntervalMs: parseInt(process.env.CLEANUP_INTERVAL || '3600000', 10), // 1 hour
    alertEmailRecipients: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(','),
    historyRetentionDays: parseInt(process.env.JOB_HISTORY_RETENTION_DAYS || '30', 10) // 30 days
  },
  
  // Worker settings
  worker: {
    // Set worker ID to null to generate a random ID
    id: process.env.WORKER_ID || null,
    queues: (process.env.WORKER_QUEUES || '*').split(','),
    heartbeatIntervalMs: parseInt(process.env.WORKER_HEARTBEAT_INTERVAL || '10000', 10), // 10 seconds
    offlineThresholdMs: parseInt(process.env.WORKER_OFFLINE_THRESHOLD || '30000', 10) // 30 seconds
  },
  
  // Resource limits
  resources: {
    maxMemoryPercentage: parseInt(process.env.MAX_MEMORY_PERCENTAGE || '80', 10), // 80% of available memory
    maxCpuPercentage: parseInt(process.env.MAX_CPU_PERCENTAGE || '90', 10), // 90% of available CPU
    concurrencyPerCore: parseFloat(process.env.CONCURRENCY_PER_CORE || '2', 10) // 2 jobs per CPU core
  }
};

export default jobsConfig;
