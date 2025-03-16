/**
 * Jobs module
 * 
 * Centralizes and exports all scheduled jobs
 */
import { startRedemptionProcessingJob } from './redemption-processor';

/**
 * Start all scheduled jobs
 */
export function startScheduledJobs(): void {
  // Start the redemption processing job
  startRedemptionProcessingJob();
}

// Export all job-related functions and types
export * from './redemption-processor';
