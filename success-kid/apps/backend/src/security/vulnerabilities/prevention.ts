/**
 * Vulnerability Prevention
 * 
 * This module provides functionality for preventing security vulnerabilities.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { vulnerabilityScanner, VulnerabilityScanOptions } from './scanner';
import { ValidationError } from '../../errors';
import { AuditAction, AuditResource } from '../../audit/types';
import { auditService } from '../../audit/service';
import { SecuritySeverity } from '../types';

/**
 * File upload validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * File upload information
 */
export interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  data?: Buffer;
  size?: number;
}

/**
 * Vulnerability Prevention Service
 */
export class VulnerabilityPreventionService {
  private scanOptions: VulnerabilityScanOptions;
  
  /**
   * Create a new vulnerability prevention service
   */
  constructor(scanOptions: Partial<VulnerabilityScanOptions> = {}) {
    this.scanOptions = scanOptions;
  }
  
  /**
   * Configure security for a Fastify instance
   */
  configureSecurity(app: FastifyInstance): void {
    logger.info('Configuring vulnerability prevention');
    
    // Register security hook for scanning requests
    app.addHook('preHandler', async (request, reply) => {
      // Skip security scanning for certain routes
      if (request.url.startsWith('/health') || 
          request.url.startsWith('/api/v1/health')) {
        return;
      }
      
      // Scan request for vulnerabilities
      const scanResult = vulnerabilityScanner.scanRequest(request);
      
      // Handle vulnerabilities based on severity
      if (!scanResult.passed) {
        // Find critical vulnerabilities
        const criticalVulnerabilities = scanResult.vulnerabilities.filter(
          v => v.severity === SecuritySeverity.CRITICAL
        );
        
        if (criticalVulnerabilities.length > 0) {
          // Log and audit the critical vulnerability
          logger.warn('Critical security vulnerability detected in request', {
            url: request.url,
            method: request.method,
            ip: request.ip,
            vulnerabilities: criticalVulnerabilities.map(v => ({
              name: v.name,
              location: v.location
            }))
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
              url: request.url,
              method: request.method,
              vulnerabilities: criticalVulnerabilities.map(v => ({
                name: v.name,
                location: v.location
              }))
            }
          });
          
          // Block the request with a generic error
          throw new ValidationError('Request validation failed', {
            message: 'The request contains potentially malicious content and has been blocked.'
          });
        }
        
        // For non-critical vulnerabilities, log but allow
        if (scanResult.vulnerabilities.length > 0) {
          logger.info('Potential security vulnerabilities detected in request', {
            url: request.url,
            method: request.method,
            ip: request.ip,
            vulnerabilities: scanResult.vulnerabilities.map(v => ({
              name: v.name,
              severity: v.severity,
              location: v.location
            })),
            score: scanResult.score
          });
        }
      }
    });
    
    logger.info('Vulnerability prevention configured successfully');
  }
  
  /**
   * Sanitize input data to prevent common vulnerabilities
   */
  sanitizeInput(input: any, context: string): any {
    try {
      // If input is null or not an object/string, return as is
      if (input === null || (typeof input !== 'object' && typeof input !== 'string')) {
        return input;
      }
      
      // Handle string input
      if (typeof input === 'string') {
        return this.sanitizeString(input);
      }
      
      // Handle array input
      if (Array.isArray(input)) {
        return input.map(item => this.sanitizeInput(item, context));
      }
      
      // Handle object input
      const result: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(input)) {
        // Sanitize keys to prevent prototype pollution
        const sanitizedKey = this.sanitizeKey(key);
        
        // Sanitize values recursively
        result[sanitizedKey] = this.sanitizeInput(value, `${context}.${sanitizedKey}`);
      }
      
      return result;
    } catch (error) {
      logger.error('Error sanitizing input', { error, context });
      return input; // Return original input on error
    }
  }
  
  /**
   * Validate a file upload for security issues
   */
  async validateFileUpload(file: FileUpload): Promise<ValidationResult> {
    const errors: string[] = [];
    
    try {
      // Validate file extension/type
      if (!this.isAllowedFileType(file.filename, file.mimetype)) {
        errors.push(`File type "${file.mimetype}" is not allowed`);
      }
      
      // Validate file size
      if (file.size && file.size > this.getMaxFileSizeForMimetype(file.mimetype)) {
        errors.push(`File size exceeds maximum allowed size for ${file.mimetype}`);
      }
      
      // Scan file content for malicious code
      if (file.data) {
        const contentIssues = await this.scanFileContent(file);
        errors.push(...contentIssues);
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      logger.error('Error validating file upload', { error, filename: file.filename });
      errors.push('Error validating file upload');
      
      return {
        valid: false,
        errors
      };
    }
  }
  
  /**
   * Prevent SQL injection attacks
   */
  preventInjection(input: string, context: string): string {
    // Escape common SQL injection characters
    let sanitized = input
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/\bdrop\b/gi, '')
      .replace(/\bdelete\b/gi, '')
      .replace(/\bupdate\b/gi, '')
      .replace(/\binsert\b/gi, '')
      .replace(/\bselect\b/gi, '')
      .replace(/\bunion\b/gi, '')
      .replace(/\bexec\b/gi, '')
      .replace(/\balter\b/gi, '');
    
    return sanitized;
  }
  
  /**
   * Sanitize a string value
   */
  private sanitizeString(input: string): string {
    // HTML encoding to prevent XSS
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  /**
   * Sanitize an object key to prevent prototype pollution
   */
  private sanitizeKey(key: string): string {
    // Prevent prototype pollution attacks
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return `_${key}`;
    }
    
    return key;
  }
  
  /**
   * Check if file type is allowed
   */
  private isAllowedFileType(filename: string, mimetype: string): boolean {
    // Get file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    
    // Allowed file types
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'txt', 'pdf', 'docx', 'xlsx', 'csv'];
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    return (
      (extension && allowedExtensions.includes(extension)) ||
      allowedMimeTypes.includes(mimetype)
    );
  }
  
  /**
   * Get maximum file size for a mimetype
   */
  private getMaxFileSizeForMimetype(mimetype: string): number {
    // Default to 5MB
    const defaultSize = 5 * 1024 * 1024;
    
    // Different limits for different file types
    if (mimetype.startsWith('image/')) {
      return 10 * 1024 * 1024; // 10MB for images
    }
    
    if (mimetype === 'application/pdf') {
      return 20 * 1024 * 1024; // 20MB for PDFs
    }
    
    if (mimetype === 'text/plain' || mimetype === 'text/csv') {
      return 2 * 1024 * 1024; // 2MB for text files
    }
    
    return defaultSize;
  }
  
  /**
   * Scan file content for security issues
   */
  private async scanFileContent(file: FileUpload): Promise<string[]> {
    const issues: string[] = [];
    
    // Check for executable content
    if (file.data) {
      // Check for file signatures/magic bytes
      const signature = file.data.slice(0, 4).toString('hex');
      
      // Executable file signatures
      const executableSignatures = [
        '4d5a', // MZ (DOS/PE)
        '7f454c46', // ELF
        'cafebabe', // Java class
        '504b0304' // ZIP/JAR
      ];
      
      if (executableSignatures.some(sig => signature.startsWith(sig))) {
        issues.push('File appears to contain executable code');
      }
      
      // For text files, scan for malicious content
      if (file.mimetype.startsWith('text/')) {
        const text = file.data.toString('utf8');
        
        // Check for script tags
        if (/<script[\s\S]*?>/i.test(text)) {
          issues.push('File contains script tags');
        }
        
        // Check for potentially malicious commands
        if (/(rm|del)[ -].*[rf]/i.test(text)) {
          issues.push('File contains potentially dangerous commands');
        }
      }
    }
    
    return issues;
  }
}

// Export singleton instance
export const vulnerabilityPreventionService = new VulnerabilityPreventionService();
