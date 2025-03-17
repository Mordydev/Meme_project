/**
 * Resource Management Service
 * 
 * Manages and optimizes resource usage for jobs
 */
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';
import { QueueName, JobTypeMap } from '../queues';
import { jobService } from '../service';
import os from 'os';

/**
 * Resource requirements interface
 */
export interface ResourceRequirements {
  memory?: number; // MB
  cpu?: number;    // Percentage (0-100)
  gpu?: boolean;   // Whether GPU is required
  duration?: number; // Estimated seconds
}

/**
 * Resource availability interface
 */
export interface ResourceAvailability {
  memory: {
    total: number;
    available: number;
  };
  cpu: {
    cores: number;
    utilization: number;
  };
  gpu: boolean;
  activeJobs: number;
}

/**
 * Service for managing resource-intensive jobs
 */
export class ResourceService {
  private readonly resourceKey = 'job:resources';
  private requirements: Map<string, ResourceRequirements> = new Map();
  
  constructor() {
    // Initialize with some default resource requirements
    this.initializeDefaultRequirements();
  }
  
  /**
   * Initialize default resource requirements
   */
  private initializeDefaultRequirements(): void {
    // Image optimization
    this.setJobResourceRequirements(
      QueueName.MEDIA,
      'optimization' as any,
      {
        memory: 200, // 200MB
        cpu: 30,     // 30% CPU
        gpu: false,
        duration: 10 // 10 seconds
      }
    );
    
    // Video transcoding
    this.setJobResourceRequirements(
      QueueName.MEDIA,
      'transcoding' as any,
      {
        memory: 500, // 500MB
        cpu: 80,     // 80% CPU
        gpu: false,
        duration: 60 // 60 seconds
      }
    );
    
    // Content moderation
    this.setJobResourceRequirements(
      QueueName.CONTENT,
      'moderation' as any,
      {
        memory: 150, // 150MB
        cpu: 20,     // 20% CPU
        gpu: false,
        duration: 5  // 5 seconds
      }
    );
    
    // Points redemption
    this.setJobResourceRequirements(
      QueueName.POINTS,
      'redemption' as any,
      {
        memory: 100, // 100MB
        cpu: 10,     // 10% CPU
        gpu: false,
        duration: 30 // 30 seconds
      }
    );
  }
  
  /**
   * Set resource requirements for a job type
   * 
   * @param queue The queue name
   * @param jobName The job name
   * @param requirements Resource requirements
   */
  async setJobResourceRequirements<T extends QueueName>(
    queue: T,
    jobName: JobTypeMap[T],
    requirements: ResourceRequirements
  ): Promise<void> {
    try {
      const key = `${queue}:${jobName}`;
      this.requirements.set(key, requirements);
      
      // Store in Redis for persistence
      await redis.hset(
        this.resourceKey,
        key,
        JSON.stringify(requirements)
      );
      
      logger.info('Set job resource requirements', {
        queue,
        jobName,
        requirements
      });
    } catch (error) {
      logger.error('Error setting job resource requirements', {
        queue,
        jobName,
        error
      });
    }
  }
  
  /**
   * Get resource requirements for a job type
   * 
   * @param queue The queue name
   * @param jobName The job name
   * @returns Resource requirements or undefined
   */
  async getJobResourceRequirements<T extends QueueName>(
    queue: T,
    jobName: JobTypeMap[T]
  ): Promise<ResourceRequirements | undefined> {
    try {
      const key = `${queue}:${jobName}`;
      
      // Check memory cache first
      const cachedRequirements = this.requirements.get(key);
      if (cachedRequirements) {
        return cachedRequirements;
      }
      
      // Check Redis
      const requirementsJson = await redis.hget(this.resourceKey, key);
      if (requirementsJson) {
        const requirements = JSON.parse(requirementsJson);
        
        // Cache in memory
        this.requirements.set(key, requirements);
        
        return requirements;
      }
      
      return undefined;
    } catch (error) {
      logger.error('Error getting job resource requirements', {
        queue,
        jobName,
        error
      });
      return undefined;
    }
  }
  
  /**
   * Schedule a resource-intensive job with resource awareness
   * 
   * @param queue The queue name
   * @param jobName The job name
   * @param data The job data
   * @param customRequirements Custom resource requirements (override defaults)
   * @returns The created job's ID
   */
  async scheduleResourceIntensiveJob<T extends QueueName, D = any>(
    queue: T,
    jobName: JobTypeMap[T],
    data: D,
    customRequirements?: ResourceRequirements
  ): Promise<string> {
    try {
      // Get resource requirements
      const requirements = customRequirements || 
        await this.getJobResourceRequirements(queue, jobName) ||
        {};
      
      // Get current resource availability
      const availability = await this.getResourceAvailability();
      
      // Determine if job can run immediately
      if (this.canRunWithAvailableResources(requirements, availability)) {
        // Schedule job for immediate execution
        logger.info('Scheduling resource-intensive job for immediate execution', {
          queue,
          jobName,
          requirements
        });
        
        return jobService.addJob(queue, jobName, {
          ...data,
          _resourceRequirements: requirements
        });
      } else {
        // Calculate delay based on resource forecast
        const delay = this.calculateResourceAvailabilityDelay(requirements);
        
        logger.info('Scheduling resource-intensive job with delay', {
          queue,
          jobName,
          requirements,
          delay
        });
        
        // Schedule job with delay
        return jobService.addJob(queue, jobName, {
          ...data,
          _resourceRequirements: requirements
        }, {
          delay
        });
      }
    } catch (error) {
      logger.error('Error scheduling resource-intensive job', {
        queue,
        jobName,
        error
      });
      throw error;
    }
  }
  
  /**
   * Check if a job can run with available resources
   * 
   * @param requirements Job resource requirements
   * @param availability Current resource availability
   * @returns Whether the job can run immediately
   */
  private canRunWithAvailableResources(
    requirements: ResourceRequirements,
    availability: ResourceAvailability
  ): boolean {
    // Check memory
    if (requirements.memory && 
        requirements.memory > availability.memory.available) {
      return false;
    }
    
    // Check CPU
    if (requirements.cpu && 
        availability.cpu.utilization + requirements.cpu > 90) { // 90% max utilization
      return false;
    }
    
    // Check GPU
    if (requirements.gpu && !availability.gpu) {
      return false;
    }
    
    // Check active jobs
    const maxConcurrentJobs = Math.max(1, os.cpus().length - 1); // Leave one core free
    if (availability.activeJobs >= maxConcurrentJobs) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Calculate delay for resource availability
   * 
   * @param requirements Job resource requirements
   * @returns Delay in milliseconds
   */
  private calculateResourceAvailabilityDelay(
    requirements: ResourceRequirements
  ): number {
    // This is a simplified implementation
    
    // Base delay
    let delay = 5000; // 5 seconds
    
    // Add delay based on resource requirements
    if (requirements.memory && requirements.memory > 500) {
      delay += 10000; // Additional 10 seconds for high memory
    }
    
    if (requirements.cpu && requirements.cpu > 60) {
      delay += 15000; // Additional 15 seconds for high CPU
    }
    
    if (requirements.gpu) {
      delay += 30000; // Additional 30 seconds for GPU
    }
    
    if (requirements.duration && requirements.duration > 30) {
      delay += requirements.duration * 1000 / 2; // Additional delay for long-running jobs
    }
    
    // Add some jitter to prevent thundering herd
    const jitter = Math.random() * 5000; // 0-5 seconds
    
    return delay + jitter;
  }
  
  /**
   * Get current resource availability
   * 
   * @returns Resource availability
   */
  async getResourceAvailability(): Promise<ResourceAvailability> {
    try {
      // Get system memory info
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      
      // Get CPU info
      const cpuInfo = os.cpus();
      const cpuCount = cpuInfo.length;
      
      // Get CPU utilization (simplified)
      const cpuUtilization = await this.getCpuUtilization();
      
      // Get active jobs count
      const activeJobs = await this.getActiveJobsCount();
      
      return {
        memory: {
          total: Math.floor(totalMemory / (1024 * 1024)), // Convert to MB
          available: Math.floor(freeMemory / (1024 * 1024)) // Convert to MB
        },
        cpu: {
          cores: cpuCount,
          utilization: cpuUtilization
        },
        gpu: false, // Currently no GPU support
        activeJobs
      };
    } catch (error) {
      logger.error('Error getting resource availability', { error });
      
      // Return default values
      return {
        memory: {
          total: 1024,
          available: 512
        },
        cpu: {
          cores: 2,
          utilization: 50
        },
        gpu: false,
        activeJobs: 1
      };
    }
  }
  
  /**
   * Get CPU utilization
   * 
   * @returns CPU utilization percentage
   */
  private async getCpuUtilization(): Promise<number> {
    try {
      // This is a simplified implementation
      // In a production environment, you would use a more accurate method
      
      // Get CPU info
      const cpuInfo = os.cpus();
      
      // Calculate average load
      let totalIdle = 0;
      let totalTick = 0;
      
      for (const cpu of cpuInfo) {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      }
      
      const idle = totalIdle / cpuInfo.length;
      const total = totalTick / cpuInfo.length;
      const usage = 100 - (100 * idle / total);
      
      return Math.round(usage);
    } catch (error) {
      logger.error('Error getting CPU utilization', { error });
      return 50; // Default to 50%
    }
  }
  
  /**
   * Get active jobs count
   * 
   * @returns Count of active jobs
   */
  private async getActiveJobsCount(): Promise<number> {
    try {
      let totalActive = 0;
      
      // Get active job count for each queue
      for (const queue of Object.values(QueueName)) {
        const stats = await jobService.getQueueStats(queue);
        totalActive += stats.counts.active;
      }
      
      return totalActive;
    } catch (error) {
      logger.error('Error getting active jobs count', { error });
      return 1; // Default to 1
    }
  }
}

// Export singleton instance
export const resourceService = new ResourceService();
