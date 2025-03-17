/**
 * Security Framework Types
 * 
 * Type definitions for the security framework
 */
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Security context shared between middleware
 */
export interface SecurityContext {
  [key: string]: any;
}

/**
 * Security check result
 */
export interface SecurityCheck {
  policyId: string;
  policyName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

/**
 * Extend FastifyRequest with security properties
 */
declare module 'fastify' {
  interface FastifyRequest {
    security: {
      context: SecurityContext;
      checks: SecurityCheck[];
    };
  }
  
  interface FastifyInstance {
    securityService: any;
  }
}

/**
 * Security middleware function type
 */
export type SecurityMiddlewareFunction = (
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
) => Promise<boolean | void> | boolean | void;

/**
 * Security policy interface
 */
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  middleware: SecurityMiddlewareFunction[];
  pathPatterns: string[];
  excludePatterns?: string[];
  priority: number;
  enabled: boolean;
}

/**
 * Security header configuration
 */
export interface SecurityHeadersConfig {
  enabled: boolean;
  contentSecurityPolicy?: {
    directives: Record<string, string[]>;
  };
  xFrameOptions?: string;
  xXssProtection?: string;
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

/**
 * CORS configuration
 */
export interface CorsConfig {
  enabled: boolean;
  origin: string | string[] | boolean;
  methods: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * CSRF configuration
 */
export interface CsrfConfig {
  enabled: boolean;
  cookie: {
    key: string;
    path: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  ignoreMethods: string[];
  ignorePaths: string[];
  tokenLength: number;
  headerName: string;
  tokenRotation: boolean;
  rotationInterval: number;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitingConfig {
  enabled: boolean;
  max: number;
  timeWindow: string;
  keyGenerator?: (request: FastifyRequest) => string;
  whitelist?: string[];
  skipOnError?: boolean;
}

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  headers: SecurityHeadersConfig;
  cors: CorsConfig;
  rateLimiting: RateLimitingConfig;
  csrf: CsrfConfig;
}
