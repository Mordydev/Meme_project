import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from '../config';

/**
 * Comprehensive security plugin for the Wild 'n Out Meme Coin Platform API.
 * 
 * Implements:
 * - Security headers (CSP, XSS protection, etc.)
 * - Adaptive rate limiting by endpoint sensitivity
 * - CSRF protection for non-GET requests
 * - Input validation safeguards
 */
const securityPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Configure security headers with Helmet
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://*.clerk.accounts.dev", "https://*.supabase.co", 
                     config.frontendUrl, "wss://*.wildnout.io"]
      }
    },
    // Set Referrer Policy to protect user privacy
    referrerPolicy: { policy: 'same-origin' },
    // Prevent browsers from attempting to MIME-sniff the content-type
    xContentTypeOptions: true,
    // Configure XSS Protection
    xXssProtection: true,
    // Prevent clickjacking
    frameguard: { action: 'deny' }
  });
  
  // Configure rate limiting with dynamic thresholds
  await fastify.register(async (instance) => {
    // Default API rate limits
    instance.register(rateLimit, {
      global: true,
      max: (req) => {
        // Adjust limits based on endpoint sensitivity and user tier
        if (req.url.includes('/api/auth')) return 20;
        if (req.url.includes('/api/wallet')) return 30;
        if (req.url.includes('/api/content')) return 100;
        if (req.url.includes('/api/battles')) return 150;
        if (req.url.includes('/api/social')) return 200;
        return 500; // Default
      },
      timeWindow: '1 minute',
      // Support trust proxy to get correct client IP
      keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.ip || 'unknown';
      },
      // Customize rate limit exceeded response
      errorResponseBuilder: (req, context) => ({
        error: {
          code: 'rate_limit_exceeded',
          message: 'Too many requests, please try again later',
          details: {
            limit: context.max,
            remaining: context.remaining,
            resetTime: new Date(Date.now() + context.ttl).toISOString()
          }
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    // Stricter limits for authentication endpoints
    instance.register(rateLimit, {
      prefix: '/api/auth',
      max: 10,
      timeWindow: '1 minute'
    });
    
    // Strict limits for wallet operations
    instance.register(rateLimit, {
      prefix: '/api/wallet',
      max: 20,
      timeWindow: '1 minute'
    });
  });
  
  // Add CSRF protection for non-GET/HEAD/OPTIONS routes
  // Only if CSRF is enabled in configuration
  if (config.security.csrfEnabled) {
    fastify.addHook('onRequest', (request: FastifyRequest, reply: FastifyReply, done) => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return done();
      }
      
      // Skip CSRF check for webhook endpoints
      if (request.url.includes('/api/webhook')) {
        return done();
      }
      
      const csrfToken = request.headers['x-csrf-token'];
      const storedToken = request.session && request.session.csrfToken;
      
      if (!csrfToken || csrfToken !== storedToken) {
        // Log security event for CSRF violation
        const auditService = fastify.services.auditService;
        if (auditService) {
          auditService.logSecurityEvent(
            'suspicious_request', 
            request.user ? request.user.id : null,
            {
              url: request.url,
              method: request.method,
              message: 'CSRF token validation failed',
              ip: request.ip,
              userAgent: request.headers['user-agent']
            },
            'medium'
          ).catch(() => {}); // Don't block the response with logging errors
        }
        
        return reply.code(403).send({
          error: {
            code: 'forbidden',
            message: 'Invalid or missing CSRF token',
            details: null
          },
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      done();
    });
  }
  
  // Log security events
  fastify.addHook('onRequest', async (request) => {
    // Log suspicious requests
    if (isSuspiciousRequest(request)) {
      const auditService = fastify.services.auditService;
      await auditService.logSecurityEvent(
        'suspicious_request',
        request.user ? request.user.id : null,
        {
          url: request.url,
          method: request.method,
          headers: sanitizeHeaders(request.headers),
          ip: request.ip,
          userAgent: request.headers['user-agent']
        },
        'medium'
      );
    }
  });
  
  // Add hook to check for common attack patterns in request
  fastify.addHook('onRequest', async (request, reply) => {
    if (containsAttackPatterns(request)) {
      const auditService = fastify.services.auditService;
      await auditService.logSecurityEvent(
        'attack_pattern_detected',
        request.user ? request.user.id : null,
        {
          url: request.url,
          method: request.method,
          ip: request.ip,
          userAgent: request.headers['user-agent']
        },
        'high'
      );
      
      return reply.code(403).send({
        error: {
          code: 'forbidden',
          message: 'Request blocked due to security concerns',
          details: null
        }
      });
    }
  });
  
  // Register function to generate new CSRF token
  fastify.decorate('generateCsrfToken', () => {
    const token = Buffer.from(crypto.randomUUID()).toString('hex');
    return token;
  });
};

/**
 * Helper to determine if a request looks suspicious
 */
function isSuspiciousRequest(request: FastifyRequest): boolean {
  // Check for suspicious headers
  const userAgent = request.headers['user-agent'] || '';
  
  // Check for common scraper/bot patterns
  if (userAgent.includes('scraper') || userAgent.includes('bot') || userAgent === '') {
    return true;
  }
  
  // Check for unusual request patterns
  const referer = request.headers.referer || '';
  if (referer && !referer.includes('wildnout.io') && request.method !== 'GET') {
    return true;
  }
  
  return false;
}

/**
 * Helper to sanitize headers for logging (remove sensitive info)
 */
function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  
  // Remove sensitive headers
  delete sanitized.authorization;
  delete sanitized.cookie;
  
  return sanitized;
}

/**
 * Helper to check for common attack patterns in request
 */
function containsAttackPatterns(request: FastifyRequest): boolean {
  const url = request.url || '';
  const body = request.body || {};
  
  // Check for SQL injection attempts
  if (
    url.includes('SELECT') && url.includes('FROM') ||
    url.includes('UNION') && url.includes('SELECT') ||
    url.includes('%27') // URL-encoded single quote
  ) {
    return true;
  }
  
  // Check for XSS attempts
  if (
    url.includes('<script>') ||
    url.includes('javascript:') ||
    url.includes('onerror=')
  ) {
    return true;
  }
  
  // Check request body for suspicious patterns if it's an object
  if (typeof body === 'object' && body !== null) {
    const bodyStr = JSON.stringify(body).toLowerCase();
    if (
      bodyStr.includes('<script>') ||
      bodyStr.includes('javascript:') ||
      bodyStr.includes('onerror=')
    ) {
      return true;
    }
  }
  
  return false;
}

export default fp(securityPlugin, {
  name: 'security',
  dependencies: ['@fastify/helmet', '@fastify/rate-limit']
});
