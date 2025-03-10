import { FastifyInstance } from 'fastify';
import os from 'os';
import { MetricsService } from './metrics-service';
import { Logger } from 'pino';

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    cpu: {
      usage: number;
      status: 'healthy' | 'degraded' | 'unhealthy';
    };
    memory: {
      usage: number;
      status: 'healthy' | 'degraded' | 'unhealthy';
    };
    services: {
      [service: string]: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        latency?: number;
        error?: string;
      };
    };
  };
}

/**
 * Service for monitoring system health
 */
export class HealthService {
  private readonly metricsService: MetricsService;
  private readonly logger: Logger;
  private cpuUsageHistory: number[] = [];
  private memoryHistory: number[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastCpuUsage: { user: number; system: number; idle: number } | null = null;
  
  /**
   * Create a new health service
   */
  constructor(fastify: FastifyInstance) {
    this.metricsService = fastify.metrics;
    this.logger = fastify.log.child({ service: 'health' });
  }
  
  /**
   * Start health monitoring
   */
  startMonitoring(intervalMs = 60000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(() => {
      this.checkSystemHealth().catch(err => {
        this.logger.error({ err }, 'Failed to check system health');
      });
    }, intervalMs);
    
    this.logger.info({ intervalMs }, 'System health monitoring started');
  }
  
  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.logger.info('System health monitoring stopped');
    }
  }
  
  /**
   * Check system health and update metrics
   */
  async checkSystemHealth(): Promise<HealthCheckResult> {
    // Calculate CPU usage
    const cpuUsage = await this.calculateCpuUsage();
    
    // Calculate memory usage
    const memoryUsage = this.calculateMemoryUsage();
    
    // Check service health
    const services = await this.checkServiceHealth();
    
    // Update history
    this.updateHistory(cpuUsage, memoryUsage);
    
    // Update metrics
    this.metricsService.gauge('system.cpu.usage', cpuUsage);
    this.metricsService.gauge('system.memory.usage', memoryUsage);
    
    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Check CPU threshold
    const cpuStatus = cpuUsage > 0.8 ? 'unhealthy' : (cpuUsage > 0.6 ? 'degraded' : 'healthy');
    if (cpuStatus === 'unhealthy') status = 'unhealthy';
    else if (cpuStatus === 'degraded' && status === 'healthy') status = 'degraded';
    
    // Check memory threshold
    const memoryStatus = memoryUsage > 0.8 ? 'unhealthy' : (memoryUsage > 0.6 ? 'degraded' : 'healthy');
    if (memoryStatus === 'unhealthy') status = 'unhealthy';
    else if (memoryStatus === 'degraded' && status === 'healthy') status = 'degraded';
    
    // Check if any service is unhealthy
    for (const serviceName in services) {
      const serviceStatus = services[serviceName].status;
      if (serviceStatus === 'unhealthy') status = 'unhealthy';
      else if (serviceStatus === 'degraded' && status === 'healthy') status = 'degraded';
    }
    
    // Log if status is not healthy
    if (status !== 'healthy') {
      this.logger.warn({
        status,
        cpu: cpuUsage,
        memory: memoryUsage,
        services
      }, 'System health check detected issues');
    }
    
    return {
      status,
      details: {
        cpu: {
          usage: cpuUsage,
          status: cpuStatus
        },
        memory: {
          usage: memoryUsage,
          status: memoryStatus
        },
        services
      }
    };
  }
  
  /**
   * Get current system health status
   */
  async getSystemHealth(): Promise<HealthCheckResult> {
    return this.checkSystemHealth();
  }
  
  /**
   * Get system load factor (0-1, higher means more load)
   */
  async getSystemLoad(): Promise<number> {
    // Calculate a composite load factor based on CPU and memory
    const cpuUsage = await this.calculateCpuUsage();
    const memoryUsage = this.calculateMemoryUsage();
    
    // Higher weight to CPU as it's more critical for performance
    return cpuUsage * 0.7 + memoryUsage * 0.3;
  }
  
  /**
   * Calculate CPU usage (0-1)
   */
  private async calculateCpuUsage(): Promise<number> {
    // Get CPU info
    const cpus = os.cpus();
    
    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;
    let irq = 0;
    
    for (const cpu of cpus) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      irq += cpu.times.irq;
    }
    
    const currentCpuUsage = {
      user,
      system: sys,
      idle
    };
    
    if (!this.lastCpuUsage) {
      this.lastCpuUsage = currentCpuUsage;
      
      // Sleep a short time to get a delta
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.calculateCpuUsage();
    }
    
    const userDiff = currentCpuUsage.user - this.lastCpuUsage.user;
    const systemDiff = currentCpuUsage.system - this.lastCpuUsage.system;
    const idleDiff = currentCpuUsage.idle - this.lastCpuUsage.idle;
    
    const totalDiff = userDiff + systemDiff + idleDiff;
    const usageDiff = userDiff + systemDiff;
    
    // Update last usage
    this.lastCpuUsage = currentCpuUsage;
    
    // Calculate usage percentage (0-1)
    return totalDiff > 0 ? usageDiff / totalDiff : 0;
  }
  
  /**
   * Calculate memory usage (0-1)
   */
  private calculateMemoryUsage(): number {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    return usedMemory / totalMemory;
  }
  
  /**
   * Check health of dependent services
   */
  private async checkServiceHealth(): Promise<{
    [service: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      latency?: number;
      error?: string;
    };
  }> {
    const services: {
      [service: string]: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        latency?: number;
        error?: string;
      };
    } = {};
    
    // Here we would check dependent services like Redis, database, etc.
    // For now, just return an empty object
    
    return services;
  }
  
  /**
   * Update history arrays with limited size
   */
  private updateHistory(cpuUsage: number, memoryUsage: number): void {
    const maxHistoryLength = 10;
    
    this.cpuUsageHistory.push(cpuUsage);
    if (this.cpuUsageHistory.length > maxHistoryLength) {
      this.cpuUsageHistory.shift();
    }
    
    this.memoryHistory.push(memoryUsage);
    if (this.memoryHistory.length > maxHistoryLength) {
      this.memoryHistory.shift();
    }
  }
  
  /**
   * Get average CPU usage from history
   */
  getAverageCpuUsage(): number {
    if (this.cpuUsageHistory.length === 0) return 0;
    
    const sum = this.cpuUsageHistory.reduce((a, b) => a + b, 0);
    return sum / this.cpuUsageHistory.length;
  }
  
  /**
   * Get average memory usage from history
   */
  getAverageMemoryUsage(): number {
    if (this.memoryHistory.length === 0) return 0;
    
    const sum = this.memoryHistory.reduce((a, b) => a + b, 0);
    return sum / this.memoryHistory.length;
  }
}
