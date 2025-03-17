/**
 * Vulnerability Prevention Service
 * 
 * Service for detecting and preventing security vulnerabilities
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { auditService } from '../../auth/audit/service';
import { scanRequest, RequestScanResult } from './scanner';
import { 
  securityPatterns, 
  VulnerabilityType, 
  VulnerabilitySeverity 
} from './patterns';

/**
 * File upload validation result
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  metadata: {
    fileType: string;
    fileSize: number;
    filename: string;
  };
}

/**
 * Vulnerability prevention configuration
 */
interface VulnerabilityPreventionConfig {
  enabled: boolean;
  blockRequests: boolean;
  logDetections: boolean;
  minSeverityToBlock: VulnerabilitySeverity;
  minScoreToBlock: number;
  excludedPaths: string[];
  excludedMethods: string[];
  maxUploadSize: number;
  allowedFileTypes: string[];
}

/**
 * Default vulnerability prevention configuration
 */
const DEFAULT_CONFIG: VulnerabilityPreventionConfig = {
  enabled: true,
  blockRequests: true,
  logDetections: true,
  minSeverityToBlock: VulnerabilitySeverity.HIGH,
  minScoreToBlock: 70,
  excludedPaths: ['/api/v1/webhook', '/health', '/metrics'],
  excludedMethods: ['OPTIONS'],
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json'
  ]
};

/**
 * Vulnerability Prevention Service Class
 */
export class VulnerabilityPreventionService {
  private config: VulnerabilityPreventionConfig;
  
  constructor(config: Partial<VulnerabilityPreventionConfig> = {}) {
    // Merge default and provided configuration
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
  }
  
  /**
   * Configure security for a Fastify instance
   * 
   * @param app Fastify instance
   */
  configureSecurity(app: FastifyInstance): void {
    // Apply security middleware
    app.addHook('preHandler', async (request, reply) => {
      // Skip excluded paths and methods
      if (this.isExcluded(request)) {
        return;
      }
      
      // Scan request for vulnerabilities
      const scanResult = this.scanRequest(request);
      
      // Store scan result in request
      request.securityScan = scanResult;
      
      // Check if request should be blocked
      if (this.shouldBlockRequest(scanResult)) {
        // Log suspicious activity
        this.logSuspiciousActivity(request, scanResult);
        
        // Block request
        return reply.code(400).send({
          data: null,
          errors: [{
            code: 'SECURITY_VIOLATION',
            message: 'Request contains potentially malicious content'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
    });
    
    // Log security scan results after handling
    app.addHook('onResponse', (request, reply, done) => {
      // Skip excluded paths
      if (this.isExcluded(request) || !request.securityScan) {
        done();
        return;
      }
      
      // Log scan results for analysis
      if (this.config.logDetections && request.securityScan.hasVulnerabilities) {
        logger.warn('Security vulnerabilities detected', {
          path: request.url,
          method: request.method,
          ip: request.ip,
          vulnerabilities: request.securityScan.detections.length,
          riskScore: request.securityScan.riskScore,
          highestSeverity: request.securityScan.highestSeverity,
          statusCode: reply.statusCode
        });
      }
      
      done();
    });
  }
  
  /**
   * Check if a request should be excluded from security scanning
   * 
   * @param request Fastify request
   * @returns Whether request should be excluded
   */
  private isExcluded(request: FastifyRequest): boolean {
    // Skip if disabled
    if (!this.config.enabled) {
      return true;
    }
    
    // Check method exclusions
    if (this.config.excludedMethods.includes(request.method)) {
      return true;
    }
    
    // Check path exclusions
    return this.config.excludedPaths.some(pattern => {
      if (pattern.includes('*')) {
        // Handle wildcard patterns
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(request.url);
      }
      return request.url.startsWith(pattern);
    });
  }
  
  /**
   * Scan a request for security vulnerabilities
   * 
   * @param request Fastify request
   * @returns Scan result
   */
  scanRequest(request: FastifyRequest): RequestScanResult {
    return scanRequest(request);
  }
  
  /**
   * Check if a request should be blocked based on scan results
   * 
   * @param scanResult Request scan result
   * @returns Whether request should be blocked
   */
  private shouldBlockRequest(scanResult: RequestScanResult): boolean {
    // Skip if blocking is disabled
    if (!this.config.blockRequests) {
      return false;
    }
    
    // Check severity threshold
    if (scanResult.highestSeverity) {
      const severityLevels = {
        [VulnerabilitySeverity.LOW]: 1,
        [VulnerabilitySeverity.MEDIUM]: 2,
        [VulnerabilitySeverity.HIGH]: 3,
        [VulnerabilitySeverity.CRITICAL]: 4
      };
      
      const detectedLevel = severityLevels[scanResult.highestSeverity];
      const thresholdLevel = severityLevels[this.config.minSeverityToBlock];
      
      if (detectedLevel >= thresholdLevel) {
        return true;
      }
    }
    
    // Check risk score threshold
    if (scanResult.riskScore >= this.config.minScoreToBlock) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Log suspicious activity
   * 
   * @param request Fastify request
   * @param scanResult Request scan result
   */
  private logSuspiciousActivity(
    request: FastifyRequest,
    scanResult: RequestScanResult
  ): void {
    // Log to application log
    logger.warn('Blocked suspicious request', {
      path: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: request.user?.id,
      vulnerabilities: scanResult.detections.map(d => ({
        type: d.type,
        severity: d.severity,
        location: d.location
      })),
      riskScore: scanResult.riskScore
    });
    
    // Log to audit log if available
    if (auditService) {
      auditService.logEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        userId: request.user?.id,
        sessionId: request.session?.id,
        ip: request.ip,
        userAgent: request.headers['user-agent'] as string,
        metadata: {
          path: request.url,
          method: request.method,
          detections: scanResult.detections.length,
          riskScore: scanResult.riskScore,
          highestSeverity: scanResult.highestSeverity
        },
        severity: 'ERROR'
      });
    }
  }
  
  /**
   * Sanitize input to prevent injection
   * 
   * @param input Input to sanitize
   * @param context Context for sanitization (e.g., 'html', 'sql', 'command')
   * @returns Sanitized input
   */
  sanitizeInput(input: any, context: string = 'html'): any {
    if (input == null) {
      return input;
    }
    
    if (typeof input === 'string') {
      return this.sanitizeString(input, context);
    }
    
    if (typeof input === 'object') {
      return this.sanitizeObject(input, context);
    }
    
    return input;
  }
  
  /**
   * Sanitize a string value
   * 
   * @param value String to sanitize
   * @param context Sanitization context
   * @returns Sanitized string
   */
  private sanitizeString(value: string, context: string): string {
    switch (context) {
      case 'html':
        return this.sanitizeHtml(value);
        
      case 'sql':
        return this.sanitizeSql(value);
        
      case 'command':
        return this.sanitizeCommand(value);
        
      case 'path':
        return this.sanitizePath(value);
        
      default:
        return this.sanitizeHtml(value);
    }
  }
  
  /**
   * Sanitize an object recursively
   * 
   * @param obj Object to sanitize
   * @param context Sanitization context
   * @returns Sanitized object
   */
  private sanitizeObject(obj: any, context: string): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeInput(item, context));
    }
    
    const result: Record<string, any> = {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = this.sanitizeInput(obj[key], context);
      }
    }
    
    return result;
  }
  
  /**
   * Sanitize HTML content
   * 
   * @param html HTML content to sanitize
   * @returns Sanitized HTML
   */
  private sanitizeHtml(html: string): string {
    // Replace < and > with entities
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;');
  }
  
  /**
   * Sanitize SQL input
   * 
   * @param input SQL input to sanitize
   * @returns Sanitized input
   */
  private sanitizeSql(input: string): string {
    // Note: In a real implementation, use prepared statements instead
    return input
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\')
      .replace(/--/g, '');
  }
  
  /**
   * Sanitize command input
   * 
   * @param input Command input to sanitize
   * @returns Sanitized input
   */
  private sanitizeCommand(input: string): string {
    // Remove potentially dangerous characters
    return input
      .replace(/[;&|`$()]/g, '')
      .replace(/\r/g, '')
      .replace(/\n/g, '');
  }
  
  /**
   * Sanitize file path
   * 
   * @param path File path to sanitize
   * @returns Sanitized path
   */
  private sanitizePath(path: string): string {
    // Remove directory traversal sequences
    return path
      .replace(/\.\.\//g, '')
      .replace(/\.\.\\/g, '')
      .replace(/\/\//g, '/')
      .replace(/\\\\/g, '\\');
  }
  
  /**
   * Validate file upload
   * 
   * @param file File upload to validate
   * @returns Validation result
   */
  async validateFileUpload(file: any): Promise<FileValidationResult> {
    const errors: string[] = [];
    
    // Check if file exists
    if (!file) {
      errors.push('No file provided');
      
      return {
        valid: false,
        errors,
        metadata: {
          fileType: 'unknown',
          fileSize: 0,
          filename: 'unknown'
        }
      };
    }
    
    const metadata = {
      fileType: file.mimetype || 'unknown',
      fileSize: file.size || 0,
      filename: file.filename || 'unknown'
    };
    
    // Check file size
    if (metadata.fileSize > this.config.maxUploadSize) {
      errors.push(`File size exceeds maximum allowed size of ${this.config.maxUploadSize} bytes`);
    }
    
    // Check file type
    if (!this.config.allowedFileTypes.includes(metadata.fileType)) {
      errors.push(`File type ${metadata.fileType} is not allowed`);
    }
    
    // Check filename for suspicious patterns
    if (/[;&|`$]/g.test(metadata.filename)) {
      errors.push('Filename contains invalid characters');
    }
    
    // Scan the first few bytes for file type verification
    if (file.buffer && file.buffer.length > 0) {
      const isValid = await this.verifyFileContent(file.buffer, metadata.fileType);
      
      if (!isValid) {
        errors.push('File content does not match declared type');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      metadata
    };
  }
  
  /**
   * Verify file content matches declared type
   * 
   * @param buffer File buffer
   * @param declaredType Declared file type
   * @returns Whether content matches type
   */
  private async verifyFileContent(buffer: Buffer, declaredType: string): Promise<boolean> {
    // Check file signatures (magic numbers)
    const signatures: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38]],
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
      // Add more signatures as needed
    };
    
    // Check signature if available
    const typeSignatures = signatures[declaredType];
    
    if (typeSignatures && buffer.length >= 4) {
      // Check each possible signature for the type
      return typeSignatures.some(signature => {
        for (let i = 0; i < signature.length; i++) {
          if (buffer[i] !== signature[i]) {
            return false;
          }
        }
        return true;
      });
    }
    
    // If no signature check available, return true
    return true;
  }
}

// Export singleton instance
export const vulnerabilityService = new VulnerabilityPreventionService();
