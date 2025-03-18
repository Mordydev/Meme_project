/**
 * Monitoring Module
 * 
 * Provides comprehensive monitoring, metrics collection, logging, and alerting functionality
 */
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { setupMetrics, recordMetric, incrementCounter, setGauge, observeHistogram, measurePerformance } from './metrics';
import { configureHealthChecks, createHealthCheck, runAllChecks, getVersionInfo } from './health-checks';
import { setupAlerts } from './alerts';
import { setupErrorTracking } from './error-tracking';
import { logger } from '../lib/logger';

/**
 * Monitoring plugin for Fastify
 */
export const monitoringPlugin = fp(async function (fastify: FastifyInstance) {
  // Register metrics collection
  await setupMetrics(fastify);
  
  // Configure health checks
  await configureHealthChecks(fastify);
  
  // Setup error tracking
  setupErrorTracking(fastify);
  
  // Setup alerts if enabled
  if (process.env.ENABLE_ALERTS === 'true') {
    await setupAlerts(fastify);
  }
  
  // Add version endpoint
  fastify.get('/version', {
    schema: {
      hide: true, // Hide from Swagger docs
    },
    handler: async (request, reply) => {
      return getVersionInfo();
    }
  });
  
  // Log monitoring initialization
  logger.info('Monitoring system initialized');
});

// Export monitoring components
export * from './metrics';
export * from './health-checks';
export * from './error-tracking';
export { metricsMiddleware } from './middleware';

// Export middleware and utility functions
export { 
  recordMetric, 
  incrementCounter, 
  setGauge, 
  observeHistogram,
  measurePerformance,
  createHealthCheck,
  runAllChecks
};
