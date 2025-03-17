/**
 * Worker Registry
 * 
 * Manages all job processors for the application.
 */
import { Job } from 'bull';
import { pointsProcessors } from './points';
import { mediaProcessors } from './media';
import { redemptionProcessors } from './redemption';

/**
 * Job processor interface
 */
export interface JobProcessor {
  /** Job processing handler function */
  handler: (job: Job) => Promise<any>;
  /** Number of concurrent jobs this processor can handle */
  concurrency?: number;
}

/**
 * Queue processor registry structure
 * 
 * Maps queue names to job types to processor functions
 * { 
 *   queueName: { 
 *     jobType: { handler: fn, concurrency: n } 
 *   } 
 * }
 */
export type ProcessorRegistry = Record<
  string, 
  Record<string, JobProcessor>
>;

/**
 * Get all registered job processors
 * 
 * @returns Job processor registry
 */
export function getQueueProcessors(): ProcessorRegistry {
  return {
    'points-processing': pointsProcessors,
    'media-processing': mediaProcessors,
    'redemption-processing': redemptionProcessors,
  };
}

// Export all worker modules
export * from './points';
export * from './media';
export * from './redemption';
