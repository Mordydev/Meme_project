/**
 * Distributed Job Processing
 * 
 * Manages distributed worker coordination for job processing.
 */
import { logger } from '../../lib/logger';
import { WorkerService } from './service';

// Singleton service instance
let workerService: WorkerService | null = null;

/**
 * Get the worker service
 * @returns Worker service instance
 */
export function getWorkerService(): WorkerService {
  if (!workerService) {
    workerService = new WorkerService();
  }
  return workerService;
}

/**
 * Initialize the distributed worker system
 */
export async function initializeWorkerSystem(): Promise<void> {
  try {
    const worker = getWorkerService();
    await worker.initialize();
    logger.info('Distributed worker system initialized');
  } catch (error) {
    logger.error('Failed to initialize distributed worker system', { error });
    throw error;
  }
}

/**
 * Shutdown the distributed worker system
 */
export async function shutdownWorkerSystem(): Promise<void> {
  try {
    if (workerService) {
      await workerService.shutdown();
      logger.info('Distributed worker system shut down');
    }
  } catch (error) {
    logger.error('Failed to shut down distributed worker system', { error });
  }
}

// Export operations
export const registerWorker = (config: WorkerConfig) => 
  getWorkerService().registerWorker(config);

export const deregisterWorker = (workerId: string) => 
  getWorkerService().deregisterWorker(workerId);

export const getActiveWorkers = () => 
  getWorkerService().getActiveWorkers();

export const rebalanceWorkers = () => 
  getWorkerService().rebalanceWorkers();

export const getWorkerStats = (workerId: string) => 
  getWorkerService().getWorkerStats(workerId);

// Export types
export interface WorkerConfig {
  id: string;
  queues: string[];
  concurrency: number;
  maxMemory?: number;
  maxCpu?: number;
  host?: string;
  startedAt?: Date;
}

export interface WorkerStatus {
  id: string;
  queues: string[];
  concurrency: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  status: 'active' | 'paused' | 'shutdown';
  lastHeartbeat: Date;
  resources: {
    memory: number;
    cpu: number;
  };
  host: string;
  startedAt: Date;
}

export interface WorkerStats {
  id: string;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  throughput: number;
  averageProcessingTime: number;
  errorRate: number;
  resourceUtilization: {
    memory: number;
    cpu: number;
  };
  queueStats: {
    queue: string;
    active: number;
    completed: number;
    failed: number;
  }[];
}

export interface RebalanceResult {
  workersRebalanced: number;
  adjustments: {
    workerId: string;
    queue: string;
    oldConcurrency: number;
    newConcurrency: number;
  }[];
}
