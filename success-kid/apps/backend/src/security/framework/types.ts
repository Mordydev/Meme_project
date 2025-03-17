/**
 * Security framework types
 * 
 * These types define the structure of the security framework service and its components
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  SecurityConfig, 
  SecurityMiddleware, 
  SecurityPolicy,
  SecurityScanResult
} from '../types';

/**
 * Security service interface
 */
export interface ISecurityService {
  /**
   * Initialize the security service and apply security settings to the app
   */
  initialize(app: FastifyInstance): Promise<void>;
  
  /**
   * Register a security policy
   */
  registerPolicy(policy: SecurityPolicy): void;
  
  /**
   * Apply a security policy to a request
   */
  applyPolicy(policyId: string, request: FastifyRequest, reply: FastifyReply): Promise<void>;
  
  /**
   * Get a security policy by ID
   */
  getPolicy(policyId: string): SecurityPolicy | undefined;
  
  /**
   * Get all security policies
   */
  getPolicies(): SecurityPolicy[];
  
  /**
   * Update a security policy
   */
  updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): SecurityPolicy;
  
  /**
   * Enable or disable a security policy
   */
  togglePolicy(policyId: string, enabled: boolean): SecurityPolicy;
  
  /**
   * Get the current security configuration
   */
  getConfig(): SecurityConfig;
  
  /**
   * Update the security configuration
   */
  updateConfig(updates: Partial<SecurityConfig>): SecurityConfig;
  
  /**
   * Scan a request for security vulnerabilities
   */
  scanRequest(request: FastifyRequest): Promise<SecurityScanResult>;
  
  /**
   * Generate a security report
   */
  generateSecurityReport(): Promise<any>;
  
  /**
   * Register security middleware
   */
  registerMiddleware(middleware: SecurityMiddleware, name: string): void;
  
  /**
   * Get security middleware by name
   */
  getMiddleware(name: string): SecurityMiddleware | undefined;
}

/**
 * Security service instance options
 */
export interface SecurityServiceOptions {
  config?: Partial<SecurityConfig>;
  policies?: SecurityPolicy[];
}
