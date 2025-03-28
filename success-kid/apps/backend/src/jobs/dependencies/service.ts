/**
 * Dependency Service
 * 
 * Manages dependencies between jobs.
 */
import { Job } from 'bull';
import { logger } from '../../lib/logger';
import { redisClient } from '../../lib/redis-client';
import { 
  JobDependency, 
  DependencyStatus, 
  DependencyGraph, 
  JobNode 
} from './index';
import { getQueue } from '../queues';
import { addJob } from '../utils/queue-utils';

/**
 * Dependency service for managing job dependencies
 */
export class DependencyService {
  private readonly dependencyKeyPrefix = 'sk:job_dependencies:';
  
  /**
   * Create a new dependency service
   */
  constructor() {}
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // Register event handlers
    this.registerEventHandlers();
    
    logger.info('Dependency service initialized');
  }
  
  /**
   * Add a job with dependencies
   * 
   * @param queue Queue name
   * @param name Job name
   * @param data Job data
   * @param dependencies Array of job IDs this job depends on
   * @param options Job options
   * @returns Created job
   */
  async addJobWithDependencies(
    queue: string,
    name: string,
    data: any,
    dependencies: string[],
    options?: any
  ): Promise<Job> {
    try {
      // Validate dependencies
      if (!Array.isArray(dependencies)) {
        throw new Error('Dependencies must be an array');
      }
      
      // Create the job (but it won't start processing until dependencies are met)
      const job = await addJob(queue, name, data, {
        ...options,
        // Delay job until we explicitly promote it
        delay: options?.delay || 999999999,
      });
      
      // If no dependencies, promote the job immediately
      if (dependencies.length === 0) {
        await job.promote();
        return job;
      }
      
      // Save dependency information
      const dependency: JobDependency = {
        jobId: job.id,
        dependsOn: dependencies,
        status: 'pending'
      };
      
      await this.saveJobDependency(dependency);
      
      // Check if dependencies are already met
      const status = await this.checkDependencies(job.id);
      
      // If dependencies are met, promote the job
      if (status.ready) {
        await job.promote();
        logger.debug('Job dependencies already met, promoted job', { 
          jobId: job.id, 
          queue, 
          name 
        });
      } else {
        logger.debug('Job waiting for dependencies', { 
          jobId: job.id, 
          queue, 
          name, 
          pending: status.pending, 
          failed: status.failed 
        });
      }
      
      return job;
    } catch (error) {
      logger.error('Error adding job with dependencies', { 
        error, 
        queue, 
        name, 
        dependencies 
      });
      throw error;
    }
  }
  
  /**
   * Check if dependencies for a job are met
   * 
   * @param jobId Job ID
   * @returns Dependency status
   */
  async checkDependencies(jobId: string): Promise<DependencyStatus> {
    try {
      // Get job dependency
      const dependency = await this.getJobDependency(jobId);
      
      if (!dependency) {
        // No dependencies defined, so it's ready
        return { ready: true, pending: 0, failed: 0 };
      }
      
      // Check status of each dependency
      const statuses = await Promise.all(
        dependency.dependsOn.map(depJobId => this.getJobStatus(depJobId))
      );
      
      // Count pending and failed dependencies
      const pending = statuses.filter(s => s !== 'completed').length;
      const failed = statuses.filter(s => s === 'failed').length;
      
      // If any dependencies failed, mark this dependency as failed
      if (failed > 0 && dependency.status !== 'failed') {
        await this.updateDependencyStatus(jobId, 'failed');
      }
      // If all dependencies completed, mark this dependency as ready
      else if (pending === 0 && dependency.status !== 'ready') {
        await this.updateDependencyStatus(jobId, 'ready');
      }
      
      // Return dependency status
      return { 
        ready: pending === 0 && failed === 0, 
        pending, 
        failed 
      };
    } catch (error) {
      logger.error('Error checking dependencies', { error, jobId });
      
      // Assume not ready on error
      return { ready: false, pending: 1, failed: 0 };
    }
  }
  
  /**
   * Handle dependency failure
   * 
   * @param jobId Job ID that failed
   */
  async handleDependencyFailure(jobId: string): Promise<void> {
    try {
      // Find all jobs that depend on this job
      const dependentJobs = await this.findJobsDependingOn(jobId);
      
      // Update status for each dependent job
      for (const depJobId of dependentJobs) {
        // Mark dependency as failed
        await this.updateDependencyStatus(depJobId, 'failed');
        
        // Get the job
        const dependency = await this.getJobDependency(depJobId);
        
        if (!dependency) {
          continue;
        }
        
        // Find the queue for this job
        // This is a simplified approach - in a real system, we'd store the queue name with the dependency
        const queue = await this.findJobQueue(depJobId);
        
        if (!queue) {
          logger.warn('Could not find queue for job', { jobId: depJobId });
          continue;
        }
        
        // Get the job
        const job = await queue.getJob(depJobId);
        
        if (!job) {
          logger.warn('Could not find job', { jobId: depJobId });
          continue;
        }
        
        // Move the job to the failed state
        await job.moveToFailed(
          new Error(`Dependency failed: ${jobId}`),
          true // remove job
        );
        
        logger.info('Marked job as failed due to dependency failure', { 
          jobId: depJobId, 
          dependencyId: jobId 
        });
        
        // Recursively handle downstream dependencies
        await this.handleDependencyFailure(depJobId);
      }
    } catch (error) {
      logger.error('Error handling dependency failure', { error, jobId });
    }
  }
  
  /**
   * Get the dependency graph for a job
   * 
   * @param rootJobId Root job ID
   * @returns Dependency graph
   */
  async getDependencyGraph(rootJobId: string): Promise<DependencyGraph> {
    try {
      // Get the job tree
      const rootNode = await this.buildJobTree(rootJobId);
      
      // Convert tree to graph
      const graph: DependencyGraph = {
        nodes: [],
        edges: []
      };
      
      // Helper function to add nodes and edges to graph
      const addToGraph = (node: JobNode) => {
        // Add node
        graph.nodes.push({
          id: node.id,
          queue: node.queue,
          name: node.name,
          status: node.status
        });
        
        // Add edges from this node to its children
        for (const child of node.children) {
          graph.edges.push({
            source: node.id,
            target: child.id
          });
          
          // Recursively process child
          addToGraph(child);
        }
      };
      
      // Process the root node
      addToGraph(rootNode);
      
      return graph;
    } catch (error) {
      logger.error('Error getting dependency graph', { error, rootJobId });
      
      // Return empty graph on error
      return { nodes: [], edges: [] };
    }
  }
  
  /**
   * Get a job dependency
   * 
   * @param jobId Job ID
   * @returns Job dependency or null if not found
   */
  async getJobDependency(jobId: string): Promise<JobDependency | null> {
    try {
      const key = `${this.dependencyKeyPrefix}${jobId}`;
      const data = await redisClient.get(key);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data) as JobDependency;
    } catch (error) {
      logger.error('Error getting job dependency', { error, jobId });
      return null;
    }
  }
  
  /**
   * Build a job tree
   * 
   * @param rootJobId Root job ID
   * @returns Job tree
   */
  private async buildJobTree(rootJobId: string): Promise<JobNode> {
    // Get job details
    const queue = await this.findJobQueue(rootJobId);
    
    if (!queue) {
      // Job not found, return placeholder node
      return {
        id: rootJobId,
        queue: 'unknown',
        name: 'unknown',
        status: 'unknown',
        children: []
      };
    }
    
    const job = await queue.getJob(rootJobId);
    
    if (!job) {
      // Job not found, return placeholder node
      return {
        id: rootJobId,
        queue: queue.name,
        name: 'unknown',
        status: 'unknown',
        children: []
      };
    }
    
    // Get job status
    const status = await job.getState();
    
    // Get job dependencies
    const dependency = await this.getJobDependency(rootJobId);
    
    // Create node
    const node: JobNode = {
      id: rootJobId,
      queue: queue.name,
      name: job.name,
      status,
      children: []
    };
    
    // Add dependencies as children
    if (dependency) {
      for (const depJobId of dependency.dependsOn) {
        const childNode = await this.buildJobTree(depJobId);
        node.children.push(childNode);
      }
    }
    
    return node;
  }
  
  /**
   * Get the status of a job
   * 
   * @param jobId Job ID
   * @returns Job status
   */
  private async getJobStatus(jobId: string): Promise<string> {
    try {
      // Find the queue for this job
      const queue = await this.findJobQueue(jobId);
      
      if (!queue) {
        return 'unknown';
      }
      
      // Get the job
      const job = await queue.getJob(jobId);
      
      if (!job) {
        return 'unknown';
      }
      
      // Get job state
      return job.getState();
    } catch (error) {
      logger.error('Error getting job status', { error, jobId });
      return 'unknown';
    }
  }
  
  /**
   * Find the queue for a job
   * 
   * @param jobId Job ID
   * @returns Queue or null if not found
   */
  private async findJobQueue(jobId: string): Promise<Bull.Queue | null> {
    // Get all queues
    const queues = Object.values(getQueue());
    
    // Check each queue for the job
    for (const queue of queues) {
      const job = await queue.getJob(jobId);
      
      if (job) {
        return queue;
      }
    }
    
    return null;
  }
  
  /**
   * Save a job dependency
   * 
   * @param dependency Job dependency
   */
  private async saveJobDependency(dependency: JobDependency): Promise<void> {
    try {
      const key = `${this.dependencyKeyPrefix}${dependency.jobId}`;
      await redisClient.set(key, JSON.stringify(dependency));
      
      // Also save reverse mappings for efficient lookup
      for (const depJobId of dependency.dependsOn) {
        const depKey = `${this.dependencyKeyPrefix}depends:${depJobId}`;
        await redisClient.sadd(depKey, dependency.jobId);
      }
      
      logger.debug('Saved job dependency', { 
        jobId: dependency.jobId, 
        dependsOn: dependency.dependsOn, 
        status: dependency.status 
      });
    } catch (error) {
      logger.error('Error saving job dependency', { 
        error, 
        jobId: dependency.jobId 
      });
      throw error;
    }
  }
  
  /**
   * Update a job dependency status
   * 
   * @param jobId Job ID
   * @param status New status
   */
  private async updateDependencyStatus(
    jobId: string, 
    status: 'pending' | 'ready' | 'failed'
  ): Promise<void> {
    try {
      // Get current dependency
      const dependency = await this.getJobDependency(jobId);
      
      if (!dependency) {
        logger.warn('Could not find dependency to update status', { jobId });
        return;
      }
      
      // Update status
      dependency.status = status;
      
      // Save updated dependency
      const key = `${this.dependencyKeyPrefix}${jobId}`;
      await redisClient.set(key, JSON.stringify(dependency));
      
      logger.debug('Updated job dependency status', { 
        jobId, 
        status, 
        dependsOn: dependency.dependsOn 
      });
      
      // If status is ready, promote the job
      if (status === 'ready') {
        // Find the queue
        const queue = await this.findJobQueue(jobId);
        
        if (queue) {
          const job = await queue.getJob(jobId);
          
          if (job) {
            await job.promote();
            logger.debug('Promoted job after dependencies met', { jobId });
          }
        }
      }
    } catch (error) {
      logger.error('Error updating job dependency status', { 
        error, 
        jobId, 
        status 
      });
    }
  }
  
  /**
   * Find jobs that depend on a given job
   * 
   * @param jobId Job ID
   * @returns Array of job IDs that depend on this job
   */
  private async findJobsDependingOn(jobId: string): Promise<string[]> {
    try {
      const key = `${this.dependencyKeyPrefix}depends:${jobId}`;
      return await redisClient.smembers(key);
    } catch (error) {
      logger.error('Error finding jobs depending on job', { error, jobId });
      return [];
    }
  }
  
  /**
   * Register event handlers
   */
  private registerEventHandlers(): void {
    // Get all queues
    const queues = Object.values(getQueue());
    
    // Register handlers for each queue
    for (const queue of queues) {
      // Job completed
      queue.on('completed', async (job) => {
        // Check if any jobs depend on this job
        const dependentJobs = await this.findJobsDependingOn(job.id.toString());
        
        // Update dependents
        for (const depJobId of dependentJobs) {
          await this.checkDependencies(depJobId);
        }
      });
      
      // Job failed
      queue.on('failed', async (job) => {
        // Handle dependency failure
        await this.handleDependencyFailure(job.id.toString());
      });
    }
  }
}
