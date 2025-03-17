/**
 * Job Priority System
 * 
 * Manages priority levels for job execution.
 */
import { logger } from '../../lib/logger';
import { PriorityService } from './service';

// Singleton service instance
let priorityService: PriorityService | null = null;

/**
 * Get the priority service
 * @returns Priority service instance
 */
export function getPriorityService(): PriorityService {
  if (!priorityService) {
    priorityService = new PriorityService();
  }
  return priorityService;
}

/**
 * Initialize the priority system
 */
export async function initializePrioritySystem(): Promise<void> {
  try {
    const priority = getPriorityService();
    await priority.initialize();
    logger.info('Job priority system initialized');
  } catch (error) {
    logger.error('Failed to initialize job priority system', { error });
    throw error;
  }
}

// Export operations
export const registerPriorityPolicy = (policy: PriorityPolicy) => 
  getPriorityService().registerPriorityPolicy(policy);

export const calculateJobPriority = (queue: string, jobName: string, data: any) => 
  getPriorityService().calculateJobPriority(queue, jobName, data);

export const updateJobPriority = (queue: string, jobId: string, priority: number) => 
  getPriorityService().updateJobPriority(queue, jobId, priority);

export const getPriorityPolicies = () => 
  getPriorityService().getPriorityPolicies();

// Export priority levels
export enum PriorityLevel {
  CRITICAL = -10,
  HIGH = -5,
  NORMAL = 0,
  LOW = 10,
  BULK = 20
}

// Export interface
export interface PriorityPolicy {
  queue: string;
  jobName: string;
  calculatePriority: (data: any) => number;
  description: string;
}
