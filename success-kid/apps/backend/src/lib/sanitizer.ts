/**
 * HTML Sanitizer
 * 
 * Provides sanitization functions to prevent XSS and other security issues
 * when handling user-generated content.
 */
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance with jsdom window
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Allowed HTML tags and attributes configuration
 */
const ALLOWED_TAGS = [
  // Text formatting
  'p', 'div', 'span', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'b', 'i', 'strong', 'em', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
  
  // Lists
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  
  // Links
  'a',
  
  // Tables
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  
  // Other
  'blockquote', 'code', 'pre'
];

const ALLOWED_ATTRIBUTES = {
  // Global attributes
  '*': ['class', 'id', 'style'],
  
  // Link attributes
  'a': ['href', 'title', 'target', 'rel']
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * @param html The HTML content to sanitize
 * @returns Sanitized HTML content
 */
export function sanitizeHtml(html: string): string {
  if (!html) {
    return '';
  }
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRIBUTES,
    FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    RETURN_TRUSTED_TYPE: false,
    WHOLE_DOCUMENT: false,
    SANITIZE_DOM: true
  });
}

/**
 * Strip all HTML tags, leaving only plain text
 * 
 * @param html The HTML content to strip
 * @returns Plain text with all HTML removed
 */
export function stripHtml(html: string): string {
  if (!html) {
    return '';
  }
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * Sanitize a string to be used as a URL slug
 * 
 * @param text The text to convert to a slug
 * @returns A URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
    .replace(/\-\-+/g, '-');     // Replace multiple - with single -
}
