/**
 * Input sanitization middleware
 * 
 * This middleware sanitizes request inputs to prevent common attacks like XSS and SQL injection.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { ValidationError } from '../../errors';
import { AuditAction, AuditResource } from '../../audit/types';
import { auditService } from '../../audit/service';

// Regular expressions for detecting potential attacks
const XSS_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const SQL_INJECTION_PATTERN = /(\b(select|insert|update|delete|drop|alter|exec|union)\b.*(\b(from|into|where|table|database)\b))|('(''|[^'])*')|(--)|(\/\*.*\*\/)/i;
const COMMAND_INJECTION_PATTERN = /;|\||\$\(|\`|\&/g;
const XSS_ATTRIBUTES = /(on\w+)=["'].*?["']/g;

/**
 * Sanitize string inputs
 */
function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Recursively sanitize an object's string values
 */
function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (value !== null && typeof value === 'object' && !Buffer.isBuffer(value)) {
      if (Array.isArray(value)) {
        result[key] = value.map(item => 
          typeof item === 'object' && item !== null ? sanitizeObject(item) : 
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else {
        result[key] = sanitizeObject(value);
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Check for malicious patterns in string content
 */
export function detectMaliciousContent(value: string): { malicious: boolean; patterns: string[] } {
  const patterns: string[] = [];
  
  if (XSS_PATTERN.test(value)) {
    patterns.push('xss');
  }
  
  if (SQL_INJECTION_PATTERN.test(value)) {
    patterns.push('sql-injection');
  }
  
  if (COMMAND_INJECTION_PATTERN.test(value)) {
    patterns.push('command-injection');
  }
  
  if (XSS_ATTRIBUTES.test(value)) {
    patterns.push('xss-attributes');
  }
  
  return {
    malicious: patterns.length > 0,
    patterns
  };
}

/**
 * Input sanitization middleware
 */
export async function inputSanitizationMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // Don't sanitize GET requests
    if (request.method === 'GET') {
      return;
    }
    
    // Skip certain endpoints (e.g., file uploads)
    if (request.url.startsWith('/api/v1/media/upload')) {
      return;
    }
    
    const originalBody = { ...request.body };
    
    // Check query parameters for malicious patterns
    if (request.query && typeof request.query === 'object') {
      for (const [key, value] of Object.entries(request.query)) {
        if (typeof value === 'string') {
          const check = detectMaliciousContent(value);
          
          if (check.malicious) {
            // Log and audit the suspicious activity
            logger.warn('Detected malicious content in query parameter', {
              parameter: key,
              patterns: check.patterns,
              ip: request.ip,
              url: request.url
            });
            
            await auditService.logEvent({
              userId: request.user?.id || 'anonymous',
              action: AuditAction.ADMIN_ACTION,
              resource: AuditResource.SYSTEM,
              ip: request.ip,
              userAgent: request.headers['user-agent'],
              status: 'failure',
              metadata: {
                type: 'security_violation',
                parameter: key,
                patterns: check.patterns,
                url: request.url
              }
            });
            
            // Reject the request with a 400 error
            throw new ValidationError('Invalid input detected', {
              parameter: key,
              reason: 'Potentially malicious content detected'
            });
          }
        }
      }
    }
    
    // Check request body for malicious patterns
    if (request.body && typeof request.body === 'object') {
      const detectMaliciousInObject = (obj: Record<string, any>, path: string = ''): { malicious: boolean; details: any } => {
        const details: Record<string, any> = {};
        let malicious = false;
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string') {
            const check = detectMaliciousContent(value);
            
            if (check.malicious) {
              malicious = true;
              details[currentPath] = {
                patterns: check.patterns
              };
            }
          } else if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
            const result = detectMaliciousInObject(value, currentPath);
            
            if (result.malicious) {
              malicious = true;
              Object.assign(details, result.details);
            }
          }
        }
        
        return { malicious, details };
      };
      
      const check = detectMaliciousInObject(request.body);
      
      if (check.malicious) {
        // Log and audit the suspicious activity
        logger.warn('Detected malicious content in request body', {
          details: check.details,
          ip: request.ip,
          url: request.url
        });
        
        await auditService.logEvent({
          userId: request.user?.id || 'anonymous',
          action: AuditAction.ADMIN_ACTION,
          resource: AuditResource.SYSTEM,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          status: 'failure',
          metadata: {
            type: 'security_violation',
            details: check.details,
            url: request.url
          }
        });
        
        // Reject the request with a 400 error
        throw new ValidationError('Invalid input detected', {
          reason: 'Potentially malicious content detected',
          details: check.details
        });
      }
      
      // Sanitize the request body
      request.body = sanitizeObject(request.body);
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    logger.error('Error in input sanitization middleware', { error });
    throw new ValidationError('Unable to process request due to security constraints');
  }
}
