/**
 * Input Sanitization Middleware
 * 
 * Middleware for sanitizing request input to prevent injection attacks
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { SecurityContext } from '../framework/types';
import { logger } from '../../lib/logger';

// HTML escape map
const entityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Escape HTML characters in string
 * 
 * @param str String to escape
 * @returns Escaped string
 */
function escapeHtml(str: string): string {
  return String(str).replace(/[&<>"'`=/]/g, s => entityMap[s]);
}

/**
 * Sanitize a value (recursively for objects and arrays)
 * 
 * @param value Value to sanitize
 * @param options Sanitization options
 * @returns Sanitized value
 */
function sanitizeValue(
  value: any,
  options: {
    escapeTags: boolean;
    escapeScript: boolean;
    preserveMarkup?: string[];
  } = { escapeTags: true, escapeScript: true }
): any {
  // Handle null/undefined
  if (value == null) {
    return value;
  }
  
  // Handle different types
  switch (typeof value) {
    case 'string':
      // For string values, apply sanitization
      let sanitized = value;
      
      // Escape HTML tags
      if (options.escapeTags) {
        // Check for preserved markup
        if (options.preserveMarkup && options.preserveMarkup.length > 0) {
          // For special fields that allow some HTML, use more targeted approach
          const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
          const eventHandlerRegex = /\son\w+\s*=\s*["']?[^"']*["']?/gi;
          
          sanitized = sanitized
            .replace(scriptRegex, '')
            .replace(eventHandlerRegex, '');
        } else {
          // Normal sanitization
          sanitized = escapeHtml(sanitized);
        }
      }
      
      // Remove script tags if not already escaped
      if (options.escapeScript && !options.escapeTags) {
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
      
      return sanitized;
      
    case 'object':
      if (Array.isArray(value)) {
        // For arrays, sanitize each item
        return value.map(item => sanitizeValue(item, options));
      } else {
        // For objects, sanitize each property
        const result: Record<string, any> = {};
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            result[key] = sanitizeValue(value[key], options);
          }
        }
        return result;
      }
      
    default:
      // Non-string primitive values are safe
      return value;
  }
}

/**
 * Input sanitization middleware
 * 
 * @param request Fastify request
 * @param reply Fastify reply
 * @param context Security context
 * @returns Success flag
 */
export async function sanitizeInput(
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
): Promise<boolean> {
  try {
    // Determine sanitization options based on route
    const options = {
      escapeTags: true,
      escapeScript: true,
      // Some routes may allow specific HTML tags
      preserveMarkup: request.url.startsWith('/api/v1/content/create') ? 
        ['p', 'br', 'b', 'i', 'u', 'ul', 'ol', 'li', 'a', 'img', 'blockquote'] : 
        undefined
    };
    
    // Sanitize request body
    if (request.body && typeof request.body === 'object') {
      request.body = sanitizeValue(request.body, options);
    }
    
    // Sanitize request query
    if (request.query && typeof request.query === 'object') {
      request.query = sanitizeValue(request.query, {
        escapeTags: true,
        escapeScript: true
      });
    }
    
    // Sanitize request params
    if (request.params && typeof request.params === 'object') {
      request.params = sanitizeValue(request.params, {
        escapeTags: true,
        escapeScript: true
      });
    }
    
    return true;
  } catch (error) {
    logger.error('Error in sanitization middleware', { error, path: request.url });
    
    // Fail closed - reject request on sanitization error
    reply.code(400).send({
      data: null,
      errors: [{
        code: 'INVALID_INPUT',
        message: 'Invalid input data'
      }],
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    
    return false;
  }
}
