/**
 * Job Dependency Service
 * 
 * Manages dependencies between jobs
 */
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';
import { QueueName, JobTypeMap } from '../queues';
import { jobService } from '../service';

/**
 * Dependency status
 */
export interface DependencyStatus {
  ready: boolean;
  pending: number;
  failed: number;
  dependencies?: string[];
}

/**
 * Dependency graph interface
 */
export interface DependencyGraph {
  jobId: string;
  queue: string;
  status: string;
  dependencies: DependencyGraph[];
}

/**
 * Service for managing job dependencies
 */
export class DependencyService {
  private readonly dependencyKey = 'job:dependencies';
  
  /**
   * Add a job with dependencies
   * 
   * @param queue The queue name
   * @param name The job name
   * @param data The job data
   * @param dependencies Job IDs this job depends on
   * @returns The created job's ID
   */
  async addJobWithDependencies<T extends QueueName, D = any>(
    queue: T,
    name: JobTypeMap[T],
    data: D,
    dependencies: string[]
  ): Promise<string> {
    try {
      // Validate dependencies
      await this.validateDependencies(dependencies);
      
      // Check if all dependencies are already complete
      const dependencyStatus = await this.checkDependencies(dependencies);
      
      if (dependencyStatus.ready) {
        // All dependencies are complete, add job normally
        return jobService.addJob(queue, name, data);
      }
      
      // Add job in delayed state (will be activated when dependencies complete)
      const jobId = await jobService.addJob(queue, name, data, {
        // Set a far future delay - we'll manually promote it when dependencies are ready
        delay: 1000 * 60 * 60 * 24 * 365, // 1 year
      });
      
      // Store job dependency information
      await this.storeDependencies(jobId, queue, dependencies);
      
      logger.info('Added job with dependencies', {
        jobId,
        queue,
        name,
        dependencyCount: dependencies.length
      });
      
      return jobId;
    } catch (error) {
      logger.error('Error adding job with dependencies', {
        queue,
        name,
        error
      });
      throw error;
    }
  }
  
  /**
   * Store job dependency information
   * 
   * @param jobId The job ID
   * @param queue The queue name
   * @param dependencies Job IDs this job depends on
   */
  private async storeDependencies(
    jobId: string,
    queue: string,
    dependencies: string[]
  ): Promise<void> {
    try {
      // Store the dependency information in Redis
      await redis.hset(
        `${this.dependencyKey}:${jobId}`,
        'jobId', jobId,
        'queue', queue,
        'dependencies', JSON.stringify(dependencies),
        'status', 'pending'
      );
      
      // For each dependency, store that this job depends on it
      for (const depId of dependencies) {
        await redis.sadd(`${this.dependencyKey}:dependent:${depId}`, jobId);
      }
    } catch (error) {
      logger.error('Error storing job dependencies', {
        jobId,
        queue,
        error
      });
      throw error;
    }
  }
  
  /**
   * Validate dependencies to ensure they exist
   * 
   * @param dependencies Job IDs to validate
   */
  private async validateDependencies(dependencies: string[]): Promise<void> {
    for (const depId of dependencies) {
      // Check format - this is a basic check, might need enhancement
      if (!depId || typeof depId !== 'string' || depId.length < 3) {
        throw new Error(`Invalid dependency ID: ${depId}`);
      }
      
      // TODO: Implement proper validation if needed
      // For now, we assume the job IDs are valid
    }
  }
  
  /**
   * Check if all dependencies are complete
   * 
   * @param dependencies Array of job IDs to check
   * @returns Dependency status
   */
  async checkDependencies(dependencies: string[]): Promise<DependencyStatus> {
    try {
      if (!dependencies || dependencies.length === 0) {
        return { ready: true, pending: 0, failed: 0 };
      }
      
      let pending = 0;
      let failed = 0;
      
      // Check each dependency
      for (const depId of dependencies) {
        // Get dependency info
        const depInfo = await redis.hgetall(`${this.dependencyKey}:${depId}`);
        
        if (!depInfo || Object.keys(depInfo).length === 0) {
          // Dependency not found, try to get job status
          const queue = await this.findJobQueue(depId);
          
          if (queue) {
            const status = await jobService.getJobStatus(queue, depId);
            
            if (!status || status.state === 'failed') {
              failed++;
            } else if (status.state !== 'completed') {
              pending++;
            }
          } else {
            // Can't find the job, consider it pending
            pending++;
          }
        } else {
          // Check status from dependency info
          if (depInfo.status === 'failed') {
            failed++;
          } else if (depInfo.status !== 'completed') {
            pending++;
          }
        }
      }
      
      return {
        ready: pending === 0 && failed === 0,
        pending,
        failed,
        dependencies
      };
    } catch (error) {
      logger.error('Error checking dependencies', {
        dependencies,
        error
      });
      
      return {
        ready: false,
        pending: dependencies.length,
        failed: 0,
        dependencies
      };
    }
  }
  
  /**
   * Try to find which queue a job is in
   * 
   * @param jobId The job ID to find
   * @returns Queue name or undefined
   */
  private async findJobQueue(jobId: string): Promise<QueueName | undefined> {
    for (const queue of Object.values(QueueName)) {
      try {
        const job = await jobService.getJob(queue, jobId);
        if (job) {
          return queue;
        }
      } catch (error) {
        // Ignore errors, just try the next queue
      }
    }
    return undefined;
  }
  
  /**
   * Handle job completion - triggers dependent jobs
   * 
   * @param jobId The completed job ID
   * @param success Whether the job completed successfully
   */
  async handleJobCompletion(jobId: string, success: boolean): Promise<void> {
    try {
      // Update job dependency status
      await redis.hset(
        `${this.dependencyKey}:${jobId}`,
        'status', success ? 'completed' : 'failed'
      );
      
      // If job failed, mark dependent jobs as failed
      if (!success) {
        await this.handleDependencyFailure(jobId);
        return;
      }
      
      // Get jobs that depend on this one
      const dependentJobs = await redis.smembers(`${this.dependencyKey}:dependent:${jobId}`);
      
      if (dependentJobs.length === 0) {
        // No dependent jobs, nothing to do
        return;
      }
      
      logger.info('Processing dependent jobs', {
        jobId,
        dependentCount: dependentJobs.length
      });
      
      // Check each dependent job
      for (const depJobId of dependentJobs) {
        // Get job dependency information
        const jobInfo = await redis.hgetall(`${this.dependencyKey}:${depJobId}`);
        
        if (!jobInfo || Object.keys(jobInfo).length === 0) {
          logger.warn('Dependent job info not found', {
            jobId: depJobId,
            dependsOn: jobId
          });
          continue;
        }
        
        // Check if all dependencies are complete
        const dependencies = JSON.parse(jobInfo.dependencies || '[]');
        const status = await this.checkDependencies(dependencies);
        
        if (status.ready) {
          // All dependencies are complete, activate the job
          await this.activateJob(depJobId, jobInfo.queue);
          
          logger.info('Activated dependent job', {
            jobId: depJobId,
            queue: jobInfo.queue
          });
        } else if (status.failed > 0) {
          // At least one dependency failed, mark as failed
          await this.failJob(depJobId, jobInfo.queue, 'Failed dependency');
          
          logger.warn('Failed dependent job due to failed dependency', {
            jobId: depJobId,
            queue: jobInfo.queue,
            failedDependencies: status.failed
          });
        }
      }
    } catch (error) {
      logger.error('Error handling job completion', {
        jobId,
        success,
        error
      });
    }
  }
  
  /**
   * Handle dependency failure - marks dependent jobs as failed
   * 
   * @param jobId The failed job ID
   */
  async handleDependencyFailure(jobId: string): Promise<void> {
    try {
      // Get jobs that depend on this one
      const dependentJobs = await redis.smembers(`${this.dependencyKey}:dependent:${jobId}`);
      
      if (dependentJobs.length === 0) {
        // No dependent jobs, nothing to do
        return;
      }
      
      logger.info('Processing dependent jobs for failed job', {
        jobId,
        dependentCount: dependentJobs.length
      });
      
      // Mark each dependent job as failed
      for (const depJobId of dependentJobs) {
        // Get job dependency information
        const jobInfo = await redis.hgetall(`${this.dependencyKey}:${depJobId}`);
        
        if (!jobInfo || Object.keys(jobInfo).length === 0) {
          logger.warn('Dependent job info not found', {
            jobId: depJobId,
            dependsOn: jobId
          });
          continue;
        }
        
        // Mark job as failed
        await this.failJob(
          depJobId,
          jobInfo.queue,
          `Dependency ${jobId} failed`
        );
        
        logger.info('Failed dependent job due to failed dependency', {
          jobId: depJobId,
          queue: jobInfo.queue,
          failedDependency: jobId
        });
      }
    } catch (error) {
      logger.error('Error handling dependency failure', {
        jobId,
        error
      });
    }
  }
  
  /**
   * Activate a job that was waiting for dependencies
   * 
   * @param jobId The job ID to activate
   * @param queueName The queue name
   */
  private async activateJob(jobId: string, queueName: string): Promise<void> {
    try {
      // Get the job from the queue
      const queue = queueName as QueueName;
      const job = await jobService.getJob(queue, jobId);
      
      if (!job) {
        logger.warn('Job not found for activation', {
          jobId,
          queue
        });
        return;
      }
      
      // Promote the job to be processed immediately
      await job.promote();
      
      // Update dependency status
      await redis.hset(
        `${this.dependencyKey}:${jobId}`,
        'status', 'ready'
      );
      
      logger.info('Job promoted for processing', {
        jobId,
        queue
      });
    } catch (error) {
      logger.error('Error activating job', {
        jobId,
        queueName,
        error
      });
    }
  }
  
  /**
   * Mark a job as failed due to dependency failure
   * 
   * @param jobId The job ID to fail
   * @param queueName The queue name
   * @param reason Failure reason
   */
  private async failJob(jobId: string, queueName: string, reason: string): Promise<void> {
    try {
      // Get the job from the queue
      const queue = queueName as QueueName;
      const job = await jobService.getJob(queue, jobId);
      
      if (!job) {
        logger.warn('Job not found for failure marking', {
          jobId,
          queue
        });
        return;
      }
      
      // Move job to failed state
      await job.moveToFailed(
        new Error(`Dependency failure: ${reason}`),
        true
      );
      
      // Update dependency status
      await redis.hset(
        `${this.dependencyKey}:${jobId}`,
        'status', 'failed'
      );
      
      logger.info('Job marked as failed due to dependency', {
        jobId,
        queue,
        reason
      });
    } catch (error) {
      logger.error('Error failing job', {
        jobId,
        queueName,
        reason,
        error
      });
    }
  }
  
  /**
   * Get dependency graph for a job
   * 
   * @param rootJobId The root job ID
   * @returns Dependency graph
   */
  async getDependencyGraph(rootJobId: string): Promise<DependencyGraph> {
    try {
      // Get job info
      const jobInfo = await redis.hgetall(`${this.dependencyKey}:${rootJobId}`);
      
      if (!jobInfo || Object.keys(jobInfo).length === 0) {
        // Try to find job in queues
        const queue = await this.findJobQueue(rootJobId);
        
        if (!queue) {
          return {
            jobId: rootJobId,
            queue: 'unknown',
            status: 'unknown',
            dependencies: []
          };
        }
        
        // Get job status
        const status = await jobService.getJobStatus(queue, rootJobId);
        
        return {
          jobId: rootJobId,
          queue,
          status: status?.state || 'unknown',
          dependencies: []
        };
      }
      
      // Parse dependencies
      const dependencies = JSON.parse(jobInfo.dependencies || '[]');
      
      // Recursively build dependency graph
      const dependencyGraphs: DependencyGraph[] = [];
      
      for (const depId of dependencies) {
        const depGraph = await this.getDependencyGraph(depId);
        dependencyGraphs.push(depGraph);
      }
      
      return {
        jobId: rootJobId,
        queue: jobInfo.queue,
        status: jobInfo.status || 'unknown',
        dependencies: dependencyGraphs
      };
    } catch (error) {
      logger.error('Error getting dependency graph', {
        rootJobId,
        error
      });
      
      return {
        jobId: rootJobId,
        queue: 'unknown',
        status: 'error',
        dependencies: []
      };
    }
  }
  
  /**
   * Clean up dependency data for completed jobs
   * 
   * @param olderThan Time in milliseconds (default: 7 days)
   */
  async cleanupOldDependencies(olderThan: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      // This is a simplified approach - in production, use a more sophisticated cleanup
      // that ensures we don't delete data that's still needed
      
      // For now, we'll assume this runs periodically and only clean up completed/failed
      // dependencies that are older than the specified time
      
      logger.info('Dependency cleanup not yet implemented');
    } catch (error) {
      logger.error('Error cleaning up old dependencies', { error });
    }
  }
}

// Export singleton instance
export const dependencyService = new DependencyService();
