/**
 * Job Dependency Management
 * 
 * Manages dependencies between jobs.
 */
import { Job } from 'bull';
import { logger } from '../../lib/logger';
import { DependencyService } from './service';

// Singleton service instance
let dependencyService: DependencyService | null = null;

/**
 * Get the dependency service
 * @returns Dependency service instance
 */
export function getDependencyService(): DependencyService {
  if (!dependencyService) {
    dependencyService = new DependencyService();
  }
  return dependencyService;
}

/**
 * Initialize the dependency system
 */
export async function initializeDependencySystem(): Promise<void> {
  try {
    const dependency = getDependencyService();
    await dependency.initialize();
    logger.info('Job dependency system initialized');
  } catch (error) {
    logger.error('Failed to initialize job dependency system', { error });
    throw error;
  }
}

// Export operations
export const addJobWithDependencies = (
  queue: string, 
  name: string, 
  data: any, 
  dependencies: string[], 
  options?: any
) => getDependencyService().addJobWithDependencies(queue, name, data, dependencies, options);

export const checkDependencies = (jobId: string) => 
  getDependencyService().checkDependencies(jobId);

export const handleDependencyFailure = (jobId: string) => 
  getDependencyService().handleDependencyFailure(jobId);

export const getDependencyGraph = (rootJobId: string) => 
  getDependencyService().getDependencyGraph(rootJobId);

export const getJobDependency = (jobId: string) => 
  getDependencyService().getJobDependency(jobId);

// Export types
export interface JobDependency {
  jobId: string;
  dependsOn: string[];
  status: 'pending' | 'ready' | 'failed';
}

export interface DependencyStatus {
  ready: boolean;
  pending: number;
  failed: number;
}

export interface DependencyGraph {
  nodes: {
    id: string;
    queue: string;
    name: string;
    status: string;
  }[];
  edges: {
    source: string;
    target: string;
  }[];
}

export interface JobNode {
  id: string;
  queue: string;
  name: string;
  status: string;
  children: JobNode[];
}
