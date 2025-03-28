/**
 * Security module shared types
 * 
 * This module contains types that are shared across multiple security components
 */

import { FastifyRequest, FastifyReply, RouteOptions } from 'fastify';

/**
 * Security level severity
 */
export enum SecuritySeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

/**
 * Security vulnerability
 */
export interface Vulnerability {
  id: string;
  name: string;
  description: string;
  severity: SecuritySeverity;
  location?: string;
  data?: Record<string, any>;
  mitigation?: string;
}

/**
 * Security middleware function type
 */
export type SecurityMiddleware = (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void;

/**
 * Security configuration for content security policy
 */
export interface ContentSecurityPolicyConfig {
  enabled: boolean;
  directives: Record<string, string[]>;
}

/**
 * Security configuration for Cross-Origin Resource Sharing
 */
export interface CorsConfig {
  enabled: boolean;
  origin: string[] | boolean;
  methods: string[];
  credentials: boolean;
  maxAge?: number;
  allowedHeaders?: string[];
  exposedHeaders?: string[];
}

/**
 * Security configuration options
 */
export interface SecurityConfig {
  contentSecurityPolicy: ContentSecurityPolicyConfig;
  cors: CorsConfig;
  rateLimiting: {
    enabled: boolean;
    defaultLimit: number;
    defaultWindow: string;
  };
  csrf: {
    enabled: boolean;
    cookie: {
      key: string;
      path: string;
      secure: boolean;
      httpOnly: boolean;
      sameSite: 'strict' | 'lax' | 'none';
    };
    ignoreMethods: string[];
  };
  headers: {
    enabled: boolean;
    hidePoweredBy: boolean;
    noSniff: boolean;
    xssProtection: boolean;
    frameOptions: string;
    hsts: {
      enabled: boolean;
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
  encryption: {
    defaultAlgorithm: string;
    keyRotationDays: number;
  };
  pii: {
    autoDetection: boolean;
    masking: {
      enabled: boolean;
      replaceChar: string;
    };
  };
}

/**
 * Security policy for securing endpoints and resources
 */
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  middleware: SecurityMiddleware[];
  pathPatterns: string[];
  excludePatterns?: string[];
  enabled: boolean;
  priority: number;
}

/**
 * Security service configuration
 */
export interface SecurityServiceConfig {
  policies: SecurityPolicy[];
  config: SecurityConfig;
}

/**
 * Security scan result
 */
export interface SecurityScanResult {
  vulnerabilities: Vulnerability[];
  passed: boolean;
  score: number;
  timestamp: Date;
  duration: number;
}

/**
 * Security state store
 */
export interface SecurityState {
  activeAttackPatterns: Record<string, number>;
  suspiciousIps: Set<string>;
  rateLimitExceededCount: Record<string, number>;
}

/**
 * Security threat source
 */
export interface ThreatSource {
  ip: string;
  userAgent?: string;
  country?: string;
  patterns: string[];
  score: number;
  lastDetected: Date;
  requests: number;
}
