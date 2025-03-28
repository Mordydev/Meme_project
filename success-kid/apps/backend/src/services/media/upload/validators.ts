/**
 * Media File Validators
 * 
 * Provides validation functions for checking file safety, type, and format.
 */
import { PassThrough } from 'stream';
import * as fileType from 'file-type';
import { ValidationResult } from '../../../models/entities/media';
import { logger } from '../../../lib/logger';

// List of allowed MIME types for security
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml'
];

// Maximum file size by MIME type (in bytes)
const MAX_FILE_SIZE: Record<string, number> = {
  'image/jpeg': 10 * 1024 * 1024, // 10MB
  'image/png': 10 * 1024 * 1024,  // 10MB
  'image/gif': 15 * 1024 * 1024,  // 15MB
  'image/webp': 10 * 1024 * 1024, // 10MB
  'image/avif': 10 * 1024 * 1024, // 10MB
  'image/svg+xml': 5 * 1024 * 1024 // 5MB
};

// Default max file size if mime type not specified
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate file type by examining its content
 * This provides security beyond just checking extensions
 * @param buffer File buffer
 * @param filename Original filename
 * @param declaredMimeType Mime type declared by client
 * @returns Validation result
 */
export async function validateFile(
  buffer: Buffer,
  filename: string,
  declaredMimeType?: string
): Promise<ValidationResult> {
  try {
    // Check file size
    const maxSize = declaredMimeType && MAX_FILE_SIZE[declaredMimeType]
      ? MAX_FILE_SIZE[declaredMimeType]
      : DEFAULT_MAX_FILE_SIZE;
      
    if (buffer.length > maxSize) {
      return {
        valid: false,
        reason: `File exceeds maximum size of ${formatFileSize(maxSize)}`
      };
    }
    
    // Detect file type from content
    const detectedType = await fileType.fileTypeFromBuffer(buffer);
    
    // If file type couldn't be detected
    if (!detectedType) {
      // Special case for SVG which might not be detected
      if (declaredMimeType === 'image/svg+xml' && isSvgContent(buffer)) {
        return validateSvgSafety(buffer);
      }
      
      return {
        valid: false,
        reason: 'Could not determine file type from content'
      };
    }
    
    // Check if detected mime type is allowed
    if (!ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
      return {
        valid: false,
        reason: `File type ${detectedType.mime} is not allowed`
      };
    }
    
    // Check if detected type matches declared type
    if (declaredMimeType && detectedType.mime !== declaredMimeType) {
      return {
        valid: false,
        reason: `Declared file type (${declaredMimeType}) doesn't match detected type (${detectedType.mime})`
      };
    }
    
    // Check for specific file type validations
    if (detectedType.mime === 'image/svg+xml' || (declaredMimeType === 'image/svg+xml' && isSvgContent(buffer))) {
      return validateSvgSafety(buffer);
    }
    
    // Additional format-specific validations could be added here
    
    // All validations passed
    return { valid: true };
  } catch (error) {
    logger.error('Error validating file', { filename, error });
    return {
      valid: false,
      reason: 'File validation error'
    };
  }
}

/**
 * Check if buffer content appears to be SVG
 * @param buffer File buffer
 * @returns Whether content appears to be SVG
 */
function isSvgContent(buffer: Buffer): boolean {
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1000)).trim();
  return content.startsWith('<svg') || content.includes('<svg ');
}

/**
 * Validate SVG for security (check for scripts and other malicious content)
 * @param buffer SVG buffer
 * @returns Validation result
 */
function validateSvgSafety(buffer: Buffer): ValidationResult {
  const content = buffer.toString('utf8');
  
  // Check for potentially malicious elements
  const dangerousElements = [
    '<script',
    'javascript:',
    'data:',
    'onload=',
    'onerror=',
    'onclick=',
    '<iframe',
    '<object',
    '<embed',
    'foreignObject'
  ];
  
  for (const element of dangerousElements) {
    if (content.toLowerCase().includes(element.toLowerCase())) {
      return {
        valid: false,
        reason: `SVG contains potentially unsafe elements or attributes: ${element}`
      };
    }
  }
  
  return { valid: true };
}

/**
 * Format file size for human-readable output
 * @param bytes Size in bytes
 * @returns Formatted string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generate a safe filename based on original filename
 * @param originalName Original filename
 * @returns Safe filename
 */
export function generateSafeFilename(originalName: string): string {
  // Remove path components (prevent path traversal)
  const filename = originalName.replace(/^.*[\\\/]/, '');
  
  // Remove or replace special characters
  const sanitized = filename
    .replace(/[^\w\s.-]/g, '')  // Remove special chars except . - _
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .trim()
    .toLowerCase();
    
  // Create random component for uniqueness
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  // Get extension (everything after last dot)
  const extMatch = sanitized.match(/\.([^.]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : '';
  
  // Get base name (everything before last dot)
  const baseName = extMatch ? sanitized.slice(0, -ext.length - 1) : sanitized;
  
  // Truncate base name if too long (max 100 chars)
  const truncated = baseName.length > 100 ? baseName.slice(0, 100) : baseName;
  
  // Combine components
  return ext ? `${truncated}-${timestamp}-${random}.${ext}` : `${truncated}-${timestamp}-${random}`;
}
