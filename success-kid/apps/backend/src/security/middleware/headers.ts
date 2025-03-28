/**
 * Security headers middleware
 * 
 * This middleware sets additional security headers not handled by helmet.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';

/**
 * Set additional security headers
 */
export async function securityHeadersMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // Generate unique request ID if not present
    const requestId = request.id || uuidv4();
    
    // Set custom security headers
    
    // Add unique request ID for traceability
    reply.header('X-Request-ID', requestId);
    
    // Prevent clickjacking via iframes (redundant with helmet frameguard but as backup)
    reply.header('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing (redundant with helmet noSniff but as backup)
    reply.header('X-Content-Type-Options', 'nosniff');
    
    // Permissions policy (formerly Feature-Policy)
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    
    // Referrer policy
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  } catch (error) {
    logger.error('Error in security headers middleware', { error });
    // Continue processing even if headers failed
  }
}

/**
 * Create a nonce value for Content Security Policy
 */
export function generateCspNonce(request: FastifyRequest): string {
  // Generate a random nonce for this request
  const nonce = Buffer.from(uuidv4()).toString('base64');
  
  // Store nonce on the request for use in templates
  (request as any).cspNonce = nonce;
  
  return nonce;
}

/**
 * Create a CSP header with a nonce for inline scripts
 */
export function createCspHeaderWithNonce(request: FastifyRequest): string {
  const nonce = generateCspNonce(request);
  
  // Create CSP directives with nonce for script-src
  return `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self' https://fonts.gstatic.com; object-src 'none'; media-src 'self'; frame-src 'none'`;
}
