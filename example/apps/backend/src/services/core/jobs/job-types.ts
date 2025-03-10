/**
 * Types of background jobs that can be executed
 */
export enum JobType {
  // Content processing jobs
  PROCESS_CONTENT = 'process_content',
  MODERATE_CONTENT = 'moderate_content',
  OPTIMIZE_MEDIA = 'optimize_media',
  GENERATE_PREVIEWS = 'generate_previews',
  
  // Battle-related jobs
  UPDATE_BATTLE_STATE = 'update_battle_state',
  CALCULATE_BATTLE_RESULTS = 'calculate_battle_results',
  PROCESS_BATTLE_REWARDS = 'process_battle_rewards',
  
  // User-related jobs
  UPDATE_USER_METRICS = 'update_user_metrics',
  PROCESS_ACHIEVEMENTS = 'process_achievements',
  SEND_NOTIFICATION = 'send_notification',
  
  // Blockchain-related jobs
  VERIFY_TOKEN_HOLDINGS = 'verify_token_holdings',
  PROCESS_TRANSACTION = 'process_transaction',
  UPDATE_TOKEN_METRICS = 'update_token_metrics',
  
  // System jobs
  GENERATE_SITEMAP = 'generate_sitemap',
  RUN_MAINTENANCE = 'run_maintenance',
  GENERATE_REPORTS = 'generate_reports',
  CLEANUP_EXPIRED_DATA = 'cleanup_expired_data'
}

/**
 * Job priority levels
 */
export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
  MAINTENANCE = 5
}

/**
 * Job option interface
 */
export interface JobOptions {
  /**
   * Job priority level
   */
  priority?: JobPriority | string;
  
  /**
   * Delay before processing (ms)
   */
  delay?: number;
  
  /**
   * Maximum retry attempts
   */
  attempts?: number;
  
  /**
   * Backoff strategy
   */
  backoff?: {
    /**
     * Backoff type
     */
    type: 'fixed' | 'exponential';
    
    /**
     * Delay between retries (ms)
     */
    delay: number;
  };
  
  /**
   * Job ID for idempotency
   */
  jobId?: string;
  
  /**
   * Parent job ID for dependencies
   */
  parentJobId?: string;
  
  /**
   * TTL for job in completed state (seconds)
   */
  ttl?: number;
}
