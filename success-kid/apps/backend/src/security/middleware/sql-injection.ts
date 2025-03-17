/**
 * SQL Injection Protection Middleware
 * 
 * Middleware for preventing SQL injection attacks
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { SecurityContext } from '../framework/types';
import { logger } from '../../lib/logger';

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  // Basic SQL syntax
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /(\%3B)|(;)/i,
  
  // SQL keywords
  /\s+SELECT\s+/i,
  /\s+INSERT\s+/i,
  /\s+UPDATE\s+/i,
  /\s+DELETE\s+/i,
  /\s+DROP\s+/i,
  /\s+UNION\s+/i,
  /\s+EXEC\s+/i,
  /\s+TRUNCATE\s+/i,
  /\s+ALTER\s+/i,
  /\s+CREATE\s+/i,
  
  // SQL logical operators
  /\s+OR\s+\d+\s*=\s*\d+/i,
  /\s+AND\s+\d+\s*=\s*\d+/i,
  /\d+\s*=\s*\d+/i,
  
  // More SQL syntax
  /'\s+OR\s+'1'\s*=\s*'1/i,
  /"\s+OR\s+"1"\s*=\s*"1/i,
  /'\s+OR\s+'\d+'\s*=\s*'\d+/i,
  
  // Commenting
  /\/\*/i,
  /\*\//i,
  /--/i,
  /\bXOR\b/i,
  
  // Stacked queries
  /;\s*SELECT\s+/i,
  /;\s*INSERT\s+/i,
  /;\s*UPDATE\s+/i,
  /;\s*DELETE\s+/i,
  
  // Function calls
  /SLEEP\s*\(/i,
  /BENCHMARK\s*\(/i,
  /CONCAT\s*\(/i,
  /SUBSTRING\s*\(/i,
  /CHAR\s*\(/i
];

/**
 * Check for SQL injection patterns in string
 * 
 * @param value String to check
 * @returns Whether SQL injection patterns were detected
 */
function checkForSqlInjection(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Recursively check for SQL injection patterns in object
 * 
 * @param obj Object to check
 * @returns Array of properties with SQL injection patterns
 */
function findSqlInjectionInObject(obj: any): Array<{ path: string, value: string }> {
  const results: Array<{ path: string, value: string }> = [];
  
  function traverse(current: any, path: string = '') {
    // Skip null/undefined
    if (current == null) return;
    
    // Check strings for SQL injection patterns
    if (typeof current === 'string') {
      if (checkForSqlInjection(current)) {
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
 * SQL injection protection middleware
 * 
 * @param request Fastify request
 * @param reply Fastify reply
 * @param context Security context
 * @returns Success flag
 */
export async function sqlInjectionProtection(
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
): Promise<boolean> {
  try {
    let sqlInjectionDetections: Array<{ path: string, value: string }> = [];
    
    // Check request body
    if (request.body) {
      sqlInjectionDetections = sqlInjectionDetections.concat(findSqlInjectionInObject(request.body));
    }
    
    // Check query parameters
    if (request.query) {
      sqlInjectionDetections = sqlInjectionDetections.concat(findSqlInjectionInObject(request.query));
    }
    
    // Check URL parameters
    if (request.params) {
      sqlInjectionDetections = sqlInjectionDetections.concat(findSqlInjectionInObject(request.params));
    }
    
    // If SQL injection patterns were detected, take action
    if (sqlInjectionDetections.length > 0) {
      // Log SQL injection attempt
      logger.warn('SQL injection attempt detected', {
        url: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        detections: sqlInjectionDetections
      });
      
      // Block the request
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
    
    return true;
  } catch (error) {
    logger.error('Error in SQL injection protection middleware', { error, path: request.url });
    
    // Fail closed - reject request on error
    reply.code(400).send({
      data: null,
      errors: [{
        code: 'INVALID_INPUT',
        message: 'Invalid input format'
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
    
    return false;
  }
}
