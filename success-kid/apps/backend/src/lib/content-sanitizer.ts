/**
 * Content Sanitization Utilities
 * 
 * Provides functions for sanitizing user-generated content
 * to prevent XSS and other security issues.
 */
import { logger } from './logger';

/**
 * Sanitize plain text input
 * Removes potentially dangerous characters while preserving normal text
 * 
 * @param input Text input to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(input: string | null | undefined): string {
  if (input == null) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize HTML content
 * Uses a whitelist approach to only allow specific safe HTML elements and attributes
 * 
 * @param input HTML input to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (input == null) return '';
  
  // For a proper implementation, we would use a library like sanitize-html
  // This is a simplified placeholder that converts HTML to plain text
  // In a real implementation, replace this with a proper HTML sanitizer
  
  const plainText = input
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
    
  return plainText;
}

/**
 * Sanitize URL input
 * Ensures URLs are valid and safe
 * 
 * @param input URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(input: string | null | undefined): string {
  if (input == null) return '';
  
  try {
    // Try to parse as URL to validate
    const url = new URL(input);
    
    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      logger.warn('Attempted use of disallowed URL protocol', { url: input });
      return '';
    }
    
    return url.toString();
  } catch (error) {
    // If URL parsing fails, input is invalid
    logger.warn('Invalid URL sanitized', { url: input });
    return '';
  }
}

/**
 * Sanitize an array of URLs
 * 
 * @param urls Array of URLs to sanitize
 * @returns Array of sanitized URLs with invalid ones removed
 */
export function sanitizeUrls(urls: string[] | null | undefined): string[] {
  if (!urls || !Array.isArray(urls)) return [];
  
  return urls
    .map(url => sanitizeUrl(url))
    .filter(url => url !== '');
}

/**
 * Sanitize user-generated content based on content type
 * 
 * @param content Content to sanitize
 * @param type Type of content (text, html, url, urls)
 * @returns Sanitized content
 */
export function sanitizeContent(
  content: any,
  type: 'text' | 'html' | 'url' | 'urls' = 'text'
): any {
  if (content == null) return type === 'urls' ? [] : '';
  
  switch (type) {
    case 'text':
      return sanitizeText(content);
    case 'html':
      return sanitizeHtml(content);
    case 'url':
      return sanitizeUrl(content);
    case 'urls':
      return sanitizeUrls(Array.isArray(content) ? content : [content]);
    default:
      return sanitizeText(content);
  }
}
