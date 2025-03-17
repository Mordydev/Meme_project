/**
 * Security Error Types
 * 
 * This module defines security-specific error types.
 */

import { AppError } from '../errors/base-error';

/**
 * Base security error
 */
export class SecurityError extends AppError {
  constructor(message: string, code: string, statusCode: number, details?: any) {
    super(message, code, statusCode, details);
  }
}

/**
 * Security policy error
 */
export class SecurityPolicyError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 'SECURITY_POLICY_ERROR', 500, details);
  }
}

/**
 * CSRF validation error
 */
export class CsrfValidationError extends SecurityError {
  constructor(message: string = 'CSRF token validation failed') {
    super(message, 'CSRF_VALIDATION_FAILED', 403);
  }
}

/**
 * Encryption error
 */
export class EncryptionError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 'ENCRYPTION_ERROR', 500, details);
  }
}

/**
 * Decryption error
 */
export class DecryptionError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 'DECRYPTION_ERROR', 500, details);
  }
}

/**
 * Key management error
 */
export class KeyManagementError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 'KEY_MANAGEMENT_ERROR', 500, details);
  }
}

/**
 * PII handling error
 */
export class PiiHandlingError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 'PII_HANDLING_ERROR', 500, details);
  }
}

/**
 * Security vulnerability error
 */
export class SecurityVulnerabilityError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 'SECURITY_VULNERABILITY', 400, details);
  }
}

/**
 * Access denied error
 */
export class AccessDeniedError extends SecurityError {
  constructor(message: string = 'Access denied') {
    super(message, 'ACCESS_DENIED', 403);
  }
}

/**
 * Invalid token error
 */
export class InvalidTokenError extends SecurityError {
  constructor(message: string = 'Invalid or expired token') {
    super(message, 'INVALID_TOKEN', 401);
  }
}

/**
 * Security configuration error
 */
export class SecurityConfigurationError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 'SECURITY_CONFIGURATION_ERROR', 500, details);
  }
}

/**
 * Data privacy error
 */
export class DataPrivacyError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 'DATA_PRIVACY_ERROR', 500, details);
  }
}

/**
 * Compliance error
 */
export class ComplianceError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 'COMPLIANCE_ERROR', 500, details);
  }
}

/**
 * Rate limit configuration error
 */
export class RateLimitConfigurationError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 'RATE_LIMIT_CONFIGURATION_ERROR', 500, details);
  }
}
