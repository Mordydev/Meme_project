/**
 * XSS Protection Middleware
 * 
 * Middleware for preventing Cross-Site Scripting attacks
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { SecurityContext } from '../framework/types';
import { logger } from '../../lib/logger';

// Regex patterns for XSS detection
const XSS_PATTERNS = [
  // Script tag patterns
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /<script\b.*?>/i,
  /<\/script>/i,
  
  // Event handler patterns
  /on\w+\s*=\s*["']?[^"']*["']?/i,
  
  // JavaScript URL patterns
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:/i,
  
  // Dangerous HTML patterns
  /<iframe/i,
  /<embed/i,
  /<object/i,
  
  // Expression patterns
  /expression\s*\(/i,
  /url\s*\(/i,
  
  // HTML5 event handlers
  /formaction/i,
  /autofocus/i,
  /onfocus/i,
  /onblur/i,
  /onchange/i,
  /onclick/i,
  /onkeydown/i,
  /onkeypress/i,
  /onkeyup/i,
  /onload/i,
  /onmouseover/i,
  /onmouseout/i,
  /onsubmit/i
];

/**
 * Check for XSS patterns in string
 * 
 * @param value String to check
 * @returns Whether XSS patterns were detected
 */
function checkForXss(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  return XSS_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Recursively check for XSS patterns in object
 * 
 * @param obj Object to check
 * @returns Array of properties with XSS patterns
 */
function findXssInObject(obj: any): Array<{ path: string, value: string }> {
  const results: Array<{ path: string, value: string }> = [];
  
  function traverse(current: any, path: string = '') {
    // Skip null/undefined
    if (current == null) return;
    
    // Check strings for XSS patterns
    if (typeof current === 'string') {
      if (checkForXss(current)) {
        results.push({ path, value: current });
      }
      return;
    }
    
    // Recursively check objects
    if (typeof current === 'object') {
      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          const newPath = path ? `${path}.${key}` : key;
          traverse(current[key], newPath);
        }
      }
    }
  }
  
  traverse(obj);
  return results;
}

/**
 * XSS protection middleware
 * 
 * @param request Fastify request
 * @param reply Fastify reply
 * @param context Security context
 * @returns Success flag
 */
export async function xssProtection(
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
): Promise<boolean> {
  try {
    let xssDetections: Array<{ path: string, value: string }> = [];
    
    // Check request body
    if (request.body) {
      xssDetections = xssDetections.concat(findXssInObject(request.body));
    }
    
    // Check query parameters
    if (request.query) {
      xssDetections = xssDetections.concat(findXssInObject(request.query));
    }
    
    // Check URL parameters
    if (request.params) {
      xssDetections = xssDetections.concat(findXssInObject(request.params));
    }
    
    // If XSS patterns were detected, take action
    if (xssDetections.length > 0) {
      // Log XSS attempt
      logger.warn('XSS attempt detected', {
        url: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        detections: xssDetections
      });
      
      // Determine if this is on a sensitive endpoint
      const sensitivePath = request.url.match(/^\/api\/v1\/(auth|admin|wallet|payment|points\/redeem)/i);
      
      // For sensitive endpoints, block the request
      if (sensitivePath) {
        reply.code(400).send({
          data: null,
          errors: [{
            code: 'INVALID_INPUT',
            message: 'Invalid input detected'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
        
        return false;
      }
      
      // For other endpoints, sanitize the input rather than blocking
      // Sanitization will be handled by sanitizeInput middleware
      
      // Add to security context for monitoring
      context.xssDetections = xssDetections;
    }
    
    return true;
  } catch (error) {
    logger.error('Error in XSS protection middleware', { error, path: request.url });
    
    // Continue request on error
    return true;
  }
}
