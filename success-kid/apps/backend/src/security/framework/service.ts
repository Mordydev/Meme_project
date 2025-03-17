/**
 * Security Service
 * 
 * Core service that manages security policies and configuration
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { 
  SecurityPolicy, 
  SecurityConfig,
  SecurityMiddlewareFunction,
  SecurityContext,
  SecurityCheck
} from './types';
import { defaultPolicies } from './policies';

/**
 * Security Service for managing security policies and configuration
 */
export class SecurityService {
  private policies: SecurityPolicy[] = [];
  private config: SecurityConfig;
  private fastify: FastifyInstance;
  
  /**
   * Create a new security service
   * 
   * @param fastify Fastify instance
   */
  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.config = this.fastify.config.security || {};
    this.policies = [...defaultPolicies];
    
    // Sort policies by priority (higher values first)
    this.policies.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Add a security policy
   * 
   * @param policy Security policy to add
   */
  addPolicy(policy: SecurityPolicy): void {
    this.policies.push(policy);
    
    // Re-sort policies by priority
    this.policies.sort((a, b) => b.priority - a.priority);
    
    logger.debug(`Added security policy: ${policy.name}`);
  }
  
  /**
   * Get all active security policies
   * 
   * @returns Active security policies
   */
  getActivePolicies(): SecurityPolicy[] {
    return this.policies.filter(policy => policy.enabled);
  }
  
  /**
   * Get a specific security policy by ID
   * 
   * @param id Policy ID
   * @returns Security policy or undefined if not found
   */
  getPolicy(id: string): SecurityPolicy | undefined {
    return this.policies.find(policy => policy.id === id);
  }
  
  /**
   * Enable a security policy
   * 
   * @param id Policy ID
   * @returns Whether the policy was found and enabled
   */
  enablePolicy(id: string): boolean {
    const policy = this.getPolicy(id);
    
    if (policy) {
      policy.enabled = true;
      logger.info(`Enabled security policy: ${policy.name}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Disable a security policy
   * 
   * @param id Policy ID
   * @returns Whether the policy was found and disabled
   */
  disablePolicy(id: string): boolean {
    const policy = this.getPolicy(id);
    
    if (policy) {
      policy.enabled = false;
      logger.info(`Disabled security policy: ${policy.name}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Apply security policies to a request
   * 
   * @param request Fastify request
   * @param reply Fastify reply
   */
  async applyPolicies(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
    // Skip if no security context (should never happen)
    if (!request.security) {
      request.security = {
        context: {},
        checks: []
      };
    }
    
    // Get active policies
    const activePolicies = this.getActivePolicies();
    
    try {
      // Find policies that match the current path
      const matchingPolicies = activePolicies.filter(policy => {
        // Check if path matches any include patterns
        const matchesInclude = policy.pathPatterns.some(pattern => {
          const regex = new RegExp(pattern);
          return regex.test(request.url);
        });
        
        // Check if path matches any exclude patterns
        const matchesExclude = policy.excludePatterns?.some(pattern => {
          const regex = new RegExp(pattern);
          return regex.test(request.url);
        }) || false;
        
        return matchesInclude && !matchesExclude;
      });
      
      // Apply each matching policy's middleware
      for (const policy of matchingPolicies) {
        // Track that we're applying this policy
        request.security.checks.push({
          policyId: policy.id,
          policyName: policy.name,
          startTime: Date.now(),
          success: false
        });
        
        const checkIndex = request.security.checks.length - 1;
        
        // Apply each middleware in the policy
        for (const middleware of policy.middleware) {
          const middlewareStart = Date.now();
          
          try {
            // Apply middleware
            const result = await middleware(request, reply, request.security.context);
            
            // If middleware returns false, stop processing
            if (result === false) {
              // Update check with failure
              request.security.checks[checkIndex].success = false;
              request.security.checks[checkIndex].endTime = Date.now();
              request.security.checks[checkIndex].duration = Date.now() - request.security.checks[checkIndex].startTime;
              request.security.checks[checkIndex].error = 'Middleware rejected request';
              
              return false;
            }
          } catch (error) {
            // Log error and fail the check
            logger.error(`Security middleware error in policy ${policy.name}`, { error, url: request.url });
            
            // Update check with error
            request.security.checks[checkIndex].success = false;
            request.security.checks[checkIndex].endTime = Date.now();
            request.security.checks[checkIndex].duration = Date.now() - request.security.checks[checkIndex].startTime;
            request.security.checks[checkIndex].error = error instanceof Error ? error.message : 'Unknown error';
            
            return false;
          }
        }
        
        // Update check with success
        request.security.checks[checkIndex].success = true;
        request.security.checks[checkIndex].endTime = Date.now();
        request.security.checks[checkIndex].duration = Date.now() - request.security.checks[checkIndex].startTime;
      }
      
      return true;
    } catch (error) {
      logger.error('Error applying security policies', { error, url: request.url });
      return false;
    }
  }
  
  /**
   * Get security headers configuration
   */
  getSecurityHeadersConfig() {
    return this.config.headers || {};
  }
  
  /**
   * Get CORS configuration
   */
  getCorsConfig() {
    return this.config.cors || {};
  }
  
  /**
   * Get CSRF configuration
   */
  getCsrfConfig() {
    return this.config.csrf || {};
  }
  
  /**
   * Get rate limiting configuration
   */
  getRateLimitingConfig() {
    return this.config.rateLimiting || {};
  }
}
