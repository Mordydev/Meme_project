/**
 * Resource Service
 * 
 * Manages and optimizes execution of resource-intensive jobs.
 */
import * as os from 'os';
import { 
  ResourceRequirements, 
  ResourceAvailability, 
  ResourceThresholds 
} from './index';
import { logger } from '../../lib/logger';
import { redisClient } from '../../lib/redis-client';
import { getQueue } from '../queues';
import { addJob } from '../utils/queue-utils';
import { PriorityLevel } from '../priority';

/**
 * Resource service for managing resource-intensive jobs
 */
export class ResourceService {
  private requirements: Map<string, ResourceRequirements> = new Map();
  private readonly requirementsKey = 'sk:job_resources:requirements';
  private readonly resourcesKey = 'sk:job_resources:availability';
  
  /**
   * Create a new resource service
   */
  constructor() {}
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // Load job resource requirements
    await this.loadRequirements();
    
    // Update resource availability
    await this.updateResourceAvailability();
    
    // Start resource monitoring
    this.startResourceMonitoring();
    
    logger.info('Resource service initialized', { 
      requirementsCount: this.requirements.size 
    });
  }
  
  /**
   * Set resource requirements for a job type
   * 
   * @param queue Queue name
   * @param jobName Job name
   * @param requirements Resource requirements
   */
  async setJobResourceRequirements(
    queue: string,
    jobName: string,
    requirements: ResourceRequirements
  ): Promise<void> {
    try {
      // Create a key for the job type
      const key = this.getJobKey(queue, jobName);
      
      // Store requirements
      this.requirements.set(key, requirements);
      
      // Persist to Redis
      await this.saveRequirements();
      
      logger.info('Set job resource requirements', { 
        queue, 
        jobName, 
        requirements 
      });
    } catch (error) {
      logger.error('Error setting job resource requirements', { 
        error, 
        queue, 
        jobName 
      });
      throw error;
    }
  }
  
  /**
   * Get resource requirements for a job type
   * 
   * @param queue Queue name
   * @param jobName Job name
   * @returns Resource requirements or null if not found
   */
  getJobResourceRequirements(
    queue: string,
    jobName: string
  ): ResourceRequirements | null {
    // Create a key for the job type
    const key = this.getJobKey(queue, jobName);
    
    // Get requirements
    return this.requirements.get(key) || null;
  }
  
  /**
   * Schedule a resource-intensive job
   * 
   * @param queue Queue name
   * @param jobName Job name
   * @param data Job data
   * @param options Job options
   * @returns Scheduled job
   */
  async scheduleResourceIntensiveJob(
    queue: string,
    jobName: string,
    data: any,
    options?: any
  ): Promise<any> {
    try {
      // Get resource requirements for this job type
      const requirements = this.getJobResourceRequirements(queue, jobName);
      
      // If no specific requirements, schedule normally
      if (!requirements) {
        return addJob(queue, jobName, data, options);
      }
      
      // Check current resource availability
      const availability = await this.getResourceAvailability();
      
      // Determine if job can run immediately
      if (this.canRunWithAvailableResources(requirements, availability)) {
        // Calculate priority based on resource usage
        const priority = this.calculateResourcePriority(requirements);
        
        // Schedule job for immediate execution
        return addJob(queue, jobName, data, {
          ...options,
          priority
        });
      } else {
        // Calculate delay based on resource forecast
        const delay = this.calculateResourceAvailabilityDelay(
          requirements, 
          availability
        );
        
        // Calculate priority based on resource usage
        const priority = this.calculateResourcePriority(requirements);
        
        // Schedule with delayed execution
        return addJob(queue, jobName, data, {
          ...options,
          delay,
          priority
        });
      }
    } catch (error) {
      logger.error('Error scheduling resource-intensive job', { 
        error, 
        queue, 
        jobName 
      });
      throw error;
    }
  }
  
  /**
   * Get current resource availability
   * 
   * @returns Resource availability
   */
  async getResourceAvailability(): Promise<ResourceAvailability> {
    try {
      // Check if availability is cached in Redis
      const data = await redisClient.get(this.resourcesKey);
      
      if (data) {
        return JSON.parse(data) as ResourceAvailability;
      }
      
      // Calculate current availability
      const availability = await this.calculateResourceAvailability();
      
      // Cache in Redis (short TTL since this changes rapidly)
      await redisClient.set(
        this.resourcesKey, 
        JSON.stringify(availability), 
        10 // 10 seconds TTL
      );
      
      return availability;
    } catch (error) {
      logger.error('Error getting resource availability', { error });
      
      // Return a default availability on error
      return this.getDefaultResourceAvailability();
    }
  }
  
  /**
   * Check if a job can run with available resources
   * 
   * @param requirements Job resource requirements
   * @param availability Current resource availability
   * @returns true if job can run, false otherwise
   */
  private canRunWithAvailableResources(
    requirements: ResourceRequirements,
    availability: ResourceAvailability
  ): boolean {
    // Check memory requirements
    if (
      requirements.memory && 
      requirements.memory > availability.freeMemory
    ) {
      return false;
    }
    
    // Check CPU requirements
    if (
      requirements.cpu && 
      availability.cpuUsage + requirements.cpu > 90 // 90% max CPU usage
    ) {
      return false;
    }
    
    // Check GPU requirements
    if (requirements.gpu && !availability.gpuAvailable) {
      return false;
    }
    
    // Check concurrent job limits
    return this.checkConcurrentJobLimits(requirements);
  }
  
  /**
   * Check concurrent job limits
   * 
   * @param requirements Job resource requirements
   * @returns true if within limits, false otherwise
   */
  private async checkConcurrentJobLimits(
    requirements: ResourceRequirements
  ): Promise<boolean> {
    try {
      // Get counts of active jobs by type
      const jobCounts = await this.getActiveJobCounts();
      
      // Check total concurrent jobs
      if (jobCounts.total >= ResourceThresholds.MAX_CONCURRENT_JOBS) {
        return false;
      }
      
      // Check memory-intensive jobs
      if (
        requirements.memory && 
        requirements.memory >= ResourceThresholds.MEMORY_INTENSIVE_THRESHOLD && 
        jobCounts.memoryIntensive >= ResourceThresholds.MAX_MEMORY_INTENSIVE_JOBS
      ) {
        return false;
      }
      
      // Check CPU-intensive jobs
      if (
        requirements.cpu && 
        requirements.cpu >= ResourceThresholds.CPU_INTENSIVE_THRESHOLD && 
        jobCounts.cpuIntensive >= ResourceThresholds.MAX_CPU_INTENSIVE_JOBS
      ) {
        return false;
      }
      
      // Check GPU jobs
      if (
        requirements.gpu && 
        jobCounts.gpu >= ResourceThresholds.MAX_GPU_JOBS
      ) {
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking concurrent job limits', { error });
      
      // Default to true to allow job to proceed
      return true;
    }
  }
  
  /**
   * Calculate resource-based priority
   * 
   * @param requirements Job resource requirements
   * @returns Job priority
   */
  private calculateResourcePriority(
    requirements: ResourceRequirements
  ): number {
    // Start with normal priority
    let priority = PriorityLevel.NORMAL;
    
    // Adjust based on resource usage
    const {
      memory, 
      cpu, 
      gpu, 
      duration,
      priorityAdjustment
    } = requirements;
    
    // Adjust for memory usage
    if (memory) {
      if (memory >= 1000) {
        priority += 5; // Lower priority for high memory usage
      } else if (memory >= 500) {
        priority += 3;
      } else if (memory >= 200) {
        priority += 1;
      }
    }
    
    // Adjust for CPU usage
    if (cpu) {
      if (cpu >= 50) {
        priority += 5; // Lower priority for high CPU usage
      } else if (cpu >= 30) {
        priority += 3;
      } else if (cpu >= 10) {
        priority += 1;
      }
    }
    
    // Adjust for GPU usage
    if (gpu) {
      priority += 5; // Lower priority for GPU jobs
    }
    
    // Adjust for duration
    if (duration) {
      if (duration >= 300) {
        priority += 5; // Lower priority for long-running jobs
      } else if (duration >= 60) {
        priority += 3;
      } else if (duration >= 10) {
        priority += 1;
      }
    }
    
    // Apply explicit priority adjustment if provided
    if (priorityAdjustment) {
      priority += priorityAdjustment;
    }
    
    // Ensure priority is within valid range
    return Math.max(-20, Math.min(20, priority));
  }
  
  /**
   * Calculate delay for resource availability
   * 
   * @param requirements Job resource requirements
   * @param availability Current resource availability
   * @returns Delay in milliseconds
   */
  private calculateResourceAvailabilityDelay(
    requirements: ResourceRequirements,
    availability: ResourceAvailability
  ): number {
    let delay = 0;
    
    // Check memory
    if (
      requirements.memory && 
      requirements.memory > availability.freeMemory
    ) {
      delay = Math.max(delay, availability.forecast.memory * 1000);
    }
    
    // Check CPU
    if (
      requirements.cpu && 
      availability.cpuUsage + requirements.cpu > 90 // 90% max CPU usage
    ) {
      delay = Math.max(delay, availability.forecast.cpu * 1000);
    }
    
    // Check GPU
    if (requirements.gpu && !availability.gpuAvailable) {
      delay = Math.max(delay, availability.forecast.gpu * 1000);
    }
    
    // Add jitter to prevent thundering herd
    const jitter = Math.floor(Math.random() * 5000); // 0-5 seconds
    
    // Ensure at least some delay
    return Math.max(1000, delay + jitter);
  }
  
  /**
   * Get active job counts by type
   * 
   * @returns Counts of active jobs by type
   */
  private async getActiveJobCounts(): Promise<{
    total: number;
    memoryIntensive: number;
    cpuIntensive: number;
    gpu: number;
  }> {
    try {
      let total = 0;
      let memoryIntensive = 0;
      let cpuIntensive = 0;
      let gpu = 0;
      
      // Get all queues
      const queues = getQueue();
      
      // Count active jobs in each queue
      for (const [queueName, queue] of Object.entries(queues)) {
        // Get active jobs
        const activeCount = await queue.getActiveCount();
        total += activeCount;
        
        // Get active job IDs
        const activeJobs = await queue.getActive(0, 100);
        
        // Check each job's requirements
        for (const job of activeJobs) {
          const requirements = this.getJobResourceRequirements(
            queueName, 
            job.name
          );
          
          if (!requirements) {
            continue;
          }
          
          // Check memory-intensive
          if (
            requirements.memory && 
            requirements.memory >= ResourceThresholds.MEMORY_INTENSIVE_THRESHOLD
          ) {
            memoryIntensive++;
          }
          
          // Check CPU-intensive
          if (
            requirements.cpu && 
            requirements.cpu >= ResourceThresholds.CPU_INTENSIVE_THRESHOLD
          ) {
            cpuIntensive++;
          }
          
          // Check GPU
          if (requirements.gpu) {
            gpu++;
          }
        }
      }
      
      return {
        total,
        memoryIntensive,
        cpuIntensive,
        gpu
      };
    } catch (error) {
      logger.error('Error getting active job counts', { error });
      
      // Return defaults on error
      return {
        total: 0,
        memoryIntensive: 0,
        cpuIntensive: 0,
        gpu: 0
      };
    }
  }
  
  /**
   * Calculate current resource availability
   * 
   * @returns Resource availability
   */
  private async calculateResourceAvailability(): Promise<ResourceAvailability> {
    // Calculate memory availability
    const totalMemory = Math.floor(os.totalmem() / (1024 * 1024)); // Total memory in MB
    const freeMemory = Math.floor(os.freemem() / (1024 * 1024)); // Free memory in MB
    
    // Calculate CPU usage
    const cpuUsage = await this.getCurrentCpuUsage();
    
    // GPU availability (simplified - would be more complex in a real system)
    const gpuAvailable = false; // No GPU by default
    
    // Calculate resource forecast
    const forecast = await this.calculateResourceForecast(freeMemory, cpuUsage, gpuAvailable);
    
    return {
      totalMemory,
      freeMemory,
      cpuUsage,
      gpuAvailable,
      forecast
    };
  }
  
  /**
   * Get CPU usage percentage
   * 
   * @returns CPU usage percentage (0-100)
   */
  private async getCurrentCpuUsage(): Promise<number> {
    // This is a simplified implementation - in a real system,
    // we would use more advanced CPU usage tracking
    
    return new Promise(resolve => {
      // Get initial CPU info
      const startMeasure = os.cpus().map(cpu => {
        return {
          idle: cpu.times.idle,
          total: Object.values(cpu.times).reduce((a, b) => a + b, 0)
        };
      });
      
      // Measure again after a short interval
      setTimeout(() => {
        const endMeasure = os.cpus().map(cpu => {
          return {
            idle: cpu.times.idle,
            total: Object.values(cpu.times).reduce((a, b) => a + b, 0)
          };
        });
        
        // Calculate CPU usage
        const idleDiff = startMeasure.map((start, i) => {
          return endMeasure[i].idle - start.idle;
        }).reduce((a, b) => a + b, 0);
        
        const totalDiff = startMeasure.map((start, i) => {
          return endMeasure[i].total - start.total;
        }).reduce((a, b) => a + b, 0);
        
        // Calculate CPU usage percentage
        const cpuUsage = 100 - Math.round((idleDiff / totalDiff) * 100);
        
        resolve(cpuUsage);
      }, 100);
    });
  }
  
  /**
   * Calculate resource forecast
   * 
   * @param freeMemory Free memory in MB
   * @param cpuUsage CPU usage percentage
   * @param gpuAvailable Whether GPU is available
   * @returns Resource forecast
   */
  private async calculateResourceForecast(
    freeMemory: number,
    cpuUsage: number,
    gpuAvailable: boolean
  ): Promise<{
    memory: number;
    cpu: number;
    gpu: number;
  }> {
    try {
      // Get active jobs with requirements
      const activeJobsWithRequirements = await this.getActiveJobsWithRequirements();
      
      // Sort jobs by estimated completion time
      activeJobsWithRequirements.sort((a, b) => {
        const aTime = a.requirements.duration || 60;
        const bTime = b.requirements.duration || 60;
        return aTime - bTime;
      });
      
      // Calculate when resources will be available
      let memoryForecast = 0;
      let cpuForecast = 0;
      let gpuForecast = 0;
      
      // Calculate memory forecast
      if (freeMemory < ResourceThresholds.MEMORY_INTENSIVE_THRESHOLD) {
        // Find memory-intensive jobs
        const memoryJobs = activeJobsWithRequirements.filter(
          job => job.requirements.memory && 
                job.requirements.memory >= ResourceThresholds.MEMORY_INTENSIVE_THRESHOLD
        );
        
        if (memoryJobs.length > 0) {
          // Estimate when memory will be available
          memoryForecast = memoryJobs[0].requirements.duration || 60;
        }
      }
      
      // Calculate CPU forecast
      if (cpuUsage > 70) { // High CPU usage
        // Find CPU-intensive jobs
        const cpuJobs = activeJobsWithRequirements.filter(
          job => job.requirements.cpu && 
                job.requirements.cpu >= ResourceThresholds.CPU_INTENSIVE_THRESHOLD
        );
        
        if (cpuJobs.length > 0) {
          // Estimate when CPU will be available
          cpuForecast = cpuJobs[0].requirements.duration || 60;
        }
      }
      
      // Calculate GPU forecast
      if (!gpuAvailable) {
        // Find GPU jobs
        const gpuJobs = activeJobsWithRequirements.filter(
          job => job.requirements.gpu
        );
        
        if (gpuJobs.length > 0) {
          // Estimate when GPU will be available
          gpuForecast = gpuJobs[0].requirements.duration || 60;
        } else {
          // No GPU available in the system
          gpuForecast = 3600; // 1 hour (effectively never)
        }
      }
      
      return {
        memory: memoryForecast,
        cpu: cpuForecast,
        gpu: gpuForecast
      };
    } catch (error) {
      logger.error('Error calculating resource forecast', { error });
      
      // Return default forecast on error
      return {
        memory: 0,
        cpu: 0,
        gpu: 0
      };
    }
  }
  
  /**
   * Get active jobs with resource requirements
   * 
   * @returns Array of active jobs with their resource requirements
   */
  private async getActiveJobsWithRequirements(): Promise<Array<{
    queue: string;
    jobName: string;
    requirements: ResourceRequirements;
  }>> {
    try {
      const result: Array<{
        queue: string;
        jobName: string;
        requirements: ResourceRequirements;
      }> = [];
      
      // Get all queues
      const queues = getQueue();
      
      // Get active jobs from each queue
      for (const [queueName, queue] of Object.entries(queues)) {
        // Get active jobs
        const activeJobs = await queue.getActive(0, 100);
        
        // Check each job's requirements
        for (const job of activeJobs) {
          const requirements = this.getJobResourceRequirements(
            queueName, 
            job.name
          );
          
          if (requirements) {
            result.push({
              queue: queueName,
              jobName: job.name,
              requirements
            });
          }
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting active jobs with requirements', { error });
      return [];
    }
  }
  
  /**
   * Get job key for requirements lookup
   * 
   * @param queue Queue name
   * @param jobName Job name
   * @returns Job key
   */
  private getJobKey(queue: string, jobName: string): string {
    return `${queue}:${jobName}`;
  }
  
  /**
   * Get default resource availability
   * 
   * @returns Default resource availability
   */
  private getDefaultResourceAvailability(): ResourceAvailability {
    return {
      totalMemory: 16384, // 16 GB
      freeMemory: 8192, // 8 GB
      cpuUsage: 30, // 30% CPU usage
      gpuAvailable: false,
      forecast: {
        memory: 0,
        cpu: 0,
        gpu: 0
      }
    };
  }
  
  /**
   * Load resource requirements from storage
   */
  private async loadRequirements(): Promise<void> {
    try {
      // Get requirements from Redis
      const data = await redisClient.get(this.requirementsKey);
      
      if (data) {
        // Parse requirements
        const requirementsData = JSON.parse(data) as Array<{
          key: string;
          requirements: ResourceRequirements;
        }>;
        
        // Load into memory
        for (const { key, requirements } of requirementsData) {
          this.requirements.set(key, requirements);
        }
        
        logger.info('Loaded job resource requirements', { 
          count: this.requirements.size 
        });
      } else {
        logger.info('No job resource requirements found in storage');
        
        // Register default requirements
        this.registerDefaultRequirements();
      }
    } catch (error) {
      logger.error('Error loading job resource requirements', { error });
      
      // Register default requirements
      this.registerDefaultRequirements();
    }
  }
  
  /**
   * Save resource requirements to storage
   */
  private async saveRequirements(): Promise<void> {
    try {
      // Convert to array for storage
      const requirementsData = Array.from(this.requirements.entries()).map(
        ([key, requirements]) => ({
          key,
          requirements
        })
      );
      
      // Save to Redis
      await redisClient.set(this.requirementsKey, JSON.stringify(requirementsData));
      
      logger.debug('Saved job resource requirements', { 
        count: requirementsData.length 
      });
    } catch (error) {
      logger.error('Error saving job resource requirements', { error });
    }
  }
  
  /**
   * Register default resource requirements
   */
  private registerDefaultRequirements(): void {
    // Media processing jobs
    this.setJobResourceRequirements('media-processing', 'image-optimization', {
      memory: 200,
      cpu: 20,
      duration: 30,
    });
    
    this.setJobResourceRequirements('media-processing', 'video-processing', {
      memory: 1000,
      cpu: 50,
      duration: 300,
    });
    
    // Points processing jobs
    this.setJobResourceRequirements('points-processing', 'redemption', {
      memory: 100,
      cpu: 10,
      duration: 10,
      priorityAdjustment: -5, // Higher priority
    });
    
    logger.info('Registered default job resource requirements');
  }
  
  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): void {
    // Update resource availability periodically
    setInterval(
      async () => {
        try {
          await this.updateResourceAvailability();
        } catch (error) {
          logger.error('Error updating resource availability', { error });
        }
      },
      30 * 1000 // 30 seconds
    );
  }
  
  /**
   * Update resource availability
   */
  private async updateResourceAvailability(): Promise<void> {
    try {
      // Calculate current availability
      const availability = await this.calculateResourceAvailability();
      
      // Cache in Redis
      await redisClient.set(
        this.resourcesKey, 
        JSON.stringify(availability), 
        60 // 60 seconds TTL
      );
      
      logger.debug('Updated resource availability', { 
        freeMemory: availability.freeMemory, 
        cpuUsage: availability.cpuUsage, 
        gpuAvailable: availability.gpuAvailable 
      });
    } catch (error) {
      logger.error('Error updating resource availability', { error });
    }
  }
}
