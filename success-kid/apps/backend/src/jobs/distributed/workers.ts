/**
 * Distributed Worker Management
 * 
 * Manages workers across multiple instances
 */
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';
import { QueueName } from '../queues';

/**
 * Worker configuration interface
 */
export interface WorkerConfig {
  id: string;
  queues: string[];
  concurrency: number;
  maxMemory?: number;
  maxCpu?: number;
}

/**
 * Worker status interface
 */
export interface WorkerStatus {
  id: string;
  hostname: string;
  pid: number;
  queues: string[];
  concurrency: number;
  activeJobs: number;
  processedJobs: number;
  failedJobs: number;
  memory: {
    used: number;
    total: number;
  };
  cpu: number;
  lastHeartbeat: Date;
  status: 'active' | 'idle' | 'offline';
}

/**
 * Worker statistics interface
 */
export interface WorkerStats {
  id: string;
  memory: {
    used: number;
    free: number;
    total: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  load: number[];
  uptime: number;
  processedJobs: {
    total: number;
    lastHour: number;
    byQueue: Record<string, number>;
  };
}

/**
 * Rebalance result interface
 */
export interface RebalanceResult {
  adjustedWorkers: number;
  totalWorkers: number;
  adjustments: Array<{
    workerId: string;
    oldConcurrency: number;
    newConcurrency: number;
  }>;
}

/**
 * Service for managing distributed workers
 */
export class WorkerService {
  private readonly workerKey = 'job:workers';
  private readonly heartbeatInterval = 10000; // 10 seconds
  private readonly offlineThreshold = 30000; // 30 seconds without heartbeat = offline
  private readonly workerId: string;
  private readonly hostname: string;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private stats: WorkerStats;
  
  constructor() {
    // Generate a unique worker ID
    this.workerId = process.env.WORKER_ID || uuidv4();
    this.hostname = os.hostname();
    
    // Initialize stats
    this.stats = this.initializeStats();
  }
  
  /**
   * Initialize worker stats
   * 
   * @returns Initial worker stats
   */
  private initializeStats(): WorkerStats {
    return {
      id: this.workerId,
      memory: {
        used: process.memoryUsage().rss / (1024 * 1024), // MB
        free: os.freemem() / (1024 * 1024), // MB
        total: os.totalmem() / (1024 * 1024) // MB
      },
      cpu: {
        usage: 0, // Will be updated later
        cores: os.cpus().length
      },
      load: os.loadavg(),
      uptime: process.uptime(),
      processedJobs: {
        total: 0,
        lastHour: 0,
        byQueue: Object.values(QueueName).reduce((acc, queue) => {
          acc[queue] = 0;
          return acc;
        }, {} as Record<string, number>)
      }
    };
  }
  
  /**
   * Register this worker
   * 
   * @param config Worker configuration
   */
  async registerWorker(config: WorkerConfig): Promise<void> {
    try {
      // Set worker configuration
      const workerInfo = {
        id: this.workerId,
        hostname: this.hostname,
        pid: process.pid,
        queues: config.queues,
        concurrency: config.concurrency,
        maxMemory: config.maxMemory,
        maxCpu: config.maxCpu,
        activeJobs: 0,
        processedJobs: 0,
        failedJobs: 0,
        lastHeartbeat: new Date().toISOString(),
        status: 'active',
        startedAt: new Date().toISOString()
      };
      
      // Store worker information in Redis
      await redis.hset(
        `${this.workerKey}:${this.workerId}`,
        'info', JSON.stringify(workerInfo)
      );
      
      // Add to worker registry
      await redis.sadd(this.workerKey, this.workerId);
      
      // Start heartbeat
      this.startHeartbeat();
      
      logger.info('Worker registered', {
        workerId: this.workerId,
        hostname: this.hostname,
        pid: process.pid,
        queues: config.queues,
        concurrency: config.concurrency
      });
    } catch (error) {
      logger.error('Error registering worker', {
        workerId: this.workerId,
        error
      });
      throw error;
    }
  }
  
  /**
   * Deregister this worker
   */
  async deregisterWorker(): Promise<void> {
    try {
      // Stop heartbeat
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      
      // Remove from worker registry
      await redis.srem(this.workerKey, this.workerId);
      
      // Remove worker information
      await redis.del(`${this.workerKey}:${this.workerId}`);
      
      logger.info('Worker deregistered', {
        workerId: this.workerId
      });
    } catch (error) {
      logger.error('Error deregistering worker', {
        workerId: this.workerId,
        error
      });
    }
  }
  
  /**
   * Start worker heartbeat
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(
      async () => this.sendHeartbeat(),
      this.heartbeatInterval
    );
    
    logger.debug('Worker heartbeat started', {
      workerId: this.workerId,
      interval: this.heartbeatInterval
    });
  }
  
  /**
   * Send worker heartbeat
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      // Update worker stats
      this.updateStats();
      
      // Get worker info
      const workerInfoJson = await redis.hget(
        `${this.workerKey}:${this.workerId}`,
        'info'
      );
      
      if (!workerInfoJson) {
        logger.warn('Worker info not found during heartbeat', {
          workerId: this.workerId
        });
        return;
      }
      
      // Parse worker info
      const workerInfo = JSON.parse(workerInfoJson);
      
      // Update heartbeat timestamp
      workerInfo.lastHeartbeat = new Date().toISOString();
      
      // Update system stats
      workerInfo.memory = this.stats.memory;
      workerInfo.cpu = this.stats.cpu.usage;
      
      // Update worker info in Redis
      await redis.hset(
        `${this.workerKey}:${this.workerId}`,
        'info', JSON.stringify(workerInfo),
        'stats', JSON.stringify(this.stats)
      );
      
      logger.debug('Worker heartbeat sent', {
        workerId: this.workerId
      });
    } catch (error) {
      logger.error('Error sending worker heartbeat', {
        workerId: this.workerId,
        error
      });
    }
  }
  
  /**
   * Update worker stats
   */
  private updateStats(): void {
    // Update memory usage
    this.stats.memory = {
      used: process.memoryUsage().rss / (1024 * 1024), // MB
      free: os.freemem() / (1024 * 1024), // MB
      total: os.totalmem() / (1024 * 1024) // MB
    };
    
    // Update CPU usage (simple approximation)
    const cpuUsage = process.cpuUsage();
    this.stats.cpu.usage = (cpuUsage.user + cpuUsage.system) / 1000000; // Seconds
    
    // Update load average
    this.stats.load = os.loadavg();
    
    // Update uptime
    this.stats.uptime = process.uptime();
  }
  
  /**
   * Record a processed job
   * 
   * @param queue Queue name
   */
  async recordProcessedJob(queue: string): Promise<void> {
    try {
      // Update local stats
      this.stats.processedJobs.total++;
      this.stats.processedJobs.lastHour++;
      this.stats.processedJobs.byQueue[queue] = 
        (this.stats.processedJobs.byQueue[queue] || 0) + 1;
      
      // Get worker info
      const workerInfoJson = await redis.hget(
        `${this.workerKey}:${this.workerId}`,
        'info'
      );
      
      if (!workerInfoJson) {
        logger.warn('Worker info not found when recording processed job', {
          workerId: this.workerId,
          queue
        });
        return;
      }
      
      // Parse worker info
      const workerInfo = JSON.parse(workerInfoJson);
      
      // Update processed jobs count
      workerInfo.processedJobs++;
      workerInfo.activeJobs = Math.max(0, workerInfo.activeJobs - 1);
      
      // Update worker info in Redis
      await redis.hset(
        `${this.workerKey}:${this.workerId}`,
        'info', JSON.stringify(workerInfo)
      );
      
      logger.debug('Recorded processed job', {
        workerId: this.workerId,
        queue,
        totalProcessed: workerInfo.processedJobs
      });
    } catch (error) {
      logger.error('Error recording processed job', {
        workerId: this.workerId,
        queue,
        error
      });
    }
  }
  
  /**
   * Record a failed job
   * 
   * @param queue Queue name
   */
  async recordFailedJob(queue: string): Promise<void> {
    try {
      // Get worker info
      const workerInfoJson = await redis.hget(
        `${this.workerKey}:${this.workerId}`,
        'info'
      );
      
      if (!workerInfoJson) {
        logger.warn('Worker info not found when recording failed job', {
          workerId: this.workerId,
          queue
        });
        return;
      }
      
      // Parse worker info
      const workerInfo = JSON.parse(workerInfoJson);
      
      // Update failed jobs count
      workerInfo.failedJobs++;
      workerInfo.activeJobs = Math.max(0, workerInfo.activeJobs - 1);
      
      // Update worker info in Redis
      await redis.hset(
        `${this.workerKey}:${this.workerId}`,
        'info', JSON.stringify(workerInfo)
      );
      
      logger.debug('Recorded failed job', {
        workerId: this.workerId,
        queue,
        totalFailed: workerInfo.failedJobs
      });
    } catch (error) {
      logger.error('Error recording failed job', {
        workerId: this.workerId,
        queue,
        error
      });
    }
  }
  
  /**
   * Record an active job
   * 
   * @param queue Queue name
   */
  async recordActiveJob(queue: string): Promise<void> {
    try {
      // Get worker info
      const workerInfoJson = await redis.hget(
        `${this.workerKey}:${this.workerId}`,
        'info'
      );
      
      if (!workerInfoJson) {
        logger.warn('Worker info not found when recording active job', {
          workerId: this.workerId,
          queue
        });
        return;
      }
      
      // Parse worker info
      const workerInfo = JSON.parse(workerInfoJson);
      
      // Update active jobs count
      workerInfo.activeJobs++;
      
      // Update status
      workerInfo.status = workerInfo.activeJobs > 0 ? 'active' : 'idle';
      
      // Update worker info in Redis
      await redis.hset(
        `${this.workerKey}:${this.workerId}`,
        'info', JSON.stringify(workerInfo)
      );
      
      logger.debug('Recorded active job', {
        workerId: this.workerId,
        queue,
        activeJobs: workerInfo.activeJobs
      });
    } catch (error) {
      logger.error('Error recording active job', {
        workerId: this.workerId,
        queue,
        error
      });
    }
  }
  
  /**
   * Get active workers
   * 
   * @returns List of active worker statuses
   */
  async getActiveWorkers(): Promise<WorkerStatus[]> {
    try {
      // Get all worker IDs
      const workerIds = await redis.smembers(this.workerKey);
      
      if (workerIds.length === 0) {
        return [];
      }
      
      const now = Date.now();
      const workers: WorkerStatus[] = [];
      
      // Get info for each worker
      for (const workerId of workerIds) {
        const workerInfoJson = await redis.hget(
          `${this.workerKey}:${workerId}`,
          'info'
        );
        
        if (!workerInfoJson) {
          continue;
        }
        
        // Parse worker info
        const workerInfo = JSON.parse(workerInfoJson);
        
        // Check if worker is offline
        const lastHeartbeat = new Date(workerInfo.lastHeartbeat).getTime();
        const isOffline = now - lastHeartbeat > this.offlineThreshold;
        
        // Add worker to list
        workers.push({
          id: workerId,
          hostname: workerInfo.hostname,
          pid: workerInfo.pid,
          queues: workerInfo.queues,
          concurrency: workerInfo.concurrency,
          activeJobs: workerInfo.activeJobs,
          processedJobs: workerInfo.processedJobs,
          failedJobs: workerInfo.failedJobs,
          memory: workerInfo.memory || { used: 0, total: 0 },
          cpu: workerInfo.cpu || 0,
          lastHeartbeat: new Date(workerInfo.lastHeartbeat),
          status: isOffline ? 'offline' : workerInfo.status
        });
      }
      
      return workers;
    } catch (error) {
      logger.error('Error getting active workers', { error });
      return [];
    }
  }
  
  /**
   * Rebalance workers based on load
   * 
   * @returns Rebalance result
   */
  async rebalanceWorkers(): Promise<RebalanceResult> {
    try {
      // Get active workers
      const workers = await this.getActiveWorkers();
      
      // Filter to only active (non-offline) workers
      const activeWorkers = workers.filter(w => w.status !== 'offline');
      
      if (activeWorkers.length === 0) {
        return {
          adjustedWorkers: 0,
          totalWorkers: 0,
          adjustments: []
        };
      }
      
      // Calculate load distribution
      const totalConcurrency = activeWorkers.reduce(
        (sum, w) => sum + w.concurrency,
        0
      );
      
      const totalActiveJobs = activeWorkers.reduce(
        (sum, w) => sum + w.activeJobs,
        0
      );
      
      const optimalDistribution = activeWorkers.map(worker => {
        const optimalActive = Math.ceil(
          (worker.concurrency / totalConcurrency) * totalActiveJobs
        );
        
        return {
          workerId: worker.id,
          currentActive: worker.activeJobs,
          optimalActive,
          currentConcurrency: worker.concurrency,
          adjustment: Math.abs(worker.activeJobs - optimalActive) > 2 // Threshold for adjustment
        };
      });
      
      // Make concurrency adjustments
      const adjustments: Array<{
        workerId: string;
        oldConcurrency: number;
        newConcurrency: number;
      }> = [];
      
      for (const worker of optimalDistribution) {
        if (worker.adjustment) {
          // Calculate new concurrency
          const targetLoad = 0.7; // Target 70% load
          const currentLoad = worker.currentActive / worker.currentConcurrency;
          
          let newConcurrency = worker.currentConcurrency;
          
          if (currentLoad > targetLoad * 1.2) {
            // Increase concurrency
            newConcurrency = Math.ceil(worker.currentConcurrency * 1.2);
          } else if (currentLoad < targetLoad * 0.8) {
            // Decrease concurrency
            newConcurrency = Math.max(
              1,
              Math.floor(worker.currentConcurrency * 0.8)
            );
          }
          
          if (newConcurrency !== worker.currentConcurrency) {
            // Update concurrency
            await this.adjustWorkerConcurrency(
              worker.workerId,
              newConcurrency
            );
            
            adjustments.push({
              workerId: worker.workerId,
              oldConcurrency: worker.currentConcurrency,
              newConcurrency
            });
          }
        }
      }
      
      return {
        adjustedWorkers: adjustments.length,
        totalWorkers: activeWorkers.length,
        adjustments
      };
    } catch (error) {
      logger.error('Error rebalancing workers', { error });
      
      return {
        adjustedWorkers: 0,
        totalWorkers: 0,
        adjustments: []
      };
    }
  }
  
  /**
   * Adjust worker concurrency
   * 
   * @param workerId Worker ID
   * @param concurrency New concurrency
   */
  private async adjustWorkerConcurrency(
    workerId: string,
    concurrency: number
  ): Promise<void> {
    try {
      // Get worker info
      const workerInfoJson = await redis.hget(
        `${this.workerKey}:${workerId}`,
        'info'
      );
      
      if (!workerInfoJson) {
        logger.warn('Worker info not found when adjusting concurrency', {
          workerId
        });
        return;
      }
      
      // Parse worker info
      const workerInfo = JSON.parse(workerInfoJson);
      
      // Update concurrency
      const oldConcurrency = workerInfo.concurrency;
      workerInfo.concurrency = concurrency;
      
      // Update worker info in Redis
      await redis.hset(
        `${this.workerKey}:${workerId}`,
        'info', JSON.stringify(workerInfo)
      );
      
      logger.info('Adjusted worker concurrency', {
        workerId,
        oldConcurrency,
        newConcurrency: concurrency
      });
      
      // If this is the current worker, apply the concurrency change
      if (workerId === this.workerId) {
        // TODO: Actually update Bull queue concurrency
        // This would require modifying the queue settings at runtime
        // For now, this is just tracking the concurrency
        
        logger.info('Updated local worker concurrency', {
          workerId: this.workerId,
          concurrency
        });
      }
    } catch (error) {
      logger.error('Error adjusting worker concurrency', {
        workerId,
        concurrency,
        error
      });
    }
  }
  
  /**
   * Get worker statistics
   * 
   * @param workerId Worker ID
   * @returns Worker statistics
   */
  async getWorkerStats(workerId: string): Promise<WorkerStats | null> {
    try {
      // Get worker stats
      const workerStatsJson = await redis.hget(
        `${this.workerKey}:${workerId}`,
        'stats'
      );
      
      if (!workerStatsJson) {
        return null;
      }
      
      // Parse worker stats
      return JSON.parse(workerStatsJson);
    } catch (error) {
      logger.error('Error getting worker stats', {
        workerId,
        error
      });
      return null;
    }
  }
  
  /**
   * Clean up offline workers
   * 
   * @returns Number of workers cleaned up
   */
  async cleanupOfflineWorkers(): Promise<number> {
    try {
      // Get all worker IDs
      const workerIds = await redis.smembers(this.workerKey);
      
      if (workerIds.length === 0) {
        return 0;
      }
      
      const now = Date.now();
      let cleanedUp = 0;
      
      // Check each worker
      for (const workerId of workerIds) {
        const workerInfoJson = await redis.hget(
          `${this.workerKey}:${workerId}`,
          'info'
        );
        
        if (!workerInfoJson) {
          // Worker info missing, remove from registry
          await redis.srem(this.workerKey, workerId);
          cleanedUp++;
          continue;
        }
        
        // Parse worker info
        const workerInfo = JSON.parse(workerInfoJson);
        
        // Check if worker is offline
        const lastHeartbeat = new Date(workerInfo.lastHeartbeat).getTime();
        const isOffline = now - lastHeartbeat > this.offlineThreshold * 3; // 3x threshold for cleanup
        
        if (isOffline) {
          // Worker is offline, remove from registry
          await redis.srem(this.workerKey, workerId);
          await redis.del(`${this.workerKey}:${workerId}`);
          cleanedUp++;
          
          logger.info('Cleaned up offline worker', {
            workerId,
            lastHeartbeat: new Date(workerInfo.lastHeartbeat),
            timeSinceHeartbeat: now - lastHeartbeat
          });
        }
      }
      
      return cleanedUp;
    } catch (error) {
      logger.error('Error cleaning up offline workers', { error });
      return 0;
    }
  }
}

// Export singleton instance
export const workerService = new WorkerService();
