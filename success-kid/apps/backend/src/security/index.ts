/**
 * Security Module
 * 
 * Comprehensive security framework for the Success Kid Community Platform
 */
import { FastifyInstance } from 'fastify';
import { securityMiddleware } from './middleware';
import { SecurityService } from './framework/service';
import { registerSecurityConfig } from './framework/config';

// Re-export sub-modules for external use
export * from './middleware';
export * from './framework/service';
export * from './framework/types';
export * from './framework/policies';
export * from './encryption';
export * from './csrf';
export * from './pii';
export * from './vulnerabilities';

/**
 * Register the security framework plugin with Fastify
 */
export async function securityPlugin(fastify: FastifyInstance): Promise<void> {
  // Register security configuration
  await registerSecurityConfig(fastify);
  
  // Register security middleware
  await securityMiddleware(fastify);
  
  // Create and register security service
  const securityService = new SecurityService(fastify);
  fastify.decorate('securityService', securityService);
  
  // Add security hooks
  fastify.addHook('onRequest', async (request, reply) => {
    // Ensure request has security context
    request.security = {
      context: {},
      checks: [],
    };
  });
  
  // Register security routes
  fastify.register(async (instance) => {
    // Security headers info endpoint (only in dev)
    if (process.env.NODE_ENV === 'development') {
      instance.get('/api/v1/debug/security-headers', {
        handler: async (request, reply) => {
          return {
            headers: fastify.securityService.getSecurityHeadersConfig(),
            policies: fastify.securityService.getActivePolicies()
          };
        }
      });
    }
  });
  
  fastify.log.info('Security framework initialized');
}

// Default plugin export
export default securityPlugin;
