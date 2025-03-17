/**
 * Worker Service
 * 
 * Manages distributed worker coordination for job processing.
 */
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { 
  WorkerConfig, 
  WorkerStatus, 
  WorkerStats, 
  RebalanceResult 
} from './index';
import { logger } from '../../lib/logger';
import { redisClient } from '../../lib/redis-client';
import { getAllQueues } from '../queues';

/**
 * Worker service for distributed job processing
 */
export class WorkerService {
  private workerId: string;
  private workers: Map<string, WorkerStatus> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  
  private readonly workersKey = 'sk:workers';
  private readonly workerKeyPrefix = 'sk:worker:';
  private readonly heartbeatIntervalMs = 30 * 1000; // 30 seconds
  private readonly heartbeatTimeoutMs = 90 * 1000; // 90 seconds
  
  /**
   * Create a new worker service
   */
  constructor() {
    // Generate a unique worker ID for this instance
    this.workerId = `worker-${uuidv4()}`;
  }
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Worker service already initialized');
      return;
    }
    
    // Register this worker
    await this.registerSelf();
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Load existing workers
    await this.loadWorkers();
    
    // Clean up stale workers
    await this.cleanupStaleWorkers();
    
    this.isInitialized = true;
    logger.info('Worker service initialized', { 
      workerId: this.workerId, 
      workerCount: this.workers.size 
    });
  }
  
  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Deregister this worker
    await this.deregisterWorker(this.workerId);
    
    this.isInitialized = false;
    logger.info('Worker service shut down', { workerId: this.workerId });
  }
  
  /**
   * Register a worker
   * 
   * @param config Worker configuration
   * @returns Registered worker status
   */
  async registerWorker(config: WorkerConfig): Promise<WorkerStatus> {
    try {
      // Ensure worker ID is unique
      const existingWorker = await this.getWorker(config.id);
      
      if (existingWorker) {
        logger.warn('Worker already registered, updating configuration', { 
          workerId: config.id 
        });
      }
      
      const now = new Date();
      
      // Create worker status
      const worker: WorkerStatus = {
        id: config.id,
        queues: config.queues,
        concurrency: config.concurrency,
        activeJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        status: 'active',
        lastHeartbeat: now,
        resources: {
          memory: 0,
          cpu: 0
        },
        host: config.host || os.hostname(),
        startedAt: config.startedAt || now
      };
      
      // Save worker status
      await this.saveWorker(worker);
      
      // Update local cache
      this.workers.set(worker.id, worker);
      
      logger.info('Worker registered', { 
        workerId: worker.id, 
        queues: worker.queues.join(','), 
        concurrency: worker.concurrency 
      });
      
      return worker;
    } catch (error) {
      logger.error('Error registering worker', { error, config });
      throw error;
    }
  }
  
  /**
   * Deregister a worker
   * 
   * @param workerId Worker ID
   * @returns true if deregistered, false if not found
   */
  async deregisterWorker(workerId: string): Promise<boolean> {
    try {
      // Check if worker exists
      const worker = await this.getWorker(workerId);
      
      if (!worker) {
        logger.warn('Worker not found for deregistration', { workerId });
        return false;
      }
      
      // Delete worker from Redis
      const key = `${this.workerKeyPrefix}${workerId}`;
      await redisClient.del(key);
      
      // Remove from set of workers
      await redisClient.client.srem(this.workersKey, workerId);
      
      // Remove from local cache
      this.workers.delete(workerId);
      
      logger.info('Worker deregistered', { workerId });
      
      return true;
    } catch (error) {
      logger.error('Error deregistering worker', { error, workerId });
      return false;
    }
  }
  
  /**
   * Get active workers
   * 
   * @returns Array of active worker statuses
   */
  async getActiveWorkers(): Promise<WorkerStatus[]> {
    try {
      // Clean up stale workers first
      await this.cleanupStaleWorkers();
      
      // Return active workers from cache
      return Array.from(this.workers.values()).filter(
        worker => worker.status === 'active'
      );
    } catch (error) {
      logger.error('Error getting active workers', { error });
      return [];
    }
  }
  
  /**
   * Rebalance workers
   * 
   * @returns Rebalance result
   */
  async rebalanceWorkers(): Promise<RebalanceResult> {
    try {
      // Get active workers
      const workers = await this.getActiveWorkers();
      
      if (workers.length === 0) {
        logger.warn('No active workers to rebalance');
        return { workersRebalanced: 0, adjustments: [] };
      }
      
      // Get all queues
      const queues = getAllQueues();
      
      // Calculate adjustments
      const adjustments: {
        workerId: string;
        queue: string;
        oldConcurrency: number;
        newConcurrency: number;
      }[] = [];
      
      // Process each queue
      for (const [queueName, queue] of Object.entries(queues)) {
        // Get workers for this queue
        const queueWorkers = workers.filter(
          worker => worker.queues.includes(queueName)
        );
        
        if (queueWorkers.length === 0) {
          logger.debug(`No workers for queue "${queueName}"`);
          continue;
        }
        
        // Get queue size
        const waitingCount = await queue.getWaitingCount();
        const activeCount = await queue.getActiveCount();
        const totalJobs = waitingCount + activeCount;
        
        // Calculate total worker capacity
        const totalCapacity = queueWorkers.reduce(
          (sum, worker) => sum + worker.concurrency, 
          0
        );
        
        // Skip if no capacity
        if (totalCapacity === 0) {
          continue;
        }
        
        // Calculate jobs per capacity unit
        const jobsPerCapacityUnit = totalJobs / totalCapacity;
        
        // Calculate optimal distribution
        for (const worker of queueWorkers) {
          // Calculate optimal jobs for this worker
          const optimalJobs = Math.ceil(worker.concurrency * jobsPerCapacityUnit);
          
          // Skip if worker is already close to optimal
          if (Math.abs(worker.activeJobs - optimalJobs) <= 2) {
            continue;
          }
          
          // Calculate new concurrency
          const oldConcurrency = worker.concurrency;
          let newConcurrency = oldConcurrency;
          
          if (worker.activeJobs > optimalJobs && worker.concurrency > 1) {
            // Reduce concurrency if worker has too many jobs
            newConcurrency = Math.max(1, worker.concurrency - 1);
          } else if (worker.activeJobs < optimalJobs) {
            // Increase concurrency if worker has too few jobs
            newConcurrency = worker.concurrency + 1;
          }
          
          // Skip if no change
          if (newConcurrency === oldConcurrency) {
            continue;
          }
          
          // Add adjustment
          adjustments.push({
            workerId: worker.id,
            queue: queueName,
            oldConcurrency,
            newConcurrency
          });
          
          // Update worker concurrency
          worker.concurrency = newConcurrency;
          await this.saveWorker(worker);
        }
      }
      
      logger.info('Rebalanced workers', { 
        workersRebalanced: new Set(adjustments.map(a => a.workerId)).size, 
        adjustments: adjustments.length 
      });
      
      return {
        workersRebalanced: new Set(adjustments.map(a => a.workerId)).size,
        adjustments
      };
    } catch (error) {
      logger.error('Error rebalancing workers', { error });
      return { workersRebalanced: 0, adjustments: [] };
    }
  }
  
  /**
   * Get worker stats
   * 
   * @param workerId Worker ID
   * @returns Worker stats or null if not found
   */
  async getWorkerStats(workerId: string): Promise<WorkerStats | null> {
    try {
      // Get worker
      const worker = await this.getWorker(workerId);
      
      if (!worker) {
        logger.warn('Worker not found for stats', { workerId });
        return null;
      }
      
      // Get all queues
      const queues = Object.entries(getAllQueues()).filter(
        ([name]) => worker.queues.includes(name)
      );
      
      // Get queue stats
      const queueStats = await Promise.all(
        queues.map(async ([name, queue]) => {
          const [active, completed, failed] = await Promise.all([
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount()
          ]);
          
          return {
            queue: name,
            active,
            completed,
            failed
          };
        })
      );
      
      // Calculate throughput (completed jobs per minute)
      // Note: This is a simplified calculation - in a real system,
      // we would track completed jobs over time
      const throughput = worker.completedJobs / 
        (Math.max(1, (Date.now() - worker.startedAt.getTime()) / (60 * 1000)));
      
      // Calculate error rate
      const totalJobs = worker.completedJobs + worker.failedJobs;
      const errorRate = totalJobs > 0 ? (worker.failedJobs / totalJobs) * 100 : 0;
      
      // Calculate average processing time
      // Note: This is a placeholder - in a real system,
      // we would track processing times for jobs
      const averageProcessingTime = 0;
      
      return {
        id: worker.id,
        activeJobs: worker.activeJobs,
        completedJobs: worker.completedJobs,
        failedJobs: worker.failedJobs,
        throughput,
        averageProcessingTime,
        errorRate,
        resourceUtilization: worker.resources,
        queueStats
      };
    } catch (error) {
      logger.error('Error getting worker stats', { error, workerId });
      return null;
    }
  }
  
  /**
   * Get a worker by ID
   * 
   * @param workerId Worker ID
   * @returns Worker status or null if not found
   */
  private async getWorker(workerId: string): Promise<WorkerStatus | null> {
    try {
      // Check cache first
      if (this.workers.has(workerId)) {
        return this.workers.get(workerId) || null;
      }
      
      // Get from Redis
      const key = `${this.workerKeyPrefix}${workerId}`;
      const data = await redisClient.get(key);
      
      if (!data) {
        return null;
      }
      
      // Parse worker data
      const worker = JSON.parse(data) as WorkerStatus;
      
      // Convert date strings to Date objects
      worker.lastHeartbeat = new Date(worker.lastHeartbeat);
      worker.startedAt = new Date(worker.startedAt);
      
      // Update cache
      this.workers.set(workerId, worker);
      
      return worker;
    } catch (error) {
      logger.error('Error getting worker', { error, workerId });
      return null;
    }
  }
  
  /**
   * Save a worker
   * 
   * @param worker Worker status to save
   */
  private async saveWorker(worker: WorkerStatus): Promise<void> {
    try {
      // Save to Redis
      const key = `${this.workerKeyPrefix}${worker.id}`;
      await redisClient.set(key, JSON.stringify(worker));
      
      // Add to set of workers
      await redisClient.client.sadd(this.workersKey, worker.id);
      
      // Update cache
      this.workers.set(worker.id, worker);
    } catch (error) {
      logger.error('Error saving worker', { error, workerId: worker.id });
      throw error;
    }
  }
  
  /**
   * Register this worker
   */
  private async registerSelf(): Promise<void> {
    // Default configuration for this worker
    const config: WorkerConfig = {
      id: this.workerId,
      queues: Object.keys(getAllQueues()),
      concurrency: Math.max(1, Math.floor(os.cpus().length / 2)),
      host: os.hostname(),
      startedAt: new Date()
    };
    
    await this.registerWorker(config);
  }
  
  /**
   * Start worker heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(
      async () => {
        try {
          await this.sendHeartbeat();
        } catch (error) {
          logger.error('Error sending heartbeat', { error });
        }
      },
      this.heartbeatIntervalMs
    );
  }
  
  /**
   * Send worker heartbeat
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      // Get worker
      const worker = await this.getWorker(this.workerId);
      
      if (!worker) {
        logger.warn('Worker not found for heartbeat', { workerId: this.workerId });
        // Re-register self
        await this.registerSelf();
        return;
      }
      
      // Update last heartbeat
      worker.lastHeartbeat = new Date();
      
      // Update resource usage
      worker.resources = {
        memory: this.getMemoryUsage(),
        cpu: this.getCpuUsage()
      };
      
      // Update job counts
      worker.activeJobs = this.getActiveJobCount();
      
      // Save updated worker
      await this.saveWorker(worker);
      
      logger.debug('Sent worker heartbeat', { 
        workerId: this.workerId, 
        resources: worker.resources,
        activeJobs: worker.activeJobs
      });
    } catch (error) {
      logger.error('Error sending heartbeat', { error, workerId: this.workerId });
    }
  }
  
  /**
   * Load all workers from storage
   */
  private async loadWorkers(): Promise<void> {
    try {
      // Get all worker IDs
      const workerIds = await redisClient.client.smembers(this.workersKey);
      
      // Load each worker
      for (const workerId of workerIds) {
        const worker = await this.getWorker(workerId);
        
        if (worker) {
          this.workers.set(workerId, worker);
        }
      }
      
      logger.debug('Loaded workers', { count: this.workers.size });
    } catch (error) {
      logger.error('Error loading workers', { error });
    }
  }
  
  /**
   * Clean up stale workers
   */
  private async cleanupStaleWorkers(): Promise<void> {
    try {
      // Get all workers
      const workerIds = await redisClient.client.smembers(this.workersKey);
      
      let staleCount = 0;
      
      // Check each worker
      for (const workerId of workerIds) {
        const worker = await this.getWorker(workerId);
        
        if (!worker) {
          continue;
        }
        
        // Check if worker is stale
        const lastHeartbeat = worker.lastHeartbeat.getTime();
        const now = Date.now();
        
        if (now - lastHeartbeat > this.heartbeatTimeoutMs) {
          // Worker is stale, deregister it
          await this.deregisterWorker(workerId);
          staleCount++;
        }
      }
      
      if (staleCount > 0) {
        logger.info('Cleaned up stale workers', { count: staleCount });
      }
    } catch (error) {
      logger.error('Error cleaning up stale workers', { error });
    }
  }
  
  /**
   * Get memory usage percentage
   * 
   * @returns Memory usage percentage (0-100)
   */
  private getMemoryUsage(): number {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    return Math.round((usedMemory / totalMemory) * 100);
  }
  
  /**
   * Get CPU usage percentage
   * 
   * @returns CPU usage percentage (0-100)
   */
  private getCpuUsage(): number {
    // This is a simplified implementation - in a real system,
    // we would track CPU usage over time
    return Math.round(Math.random() * 30) + 10; // Random value between 10-40%
  }
  
  /**
   * Get active job count
   * 
   * @returns Number of active jobs
   */
  private getActiveJobCount(): number {
    // This is a simplified implementation - in a real system,
    // we would track actual job counts
    return Math.round(Math.random() * 5); // Random value between 0-5
  }
}
