/**
 * Job Priority Service
 * 
 * Manages job prioritization in queues
 */
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';
import { QueueName, JobTypeMap } from '../queues';
import { jobService } from '../service';

/**
 * Priority levels for jobs
 */
export enum PriorityLevel {
  LOW = 10,
  NORMAL = 0,
  HIGH = -5,
  CRITICAL = -10
}

/**
 * Priority policy interface
 */
export interface PriorityPolicy {
  queue: string;
  jobName: string;
  calculatePriority: (data: any) => number;
  description: string;
}

/**
 * Job priority service
 */
export class PriorityService {
  private policies: Map<string, PriorityPolicy> = new Map();
  private readonly priorityKey = 'job:priority:policies';
  
  constructor() {
    // Set up some initial policies
    this.registerBuiltInPolicies();
  }
  
  /**
   * Register built-in priority policies
   */
  private registerBuiltInPolicies(): void {
    // Point redemption priority - higher amounts get higher priority
    this.registerPriorityPolicy({
      queue: QueueName.POINTS,
      jobName: 'redemption',
      calculatePriority: (data) => {
        // Smaller values have higher priority in Bull
        // Base priority is normal (0)
        const basePriority = PriorityLevel.NORMAL;
        
        // Calculate priority based on redemption amount
        const amount = data.amount || 0;
        
        if (amount > 10000) {
          return PriorityLevel.CRITICAL; // Highest priority for large redemptions
        } else if (amount > 5000) {
          return PriorityLevel.HIGH; // High priority for medium redemptions
        } else if (amount < 1000) {
          return PriorityLevel.LOW; // Low priority for small redemptions
        }
        
        return basePriority; // Normal priority for average redemptions
      },
      description: 'Prioritizes redemptions based on amount'
    });
    
    // Content moderation priority - flagged content gets higher priority
    this.registerPriorityPolicy({
      queue: QueueName.CONTENT,
      jobName: 'moderation',
      calculatePriority: (data) => {
        // Base priority is normal (0)
        const basePriority = PriorityLevel.NORMAL;
        
        // Increase priority for flagged content
        if (data.flagged) {
          return PriorityLevel.HIGH;
        }
        
        // Increase priority for specific content types
        if (data.contentType === 'image') {
          return PriorityLevel.NORMAL - 2; // Slightly higher than normal
        }
        
        return basePriority;
      },
      description: 'Prioritizes moderation based on content type and flags'
    });
    
    // Media processing priority - user visible media gets higher priority
    this.registerPriorityPolicy({
      queue: QueueName.MEDIA,
      jobName: 'optimization',
      calculatePriority: (data) => {
        // Base priority is normal (0)
        const basePriority = PriorityLevel.NORMAL;
        
        // Increase priority for user profile images
        if (data.context === 'profile') {
          return PriorityLevel.HIGH;
        }
        
        // Process large images with lower priority
        const fileSize = data.fileSize || 0;
        if (fileSize > 5 * 1024 * 1024) { // 5MB
          return PriorityLevel.LOW;
        }
        
        return basePriority;
      },
      description: 'Prioritizes media optimization based on context and file size'
    });
  }
  
  /**
   * Register a priority policy
   * 
   * @param policy The priority policy to register
   */
  registerPriorityPolicy(policy: PriorityPolicy): void {
    const key = `${policy.queue}:${policy.jobName}`;
    this.policies.set(key, policy);
    
    // Store policy in Redis for persistence
    this.storePolicyInRedis(key, policy);
    
    logger.info('Registered priority policy', {
      queue: policy.queue,
      jobName: policy.jobName,
      description: policy.description
    });
  }
  
  /**
   * Store a policy in Redis
   * 
   * @param key The policy key
   * @param policy The policy to store
   */
  private async storePolicyInRedis(key: string, policy: PriorityPolicy): Promise<void> {
    try {
      // Store policy metadata (not the function)
      const policyMetadata = {
        queue: policy.queue,
        jobName: policy.jobName,
        description: policy.description
      };
      
      await redis.hset(
        this.priorityKey,
        key,
        JSON.stringify(policyMetadata)
      );
    } catch (error) {
      logger.error('Error storing priority policy in Redis', {
        key,
        error
      });
    }
  }
  
  /**
   * Calculate priority for a job
   * 
   * @param queue The queue name
   * @param jobName The job name
   * @param data The job data
   * @returns The calculated priority
   */
  calculateJobPriority<T extends QueueName>(
    queue: T,
    jobName: JobTypeMap[T],
    data: any
  ): number {
    const key = `${queue}:${jobName}`;
    const policy = this.policies.get(key);
    
    if (!policy) {
      // Default priority if no policy exists
      return PriorityLevel.NORMAL;
    }
    
    try {
      // Calculate priority using policy
      const calculatedPriority = policy.calculatePriority(data);
      
      // Ensure priority is within valid range
      // Bull uses lower numbers for higher priority
      return Math.max(-20, Math.min(20, calculatedPriority));
    } catch (error) {
      logger.error('Error calculating job priority', {
        queue,
        jobName,
        error
      });
      
      // Return default priority on error
      return PriorityLevel.NORMAL;
    }
  }
  
  /**
   * Update job priority
   * 
   * @param queue The queue name
   * @param jobId The job ID
   * @param priority The new priority
   * @returns True if the job priority was updated
   */
  async updateJobPriority<T extends QueueName>(
    queue: T,
    jobId: string,
    priority: number
  ): Promise<boolean> {
    try {
      // Get the job
      const job = await jobService.getJob(queue, jobId);
      
      if (!job) {
        logger.warn('Job not found for priority update', {
          queue,
          jobId
        });
        return false;
      }
      
      // Validate priority range
      const validPriority = Math.max(-20, Math.min(20, priority));
      
      // Change priority
      await job.changePriority(validPriority);
      
      logger.info('Updated job priority', {
        jobId,
        queue,
        oldPriority: job.opts.priority || 0,
        newPriority: validPriority
      });
      
      return true;
    } catch (error) {
      logger.error('Error updating job priority', {
        jobId,
        queue,
        priority,
        error
      });
      return false;
    }
  }
  
  /**
   * Get all priority policies
   * 
   * @returns Array of priority policies
   */
  getPriorityPolicies(): PriorityPolicy[] {
    return Array.from(this.policies.values());
  }
  
  /**
   * Get policy for a specific job type
   * 
   * @param queue The queue name
   * @param jobName The job name
   * @returns The priority policy or undefined
   */
  getPriorityPolicy<T extends QueueName>(
    queue: T,
    jobName: JobTypeMap[T]
  ): PriorityPolicy | undefined {
    const key = `${queue}:${jobName}`;
    return this.policies.get(key);
  }
}

// Export singleton instance
export const priorityService = new PriorityService();
