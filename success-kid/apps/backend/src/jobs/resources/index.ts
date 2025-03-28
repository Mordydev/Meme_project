/**
 * Resource-Intensive Task Management
 * 
 * Manages and optimizes execution of resource-intensive jobs.
 */
import { logger } from '../../lib/logger';
import { ResourceService } from './service';

// Singleton service instance
let resourceService: ResourceService | null = null;

/**
 * Get the resource service
 * @returns Resource service instance
 */
export function getResourceService(): ResourceService {
  if (!resourceService) {
    resourceService = new ResourceService();
  }
  return resourceService;
}

/**
 * Initialize the resource management system
 */
export async function initializeResourceSystem(): Promise<void> {
  try {
    const resource = getResourceService();
    await resource.initialize();
    logger.info('Resource management system initialized');
  } catch (error) {
    logger.error('Failed to initialize resource management system', { error });
    throw error;
  }
}

// Export operations
export const setJobResourceRequirements = (queue: string, jobName: string, requirements: ResourceRequirements) => 
  getResourceService().setJobResourceRequirements(queue, jobName, requirements);

export const getJobResourceRequirements = (queue: string, jobName: string) => 
  getResourceService().getJobResourceRequirements(queue, jobName);

export const scheduleResourceIntensiveJob = (queue: string, jobName: string, data: any, options?: any) => 
  getResourceService().scheduleResourceIntensiveJob(queue, jobName, data, options);

export const getResourceAvailability = () => 
  getResourceService().getResourceAvailability();

// Export types
export interface ResourceRequirements {
  /** Memory usage in MB */
  memory?: number;
  /** CPU usage percentage (0-100) */
  cpu?: number;
  /** Whether GPU is required */
  gpu?: boolean;
  /** Estimated duration in seconds */
  duration?: number;
  /** Priority adjustment */
  priorityAdjustment?: number;
}

export interface ResourceAvailability {
  /** Total available memory in MB */
  totalMemory: number;
  /** Free memory in MB */
  freeMemory: number;
  /** CPU usage percentage (0-100) */
  cpuUsage: number;
  /** Whether GPU is available */
  gpuAvailable: boolean;
  /** Resource forecast (seconds until resources available) */
  forecast: {
    /** Seconds until enough memory available */
    memory: number;
    /** Seconds until enough CPU available */
    cpu: number;
    /** Seconds until GPU available */
    gpu: number;
  };
}

export enum ResourceThresholds {
  /** Maximum jobs that can run concurrently */
  MAX_CONCURRENT_JOBS = 20,
  /** Maximum memory intensive jobs that can run concurrently */
  MAX_MEMORY_INTENSIVE_JOBS = 5,
  /** Maximum CPU intensive jobs that can run concurrently */
  MAX_CPU_INTENSIVE_JOBS = 3,
  /** Maximum GPU jobs that can run concurrently */
  MAX_GPU_JOBS = 1,
  /** Memory threshold for considering a job memory-intensive (MB) */
  MEMORY_INTENSIVE_THRESHOLD = 500,
  /** CPU threshold for considering a job CPU-intensive (%) */
  CPU_INTENSIVE_THRESHOLD = 30
}
