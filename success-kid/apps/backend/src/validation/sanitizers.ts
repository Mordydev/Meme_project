/**
 * Content Sanitization Utilities
 * 
 * Provides utilities for sanitizing user-generated content to prevent XSS attacks
 */
import sanitizeHtml from 'sanitize-html';
import { logger } from '../lib/logger';

/**
 * Default HTML sanitization options
 */
const DEFAULT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'b', 'i', 'strong', 'em', 'a', 'span'
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    code: ['class'],
    span: ['class']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    // Ensure all links open in a new tab with proper security attributes
    'a': sanitizeHtml.simpleTransform('a', {
      target: '_blank', 
      rel: 'noopener noreferrer'
    })
  },
  selfClosing: ['br', 'hr'],
  // Prevent script execution
  disallowedTagsMode: 'discard'
};

/**
 * More restrictive sanitization options for comments and limited formatting
 */
const COMMENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  ...DEFAULT_SANITIZE_OPTIONS,
  allowedTags: ['p', 'br', 'b', 'i', 'strong', 'em', 'a'],
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * @param content HTML content to sanitize
 * @param options Sanitization options (optional)
 * @returns Sanitized HTML content
 */
export function sanitizeContent(content: string, options?: sanitizeHtml.IOptions): string {
  try {
    return sanitizeHtml(content, options || DEFAULT_SANITIZE_OPTIONS);
  } catch (error) {
    logger.error('Error sanitizing content', { error });
    // Return empty string in case of error to prevent potential XSS
    return '';
  }
}

/**
 * Sanitize text for a comment with limited HTML formatting
 * 
 * @param commentText Comment text to sanitize
 * @returns Sanitized comment text
 */
export function sanitizeCommentText(commentText: string): string {
  return sanitizeContent(commentText, COMMENT_SANITIZE_OPTIONS);
}

/**
 * Sanitize a plain text input (strip all HTML)
 * 
 * @param text Text to sanitize
 * @returns Plain text with all HTML removed
 */
export function sanitizePlainText(text: string): string {
  return sanitizeHtml(text, { allowedTags: [] });
}

/**
 * Sanitize a URL
 * 
 * @param url URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  try {
    // Basic validation
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return '';
    }
    
    // Parse the URL to validate it
    const parsedUrl = new URL(url);
    return parsedUrl.toString();
  } catch (error) {
    logger.debug('Invalid URL sanitized', { url });
    return '';
  }
}

/**
 * Sanitize user input for database queries
 * (Note: This is a backup; parameterized queries should be used instead)
 * 
 * @param input User input to sanitize
 * @returns Sanitized input safe for database
 */
export function sanitizeDatabaseInput(input: string): string {
  // Remove SQL injection attempts
  return input
    .replace(/[';\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}
