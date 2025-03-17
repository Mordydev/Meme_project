/**
 * Priority Service
 * 
 * Manages priority levels for job execution.
 */
import { Job } from 'bull';
import { logger } from '../../lib/logger';
import { redisClient } from '../../lib/redis-client';
import { PriorityPolicy, PriorityLevel } from './index';
import { getQueue } from '../queues';

/**
 * Priority service for managing job priorities
 */
export class PriorityService {
  private policies: Map<string, PriorityPolicy> = new Map();
  private storageKey = 'sk:job_priorities:policies';
  private readonly MIN_PRIORITY = -20;
  private readonly MAX_PRIORITY = 20;
  
  /**
   * Create a new priority service
   */
  constructor() {}
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.loadPolicies();
    logger.info('Priority service initialized', { 
      policyCount: this.policies.size 
    });
  }
  
  /**
   * Register a priority policy
   * 
   * @param policy Priority policy
   */
  registerPriorityPolicy(policy: PriorityPolicy): void {
    const key = this.getPolicyKey(policy.queue, policy.jobName);
    this.policies.set(key, policy);
    
    this.savePolicies().catch(error => {
      logger.error('Failed to save priority policies', { error });
    });
    
    logger.info('Registered priority policy', {
      queue: policy.queue,
      jobName: policy.jobName,
      description: policy.description
    });
  }
  
  /**
   * Calculate job priority
   * 
   * @param queue Queue name
   * @param jobName Job name
   * @param data Job data
   * @returns Calculated priority
   */
  calculateJobPriority(queue: string, jobName: string, data: any): number {
    // Try to find a specific policy for this job type
    const key = this.getPolicyKey(queue, jobName);
    const policy = this.policies.get(key);
    
    if (policy) {
      try {
        // Calculate priority using policy
        const priority = policy.calculatePriority(data);
        
        // Ensure priority is within valid range
        return Math.max(
          this.MIN_PRIORITY,
          Math.min(this.MAX_PRIORITY, priority)
        );
      } catch (error) {
        logger.error('Error calculating job priority', { 
          error, 
          queue, 
          jobName 
        });
        // Fall back to default priority
        return PriorityLevel.NORMAL;
      }
    }
    
    // Try to find a queue-wide policy (jobName = '*')
    const queueWideKey = this.getPolicyKey(queue, '*');
    const queueWidePolicy = this.policies.get(queueWideKey);
    
    if (queueWidePolicy) {
      try {
        // Calculate priority using queue-wide policy
        const priority = queueWidePolicy.calculatePriority(data);
        
        // Ensure priority is within valid range
        return Math.max(
          this.MIN_PRIORITY,
          Math.min(this.MAX_PRIORITY, priority)
        );
      } catch (error) {
        logger.error('Error calculating job priority with queue-wide policy', { 
          error, 
          queue 
        });
        // Fall back to default priority
        return PriorityLevel.NORMAL;
      }
    }
    
    // No policy found, use default priority
    return PriorityLevel.NORMAL;
  }
  
  /**
   * Update job priority
   * 
   * @param queue Queue name
   * @param jobId Job ID
   * @param priority New priority
   * @returns Updated job or null if not found
   */
  async updateJobPriority(
    queue: string, 
    jobId: string, 
    priority: number
  ): Promise<Job | null> {
    try {
      // Get the queue
      const bullQueue = getQueue(queue);
      
      if (!bullQueue) {
        logger.error('Queue not found', { queue });
        return null;
      }
      
      // Get the job
      const job = await bullQueue.getJob(jobId);
      
      if (!job) {
        logger.error('Job not found', { queue, jobId });
        return null;
      }
      
      // Ensure priority is within valid range
      const boundedPriority = Math.max(
        this.MIN_PRIORITY,
        Math.min(this.MAX_PRIORITY, priority)
      );
      
      // Update job priority
      await job.changePriority(boundedPriority);
      
      logger.info('Updated job priority', { 
        queue, 
        jobId, 
        oldPriority: job.opts.priority, 
        newPriority: boundedPriority 
      });
      
      return job;
    } catch (error) {
      logger.error('Error updating job priority', { 
        error, 
        queue, 
        jobId, 
        priority 
      });
      return null;
    }
  }
  
  /**
   * Get all priority policies
   * 
   * @returns All registered priority policies
   */
  getPriorityPolicies(): PriorityPolicy[] {
    return Array.from(this.policies.values());
  }
  
  /**
   * Get a policy key
   * 
   * @param queue Queue name
   * @param jobName Job name
   * @returns Policy key
   */
  private getPolicyKey(queue: string, jobName: string): string {
    return `${queue}:${jobName}`;
  }
  
  /**
   * Load priority policies from storage
   */
  private async loadPolicies(): Promise<void> {
    try {
      const data = await redisClient.get(this.storageKey);
      
      if (data) {
        // Parse policies
        const policiesData = JSON.parse(data) as Array<{
          queue: string;
          jobName: string;
          description: string;
          // We need to reconstruct the function from its string representation
          calculatePriorityStr: string;
        }>;
        
        // Recreate policies
        for (const policyData of policiesData) {
          try {
            // Convert string function back to function
            const calculatePriority = new Function(
              'data', 
              policyData.calculatePriorityStr
            ) as (data: any) => number;
            
            // Recreate policy
            const policy: PriorityPolicy = {
              queue: policyData.queue,
              jobName: policyData.jobName,
              description: policyData.description,
              calculatePriority
            };
            
            // Register policy
            const key = this.getPolicyKey(policy.queue, policy.jobName);
            this.policies.set(key, policy);
          } catch (error) {
            logger.error('Error reconstructing priority policy', { 
              error, 
              policyData 
            });
          }
        }
        
        logger.info('Loaded priority policies', { 
          count: this.policies.size 
        });
      } else {
        logger.info('No priority policies found in storage');
        
        // Register default policies
        this.registerDefaultPolicies();
      }
    } catch (error) {
      logger.error('Error loading priority policies', { error });
      
      // Start with default policies
      this.registerDefaultPolicies();
    }
  }
  
  /**
   * Save priority policies to storage
   */
  private async savePolicies(): Promise<void> {
    try {
      // Convert policies to storable format
      const policiesData = Array.from(this.policies.values()).map(policy => ({
        queue: policy.queue,
        jobName: policy.jobName,
        description: policy.description,
        // Store function as string for serialization
        calculatePriorityStr: policy.calculatePriority.toString()
          .replace(/^function.*?\{|\}$/g, '') // Extract function body
      }));
      
      // Save to Redis
      await redisClient.set(this.storageKey, JSON.stringify(policiesData));
      
      logger.debug('Saved priority policies', { count: policiesData.length });
    } catch (error) {
      logger.error('Error saving priority policies', { error });
    }
  }
  
  /**
   * Register default priority policies
   */
  private registerDefaultPolicies(): void {
    // Points redemption policy - higher priority for larger amounts
    this.registerPriorityPolicy({
      queue: 'redemption-processing',
      jobName: 'process-redemption',
      description: 'Prioritize larger redemption amounts',
      calculatePriority: (data: any) => {
        if (!data || typeof data.amount !== 'number') {
          return PriorityLevel.NORMAL;
        }
        
        // Higher amounts get higher priority (negative values have higher priority in Bull)
        if (data.amount >= 10000) {
          return PriorityLevel.CRITICAL;
        } else if (data.amount >= 5000) {
          return PriorityLevel.HIGH;
        } else if (data.amount >= 1000) {
          return PriorityLevel.NORMAL;
        } else {
          return PriorityLevel.LOW;
        }
      }
    });
    
    // Media processing policy - prioritize user-visible media
    this.registerPriorityPolicy({
      queue: 'media-processing',
      jobName: 'image-optimization',
      description: 'Prioritize user profile images',
      calculatePriority: (data: any) => {
        if (!data || !data.context) {
          return PriorityLevel.NORMAL;
        }
        
        // Prioritize user profile images
        if (data.context === 'profile') {
          return PriorityLevel.HIGH;
        } else if (data.context === 'content') {
          return PriorityLevel.NORMAL;
        } else {
          return PriorityLevel.LOW;
        }
      }
    });
    
    // Points processing policy - prioritize based on user level
    this.registerPriorityPolicy({
      queue: 'points-processing',
      jobName: 'award',
      description: 'Prioritize based on user level and amount',
      calculatePriority: (data: any) => {
        if (!data) {
          return PriorityLevel.NORMAL;
        }
        
        // Prioritize based on user level if available
        if (data.userLevel) {
          if (data.userLevel >= 20) {
            return PriorityLevel.HIGH;
          } else if (data.userLevel >= 10) {
            return PriorityLevel.NORMAL;
          } else {
            return PriorityLevel.LOW;
          }
        }
        
        // Otherwise prioritize based on amount
        if (data.amount >= 1000) {
          return PriorityLevel.HIGH;
        } else if (data.amount >= 100) {
          return PriorityLevel.NORMAL;
        } else {
          return PriorityLevel.LOW;
        }
      }
    });
    
    logger.info('Registered default priority policies');
  }
}
