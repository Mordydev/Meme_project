/**
 * System Monitoring Utilities
 * 
 * Tools for monitoring system performance and health metrics.
 */
import { FastifyInstance } from 'fastify';
import { logger } from '../lib/logger';

/**
 * Performance metrics type
 */
export interface PerformanceMetrics {
  requestCount: number;
  responseTime: {
    total: number;
    count: number;
    average: number;
    min: number;
    max: number;
  };
  statusCodes: Record<number, number>;
  errors: number;
}

/**
 * Monitoring metrics by route
 */
export class MonitoringService {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private startTime: number = Date.now();
  
  /**
   * Create a new MonitoringService instance
   */
  constructor() {
    // Reset metrics every hour to prevent unbounded growth
    setInterval(() => this.resetMetrics(), 60 * 60 * 1000);
  }
  
  /**
   * Record request metrics
   * 
   * @param route Request route or path
   * @param statusCode Response status code
   * @param responseTime Response time in milliseconds
   * @param error Whether the request resulted in an error
   */
  recordRequest(route: string, statusCode: number, responseTime: number, error: boolean = false): void {
    // Get or create metrics for this route
    let routeMetrics = this.metrics.get(route);
    
    if (!routeMetrics) {
      routeMetrics = {
        requestCount: 0,
        responseTime: {
          total: 0,
          count: 0,
          average: 0,
          min: Number.MAX_SAFE_INTEGER,
          max: 0,
        },
        statusCodes: {},
        errors: 0,
      };
      this.metrics.set(route, routeMetrics);
    }
    
    // Update request count
    routeMetrics.requestCount++;
    
    // Update response time metrics
    routeMetrics.responseTime.total += responseTime;
    routeMetrics.responseTime.count++;
    routeMetrics.responseTime.average = routeMetrics.responseTime.total / routeMetrics.responseTime.count;
    routeMetrics.responseTime.min = Math.min(routeMetrics.responseTime.min, responseTime);
    routeMetrics.responseTime.max = Math.max(routeMetrics.responseTime.max, responseTime);
    
    // Update status code counts
    routeMetrics.statusCodes[statusCode] = (routeMetrics.statusCodes[statusCode] || 0) + 1;
    
    // Update error count
    if (error || statusCode >= 500) {
      routeMetrics.errors++;
    }
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.startTime = Date.now();
  }
  
  /**
   * Get metrics for a specific route
   * 
   * @param route Route to get metrics for
   * @returns Metrics for the specified route, or null if not found
   */
  getRouteMetrics(route: string): PerformanceMetrics | null {
    return this.metrics.get(route) || null;
  }
  
  /**
   * Get all route metrics
   * 
   * @returns Object with all route metrics
   */
  getAllMetrics(): Record<string, PerformanceMetrics> {
    const result: Record<string, PerformanceMetrics> = {};
    
    this.metrics.forEach((metrics, route) => {
      result[route] = metrics;
    });
    
    return result;
  }
  
  /**
   * Get summary metrics for the entire application
   * 
   * @returns Summary metrics object
   */
  getSummaryMetrics(): any {
    const summary = {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      statusCodes: {} as Record<number, number>,
      routeCount: this.metrics.size,
    };
    
    let totalResponseTime = 0;
    let totalErrors = 0;
    
    // Aggregate metrics across all routes
    this.metrics.forEach(metrics => {
      summary.totalRequests += metrics.requestCount;
      totalResponseTime += metrics.responseTime.total;
      totalErrors += metrics.errors;
      
      // Aggregate status codes
      Object.entries(metrics.statusCodes).forEach(([code, count]) => {
        const statusCode = parseInt(code, 10);
        summary.statusCodes[statusCode] = (summary.statusCodes[statusCode] || 0) + count;
      });
    });
    
    // Calculate aggregated averages
    if (summary.totalRequests > 0) {
      summary.averageResponseTime = totalResponseTime / summary.totalRequests;
      summary.errorRate = (totalErrors / summary.totalRequests) * 100;
    }
    
    return summary;
  }
}

/**
 * Setup monitoring middleware for a Fastify instance
 * 
 * @param fastify Fastify instance to monitor
 * @returns Monitoring service instance
 */
export function setupMonitoring(fastify: FastifyInstance): MonitoringService {
  const monitoring = new MonitoringService();
  
  // Add response time monitoring
  fastify.addHook('onRequest', (request, reply, done) => {
    // Record request start time
    request.locals = request.locals || {};
    request.locals.startTime = process.hrtime();
    done();
  });
  
  fastify.addHook('onResponse', (request, reply, done) => {
    try {
      // Calculate response time
      const startTime = request.locals?.startTime;
      if (startTime) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const responseTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
        
        // Record request metrics
        const route = request.routerPath || request.url;
        monitoring.recordRequest(
          route,
          reply.statusCode,
          responseTimeMs,
          reply.statusCode >= 400
        );
        
        // Log slow responses
        if (responseTimeMs > 1000) {
          logger.warn('Slow response detected', {
            path: route,
            method: request.method,
            responseTime: `${responseTimeMs.toFixed(2)}ms`,
            statusCode: reply.statusCode,
          });
        }
      }
    } catch (error) {
      // Don't let monitoring errors affect the response
      logger.error('Error in monitoring hook', { error });
    }
    
    done();
  });
  
  // Add health check route
  fastify.decorate('monitoring', monitoring);
  
  return monitoring;
}

// Export a singleton instance
export const monitoringService = new MonitoringService();

export default monitoringService;
