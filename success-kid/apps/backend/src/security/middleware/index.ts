/**
 * Security middleware exports
 * 
 * This file exports all security-related middleware and provides the implementation
 * for registering security middleware with a Fastify instance.
 */

import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { logger } from '../../lib/logger';
import { SecurityConfig } from '../types';

// Export individual middleware
export * from './headers';
export * from './sanitize';
export * from './validation';
export * from './access';

/**
 * Register security middleware with a Fastify instance
 */
export function registerSecurityMiddleware(app: FastifyInstance, config: SecurityConfig): void {
  logger.info('Registering security middleware...');

  // Register helmet for security headers if enabled
  if (config.headers.enabled) {
    app.register(helmet, {
      contentSecurityPolicy: config.contentSecurityPolicy.enabled ? {
        directives: config.contentSecurityPolicy.directives
      } : false,
      xssFilter: config.headers.xssProtection,
      noSniff: config.headers.noSniff,
      hidePoweredBy: config.headers.hidePoweredBy,
      frameguard: {
        action: config.headers.frameOptions.toLowerCase()
      },
      hsts: config.headers.hsts.enabled ? {
        maxAge: config.headers.hsts.maxAge,
        includeSubDomains: config.headers.hsts.includeSubDomains,
        preload: config.headers.hsts.preload
      } : false
    });
    logger.debug('Helmet middleware registered');
  }

  // Register CORS if enabled
  if (config.cors.enabled) {
    app.register(cors, {
      origin: config.cors.origin,
      methods: config.cors.methods,
      credentials: config.cors.credentials,
      maxAge: config.cors.maxAge,
      allowedHeaders: config.cors.allowedHeaders,
      exposedHeaders: config.cors.exposedHeaders
    });
    logger.debug('CORS middleware registered');
  }

  // Register global rate limit if enabled
  if (config.rateLimiting.enabled) {
    app.register(rateLimit, {
      max: config.rateLimiting.defaultLimit,
      timeWindow: config.rateLimiting.defaultWindow,
    });
    logger.debug('Rate limiting middleware registered');
  }

  logger.info('Security middleware registration complete');
}
