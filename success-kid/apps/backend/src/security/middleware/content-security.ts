/**
 * Content Security Middleware
 * 
 * Middleware for enforcing content security policies
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { SecurityContext } from '../framework/types';
import { logger } from '../../lib/logger';

/**
 * URL safety check patterns
 */
const UNSAFE_URL_PATTERNS = [
  // Protocol checks
  /^javascript:/i,
  /^data:/i,
  /^vbscript:/i,
  /^file:/i,
  
  // Potentially malicious domains (example)
  /\.evil\.com$/i,
  /\.malware\.org$/i,
  
  // Localhost and internal references
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\.0\.0\.1/i,
  /^https?:\/\/192\.168\./i,
  /^https?:\/\/10\./i,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./i
];

/**
 * Content security validation
 */
interface ContentSecurityValidationResult {
  valid: boolean;
  violations: Array<{
    type: string;
    value: string;
    reason: string;
  }>;
}

/**
 * Check URL safety
 * 
 * @param url URL to check
 * @returns Whether URL is safe
 */
function isUrlSafe(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Check if URL is valid
    new URL(url);
    
    // Check against unsafe patterns
    return !UNSAFE_URL_PATTERNS.some(pattern => pattern.test(url));
  } catch (error) {
    // Invalid URL
    return false;
  }
}

/**
 * Validate content URLs
 * 
 * @param content Content object to validate
 * @returns Validation result
 */
function validateContentUrls(content: any): ContentSecurityValidationResult {
  const result: ContentSecurityValidationResult = {
    valid: true,
    violations: []
  };
  
  // Extract URLs from content based on content type
  const urls: Array<{ type: string, value: string }> = [];
  
  // Handle content URLs based on structure
  if (content) {
    // Media URLs
    if (content.media_urls && Array.isArray(content.media_urls)) {
      content.media_urls.forEach((url: string) => {
        urls.push({ type: 'media', value: url });
      });
    }
    
    // Link URL
    if (content.link_url) {
      urls.push({ type: 'link', value: content.link_url });
    }
    
    // Image URL
    if (content.image_url) {
      urls.push({ type: 'image', value: content.image_url });
    }
    
    // External URLs
    if (content.external_urls && Array.isArray(content.external_urls)) {
      content.external_urls.forEach((url: string) => {
        urls.push({ type: 'external', value: url });
      });
    }
    
    // Embedded URLs
    if (content.embedded_url) {
      urls.push({ type: 'embedded', value: content.embedded_url });
    }
  }
  
  // Check each URL for safety
  urls.forEach(({ type, value }) => {
    if (!isUrlSafe(value)) {
      result.valid = false;
      result.violations.push({
        type,
        value,
        reason: 'URL failed security validation'
      });
    }
  });
  
  return result;
}

/**
 * Content security middleware
 * 
 * @param request Fastify request
 * @param reply Fastify reply
 * @param context Security context
 * @returns Success flag
 */
export async function contentSecurityCheck(
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
): Promise<boolean> {
  // Skip for non-content routes
  if (!request.url.includes('/api/v1/content')) {
    return true;
  }
  
  try {
    // Check content in request body
    if (request.body && typeof request.body === 'object') {
      const result = validateContentUrls(request.body);
      
      if (!result.valid) {
        logger.warn('Content security violation', {
          url: request.url,
          userId: request.user?.id,
          violations: result.violations
        });
        
        reply.code(400).send({
          data: null,
          errors: [{
            code: 'CONTENT_SECURITY_VIOLATION',
            message: 'One or more URLs failed security validation',
            details: result.violations
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
        
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Error in content security middleware', { error, path: request.url });
    
    // Continue request but add warning to context
    context.contentSecurityError = error.message;
    
    return true;
  }
}
