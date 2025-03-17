/**
 * Security Service
 * 
 * This is the main entry point for all security-related functionality.
 * It manages security policies, middleware, and configuration.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { AuditAction, AuditResource } from '../../audit/types';
import { auditService } from '../../audit/service';
import { 
  SecurityConfig, 
  SecurityMiddleware, 
  SecurityPolicy,
  SecurityScanResult,
  SecuritySeverity,
  Vulnerability
} from '../types';
import { ISecurityService, SecurityServiceOptions } from './types';
import { SecurityPolicyError } from '../errors';
import { registerSecurityMiddleware } from '../middleware';
import { defaultSecurityPolicies } from './policies';
import { defaultSecurityConfig } from './defaults';

/**
 * Security Service Implementation
 */
export class SecurityService implements ISecurityService {
  private policies: Map<string, SecurityPolicy> = new Map();
  private config: SecurityConfig;
  private middleware: Map<string, SecurityMiddleware> = new Map();
  private initialized: boolean = false;

  /**
   * Create a new security service
   */
  constructor(options: SecurityServiceOptions = {}) {
    // Initialize with default config merged with provided options
    this.config = {
      ...defaultSecurityConfig,
      ...(options.config || {})
    };

    // Register default policies and any provided ones
    const allPolicies = [...(options.policies || []), ...defaultSecurityPolicies];
    allPolicies.forEach(policy => this.registerPolicy(policy));

    logger.info('Security service created');
  }

  /**
   * Initialize the security service and apply security settings to the app
   */
  async initialize(app: FastifyInstance): Promise<void> {
    if (this.initialized) {
      logger.warn('Security service already initialized');
      return;
    }

    logger.info('Initializing security service...');

    // Register security middleware
    registerSecurityMiddleware(app, this.config);

    // Register global security hook
    app.addHook('preHandler', async (request, reply) => {
      await this.applyMatchingPolicies(request, reply);
    });

    // Log successful initialization
    logger.info('Security service initialized successfully');
    this.initialized = true;
    
    // Audit the security service initialization
    await auditService.logEvent({
      userId: 'system',
      action: 'security.initialized',
      resource: AuditResource.SYSTEM,
      ip: '127.0.0.1',
      status: 'success',
      metadata: {
        policies: Array.from(this.policies.keys()),
        config: {
          contentSecurityPolicy: this.config.contentSecurityPolicy.enabled,
          cors: this.config.cors.enabled,
          csrf: this.config.csrf.enabled,
          rateLimiting: this.config.rateLimiting.enabled
        }
      }
    });
  }

  /**
   * Register a security policy
   */
  registerPolicy(policy: SecurityPolicy): void {
    if (!policy.id) {
      policy.id = uuidv4();
    }

    this.policies.set(policy.id, { ...policy });
    logger.debug(`Security policy registered: ${policy.name} (${policy.id})`);
  }

  /**
   * Apply a security policy to a request
   */
  async applyPolicy(policyId: string, request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const policy = this.getPolicy(policyId);
    
    if (!policy) {
      throw new SecurityPolicyError(`Security policy not found: ${policyId}`);
    }

    if (!policy.enabled) {
      logger.debug(`Policy ${policy.name} is disabled, skipping`);
      return;
    }

    logger.debug(`Applying security policy: ${policy.name}`);

    // Apply each middleware in the policy
    for (const middleware of policy.middleware) {
      await middleware(request, reply);
      
      // If response has been sent, stop processing
      if (reply.sent) {
        break;
      }
    }
  }

  /**
   * Apply all matching policies to a request
   */
  private async applyMatchingPolicies(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const url = request.url;
    
    // Sort policies by priority (higher number = higher priority)
    const sortedPolicies = Array.from(this.policies.values())
      .filter(policy => policy.enabled)
      .sort((a, b) => b.priority - a.priority);
    
    for (const policy of sortedPolicies) {
      // Skip if already responded
      if (reply.sent) {
        break;
      }
      
      // Check if policy applies to this path
      const matchesPath = policy.pathPatterns.some(pattern => {
        // Convert glob pattern to regex pattern
        const regexPattern = pattern
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(url);
      });
      
      // Check if policy is excluded for this path
      const isExcluded = policy.excludePatterns?.some(pattern => {
        const regexPattern = pattern
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(url);
      }) || false;
      
      if (matchesPath && !isExcluded) {
        try {
          await this.applyPolicy(policy.id, request, reply);
        } catch (error) {
          logger.error(`Error applying security policy ${policy.name}:`, { error });
          throw error;
        }
      }
    }
  }

  /**
   * Get a security policy by ID
   */
  getPolicy(policyId: string): SecurityPolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Get all security policies
   */
  getPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Update a security policy
   */
  updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): SecurityPolicy {
    const policy = this.getPolicy(policyId);
    
    if (!policy) {
      throw new SecurityPolicyError(`Security policy not found: ${policyId}`);
    }
    
    const updatedPolicy = { ...policy, ...updates };
    this.policies.set(policyId, updatedPolicy);
    
    logger.info(`Security policy updated: ${policy.name} (${policyId})`);
    
    return updatedPolicy;
  }

  /**
   * Enable or disable a security policy
   */
  togglePolicy(policyId: string, enabled: boolean): SecurityPolicy {
    return this.updatePolicy(policyId, { enabled });
  }

  /**
   * Get the current security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Update the security configuration
   */
  updateConfig(updates: Partial<SecurityConfig>): SecurityConfig {
    // Deep merge the updates with the current config
    this.config = this.deepMerge(this.config, updates);
    
    logger.info('Security configuration updated');
    
    return { ...this.config };
  }

  /**
   * Scan a request for security vulnerabilities
   */
  async scanRequest(request: FastifyRequest): Promise<SecurityScanResult> {
    const startTime = process.hrtime();
    const vulnerabilities: Vulnerability[] = [];
    
    // Check for suspicious query parameters
    const suspiciousParams = this.detectSuspiciousQueryParams(request);
    if (suspiciousParams.length > 0) {
      vulnerabilities.push({
        id: uuidv4(),
        name: 'Suspicious Query Parameters',
        description: 'Request contains potentially malicious query parameters',
        severity: SecuritySeverity.MEDIUM,
        location: 'query',
        data: { params: suspiciousParams }
      });
    }
    
    // Check for suspicious headers
    const suspiciousHeaders = this.detectSuspiciousHeaders(request);
    if (suspiciousHeaders.length > 0) {
      vulnerabilities.push({
        id: uuidv4(),
        name: 'Suspicious Headers',
        description: 'Request contains potentially malicious headers',
        severity: SecuritySeverity.LOW,
        location: 'headers',
        data: { headers: suspiciousHeaders }
      });
    }
    
    // Check for suspicious body content
    if (request.body && typeof request.body === 'object') {
      const suspiciousBodyFields = this.detectSuspiciousBodyContent(request.body);
      if (suspiciousBodyFields.length > 0) {
        vulnerabilities.push({
          id: uuidv4(),
          name: 'Suspicious Body Content',
          description: 'Request body contains potentially malicious content',
          severity: SecuritySeverity.HIGH,
          location: 'body',
          data: { fields: suspiciousBodyFields }
        });
      }
    }
    
    // Calculate scan duration
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    // Calculate security score (0-100)
    const score = this.calculateSecurityScore(vulnerabilities);
    
    // Log if vulnerabilities found
    if (vulnerabilities.length > 0) {
      logger.warn('Security vulnerabilities detected in request', {
        url: request.url,
        method: request.method,
        vulnerabilities: vulnerabilities.map(v => ({ name: v.name, severity: v.severity }))
      });
      
      // Audit security event
      await auditService.logEvent({
        userId: request.user?.id || 'anonymous',
        action: 'security.vulnerability_detected',
        resource: AuditResource.SYSTEM,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        status: 'failure',
        metadata: {
          url: request.url,
          method: request.method,
          vulnerabilities: vulnerabilities.map(v => ({ name: v.name, severity: v.severity }))
        }
      });
    }
    
    return {
      vulnerabilities,
      passed: vulnerabilities.length === 0,
      score,
      timestamp: new Date(),
      duration
    };
  }

  /**
   * Generate a security report
   */
  async generateSecurityReport(): Promise<any> {
    const result = {
      timestamp: new Date(),
      policies: this.getPolicies().map(p => ({
        id: p.id,
        name: p.name,
        enabled: p.enabled,
        pathPatterns: p.pathPatterns
      })),
      config: {
        contentSecurityPolicy: {
          enabled: this.config.contentSecurityPolicy.enabled,
        },
        csrf: {
          enabled: this.config.csrf.enabled,
        },
        cors: {
          enabled: this.config.cors.enabled,
          origin: this.config.cors.origin
        },
        rateLimiting: {
          enabled: this.config.rateLimiting.enabled
        },
        headers: {
          enabled: this.config.headers.enabled
        }
      }
    };
    
    return result;
  }

  /**
   * Register security middleware
   */
  registerMiddleware(middleware: SecurityMiddleware, name: string): void {
    this.middleware.set(name, middleware);
    logger.debug(`Security middleware registered: ${name}`);
  }

  /**
   * Get security middleware by name
   */
  getMiddleware(name: string): SecurityMiddleware | undefined {
    return this.middleware.get(name);
  }

  /**
   * Detect suspicious query parameters
   */
  private detectSuspiciousQueryParams(request: FastifyRequest): string[] {
    const suspiciousPatterns = [
      /script/i,
      /[<>]/,
      /(?:'|")\s*or\s+/i,
      /(?:'|")\s*and\s+/i,
      /exec\(/i,
      /SELECT.*FROM/i
    ];
    
    const suspicious: string[] = [];
    
    if (request.query && typeof request.query === 'object') {
      for (const [key, value] of Object.entries(request.query)) {
        if (typeof value === 'string') {
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(value)) {
              suspicious.push(key);
              break;
            }
          }
        }
      }
    }
    
    return suspicious;
  }

  /**
   * Detect suspicious headers
   */
  private detectSuspiciousHeaders(request: FastifyRequest): string[] {
    const suspiciousHeaderPatterns = [
      /(?:'|")\s*or\s+/i,
      /(?:'|")\s*and\s+/i,
      /[<>]/,
      /script/i
    ];
    
    const suspicious: string[] = [];
    
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string') {
        for (const pattern of suspiciousHeaderPatterns) {
          if (pattern.test(value)) {
            suspicious.push(key);
            break;
          }
        }
      }
    }
    
    return suspicious;
  }

  /**
   * Detect suspicious body content
   */
  private detectSuspiciousBodyContent(body: Record<string, any>, path: string = ''): string[] {
    const suspiciousPatterns = [
      /script/i,
      /[<>]/,
      /(?:'|")\s*or\s+/i,
      /(?:'|")\s*and\s+/i,
      /exec\(/i,
      /SELECT.*FROM/i,
      /UNION.*SELECT/i,
      /--/,
      /\/\*.*\*\//
    ];
    
    const suspicious: string[] = [];
    
    for (const [key, value] of Object.entries(body)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(value)) {
            suspicious.push(currentPath);
            break;
          }
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        suspicious.push(...this.detectSuspiciousBodyContent(value, currentPath));
      }
    }
    
    return suspicious;
  }

  /**
   * Calculate security score based on vulnerabilities
   * Returns a score from 0 (critical vulnerabilities) to 100 (no vulnerabilities)
   */
  private calculateSecurityScore(vulnerabilities: Vulnerability[]): number {
    if (vulnerabilities.length === 0) {
      return 100;
    }
    
    // Define severity weights
    const severityWeights = {
      [SecuritySeverity.CRITICAL]: 100,
      [SecuritySeverity.HIGH]: 40,
      [SecuritySeverity.MEDIUM]: 20,
      [SecuritySeverity.LOW]: 5,
      [SecuritySeverity.INFO]: 1
    };
    
    // Calculate total penalty
    let totalPenalty = 0;
    
    for (const vulnerability of vulnerabilities) {
      totalPenalty += severityWeights[vulnerability.severity] || 0;
    }
    
    // Cap penalty at 100
    totalPenalty = Math.min(100, totalPenalty);
    
    // Return score
    return 100 - totalPenalty;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }
}

/**
 * Check if value is an object
 */
function isObject(item: any): item is Record<string, any> {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Create a new security service with default options
 */
export function createSecurityService(options: SecurityServiceOptions = {}): SecurityService {
  return new SecurityService(options);
}

// Export singleton instance
export const securityService = createSecurityService();
