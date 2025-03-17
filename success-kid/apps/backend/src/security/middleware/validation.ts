/**
 * Input Validation Middleware
 * 
 * Enhanced validation middleware for security-critical operations
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { SecurityContext } from '../framework/types';
import { logger } from '../../lib/logger';

/**
 * Check for suspicious input patterns
 * 
 * @param value Value to check
 * @returns Whether suspicious patterns were found
 */
function hasSuspiciousPatterns(value: any): boolean {
  if (typeof value !== 'string') return false;
  
  // Regex patterns for common attacks
  const patterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // Basic SQL injection
    /(\<script)|(\<\/script)/i, // Basic XSS
    /(javascript:)|(vbscript:)|(data:)/i, // Protocol-based attacks
    /<iframe/i, // iframes
    /(document\.cookie)|(document\[.cookie)|(document\.write)|(document\[.write)/i, // Cookie stealing
    /(onload=)|(onerror=)/i, // Event handlers
    /(\(\))(\s)*(\{)/i, // Function execution
    /\\x[0-9a-f]{2}/i, // Hex encoding
  ];

  return patterns.some(pattern => pattern.test(value));
}

/**
 * Security scan for request data
 * 
 * @param data Data to scan
 * @param path Path to current data (for reporting)
 * @param results Results array to append to
 * @returns Whether suspicious patterns were found
 */
function scanData(
  data: any,
  path: string = '',
  results: Array<{ path: string; value: string }> = []
): boolean {
  // Skip null/undefined values
  if (data == null) return false;
  
  // Handle different types
  if (typeof data === 'string') {
    if (hasSuspiciousPatterns(data)) {
      results.push({ path, value: data });
      return true;
    }
    return false;
  }
  
  if (typeof data === 'object') {
    let found = false;
    
    if (Array.isArray(data)) {
      // Scan array values
      for (let i = 0; i < data.length; i++) {
        const newPath = path ? `${path}[${i}]` : `[${i}]`;
        found = scanData(data[i], newPath, results) || found;
      }
    } else {
      // Scan object properties
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const newPath = path ? `${path}.${key}` : key;
          found = scanData(data[key], newPath, results) || found;
        }
      }
    }
    
    return found;
  }
  
  return false;
}

/**
 * Enhanced validation middleware
 * 
 * @param request Fastify request
 * @param reply Fastify reply
 * @param context Security context
 * @returns Success flag
 */
export async function enhancedValidation(
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
): Promise<boolean> {
  try {
    // Suspicious patterns found in request
    const suspiciousPatterns: Array<{ path: string; value: string }> = [];
    
    // Scan request body
    if (request.body) {
      scanData(request.body, 'body', suspiciousPatterns);
    }
    
    // Scan query parameters
    if (request.query) {
      scanData(request.query, 'query', suspiciousPatterns);
    }
    
    // Scan request parameters
    if (request.params) {
      scanData(request.params, 'params', suspiciousPatterns);
    }
    
    // If suspicious patterns were found, log and potentially block
    if (suspiciousPatterns.length > 0) {
      // TODO: In a real system, you would add detection logic
      // to avoid false positives and heuristic scoring
      
      // For high-risk endpoints, block the request
      const highRiskEndpoint = request.url.match(/\/(auth|admin|wallet|points\/redeem)\//);
      
      if (highRiskEndpoint) {
        logger.warn('Blocked suspicious request', {
          url: request.url,
          method: request.method,
          ip: request.ip,
          patterns: suspiciousPatterns
        });
        
        reply.code(400).send({
          data: null,
          errors: [{
            code: 'VALIDATION_ERROR',
            message: 'Invalid input detected'
          }],
          meta: {
            timestamp: new Date().toISOString()
          }
        });
        
        return false;
      } else {
        // Log but allow the request (could be a false positive)
        logger.warn('Suspicious patterns detected', {
          url: request.url,
          method: request.method,
          ip: request.ip,
          patterns: suspiciousPatterns
        });
        
        // Add info to security context
        context.suspiciousPatterns = suspiciousPatterns;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Error in validation middleware', { error, path: request.url });
    
    // Fail open - continue request
    return true;
  }
}
