/**
 * Monitoring Module
 * 
 * Provides comprehensive monitoring, metrics collection, and alerting functionality
 */
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { setupMetrics } from './metrics';
import { configureHealthChecks } from './health';
import { setupAlerts } from './alerts';

/**
 * Monitoring plugin for Fastify
 */
export const monitoringPlugin = fp(async function (fastify: FastifyInstance) {
  // Register metrics collection
  await setupMetrics(fastify);
  
  // Configure health checks
  await configureHealthChecks(fastify);
  
  // Setup alerts if enabled
  if (process.env.ENABLE_ALERTS === 'true') {
    await setupAlerts(fastify);
  }
  
  // Log monitoring initialization
  fastify.log.info('Monitoring system initialized');
});

export * from './types';
export { metricsMiddleware } from './middleware';
export { recordMetric, incrementCounter, setGauge, observeHistogram } from './metrics';
export { createHealthCheck } from './health';
