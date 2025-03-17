/**
 * Security Headers Middleware
 * 
 * Middleware for setting and validating security headers
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { SecurityContext } from '../framework/types';

/**
 * Add security headers to response
 * 
 * @param request Fastify request
 * @param reply Fastify reply
 * @param context Security context
 * @returns Success flag
 */
export async function securityHeaders(
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
): Promise<boolean> {
  // Note: Most headers are set by Helmet
  // This middleware adds any additional headers not covered by Helmet
  
  // Add Feature-Policy/Permissions-Policy header
  if (!reply.getHeader('Permissions-Policy')) {
    reply.header(
      'Permissions-Policy',
      "camera=(), microphone=(), geolocation=(), payment=()"
    );
  }
  
  // Add cache control headers for API endpoints
  if (request.url.startsWith('/api/')) {
    reply.header('Cache-Control', 'no-store, max-age=0');
  }
  
  // Add Expect-CT header for certificate transparency
  reply.header(
    'Expect-CT',
    'enforce, max-age=86400'
  );
  
  return true;
}

/**
 * Validate required security headers
 * 
 * @param request Fastify request
 * @param reply Fastify reply
 * @param context Security context
 * @returns Success flag
 */
export async function validateSecurityHeaders(
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
): Promise<boolean> {
  // Skip for non-production environments
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  
  // For sensitive routes, check for secure transport
  if (request.url.match(/^\/api\/v1\/(auth|users|admin|wallet|points\/redeem)/)) {
    // Check for forwarded protocol
    const forwardedProto = request.headers['x-forwarded-proto'];
    
    // If not HTTPS, reject the request
    if (forwardedProto !== 'https') {
      reply.code(403).send({
        data: null,
        errors: [{
          code: 'INSECURE_CONNECTION',
          message: 'Secure connection required for this endpoint'
        }],
        meta: {
          timestamp: new Date().toISOString()
        }
      });
      
      return false;
    }
  }
  
  return true;
}
