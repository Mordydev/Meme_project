/**
 * PII Redaction
 * 
 * This module provides functionality for redacting PII in data.
 */

import { createHash } from 'crypto';
import { logger } from '../../lib/logger';
import { encryptionService } from '../encryption/service';
import { PiiType, PiiSensitivity, PiiScanResult } from './scanner';

/**
 * PII redaction options
 */
export interface RedactionOptions {
  /**
   * Whether to use PII type-specific redaction
   */
  useTypeSpecificRedaction: boolean;
  
  /**
   * Character to use for masking
   */
  maskChar: string;
  
  /**
   * Whether to preserve format (e.g., keep dots in email addresses)
   */
  preserveFormat: boolean;
  
  /**
   * Salt for hashing
   */
  hashSalt?: string;
  
  /**
   * Character to use for redaction
   */
  redactionChar: string;
}

/**
 * Default redaction options
 */
const defaultRedactionOptions: RedactionOptions = {
  useTypeSpecificRedaction: true,
  maskChar: '*',
  preserveFormat: true,
  redactionChar: '█'
};

/**
 * PII Redactor
 */
export class PiiRedactor {
  private options: RedactionOptions;
  
  /**
   * Create a new PII redactor
   */
  constructor(options: Partial<RedactionOptions> = {}) {
    this.options = { ...defaultRedactionOptions, ...options };
  }
  
  /**
   * Apply redaction to PII fields
   */
  async applyRedaction(data: any, scanResult: PiiScanResult): Promise<any> {
    try {
      // If no PII found, return original data
      if (!scanResult.hasPii) {
        return data;
      }
      
      // Clone data to avoid modifying original
      const result = this.deepClone(data);
      
      // Apply redaction to each field
      for (const field of scanResult.fields) {
        const pathParts = this.parsePath(field.path);
        
        // Apply redaction based on handling policy
        await this.applyRedactionToPath(
          result,
          pathParts,
          field.value,
          field.type,
          field.handlingPolicy,
          field.sensitivity
        );
      }
      
      return result;
    } catch (error) {
      logger.error('Error applying PII redaction', { error });
      return data; // Return original data on error
    }
  }
  
  /**
   * Apply redaction to a specific path
   */
  private async applyRedactionToPath(
    obj: any,
    pathParts: string[],
    originalValue: string,
    type: PiiType,
    policy: string,
    sensitivity: PiiSensitivity
  ): Promise<void> {
    // Process nested paths
    let current = obj;
    const lastPart = pathParts[pathParts.length - 1];
    
    // Navigate to the containing object
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      
      // Check for array index
      if (part.endsWith(']')) {
        const match = part.match(/^(.*)\[(\d+)\]$/);
        if (match) {
          const [, name, indexStr] = match;
          const index = parseInt(indexStr, 10);
          
          if (!current[name] || !Array.isArray(current[name])) {
            return; // Path doesn't exist
          }
          
          if (index >= current[name].length) {
            return; // Index out of bounds
          }
          
          current = current[name][index];
          continue;
        }
      }
      
      // Regular object property
      if (!current[part] || typeof current[part] !== 'object') {
        return; // Path doesn't exist
      }
      
      current = current[part];
    }
    
    // Check if the final part exists and is a string
    if (typeof current[lastPart] !== 'string') {
      return;
    }
    
    // Apply redaction based on policy
    switch (policy) {
      case 'mask':
        current[lastPart] = this.maskValue(originalValue, type);
        break;
        
      case 'redact':
        current[lastPart] = this.redactValue(originalValue);
        break;
        
      case 'hash':
        current[lastPart] = this.hashValue(originalValue);
        break;
        
      case 'encrypt':
        current[lastPart] = await this.encryptValue(originalValue, type);
        break;
        
      case 'anonymize':
        current[lastPart] = this.anonymizeValue(originalValue, type);
        break;
        
      default:
        // By default, mask the value
        current[lastPart] = this.maskValue(originalValue, type);
    }
  }
  
  /**
   * Mask a value based on type
   */
  maskValue(value: string, type: PiiType): string {
    if (!value) {
      return value;
    }
    
    if (!this.options.useTypeSpecificRedaction) {
      // Simple masking
      const visibleChars = Math.min(2, Math.floor(value.length / 4));
      
      if (value.length <= visibleChars * 2) {
        return value; // Too short to mask
      }
      
      const prefix = value.substring(0, visibleChars);
      const suffix = value.substring(value.length - visibleChars);
      const masked = this.options.maskChar.repeat(value.length - (visibleChars * 2));
      
      return prefix + masked + suffix;
    }
    
    // Type-specific masking
    switch (type) {
      case PiiType.EMAIL:
        // Show first 2 chars and domain
        if (value.includes('@')) {
          const [local, domain] = value.split('@');
          return `${local.substring(0, 2)}${this.options.maskChar.repeat(Math.max(1, local.length - 2))}@${domain}`;
        }
        break;
        
      case PiiType.PHONE:
        // Show last 4 digits
        return `${this.options.maskChar.repeat(value.length - 4)}${value.substring(value.length - 4)}`;
        
      case PiiType.SSN:
        // Show only last 4 digits
        if (value.length >= 4) {
          return `${this.options.maskChar.repeat(value.length - 4)}${value.substring(value.length - 4)}`;
        }
        break;
        
      case PiiType.CREDIT_CARD:
        // Mask all but last 4 digits
        if (value.length >= 4) {
          return `${this.options.maskChar.repeat(value.length - 4)}${value.substring(value.length - 4)}`;
        }
        break;
        
      case PiiType.IP_ADDRESS:
        // Mask last octet
        if (value.split('.').length === 4) {
          const parts = value.split('.');
          parts[3] = this.options.maskChar.repeat(parts[3].length);
          return parts.join('.');
        }
        break;
        
      case PiiType.PERSON_NAME:
        // Show first initial of each name
        return value.split(' ')
          .map(part => `${part.charAt(0)}${this.options.maskChar.repeat(part.length - 1)}`)
          .join(' ');
        
      case PiiType.PASSWORD:
      case PiiType.API_KEY:
        // Completely mask
        return this.options.maskChar.repeat(value.length);
    }
    
    // Default masking for other types
    const visibleChars = Math.min(2, Math.floor(value.length / 4));
    
    if (value.length <= visibleChars * 2) {
      return value; // Too short to mask
    }
    
    const prefix = value.substring(0, visibleChars);
    const suffix = value.substring(value.length - visibleChars);
    const masked = this.options.maskChar.repeat(value.length - (visibleChars * 2));
    
    return prefix + masked + suffix;
  }
  
  /**
   * Redact a value completely
   */
  redactValue(value: string): string {
    return this.options.redactionChar.repeat(value.length);
  }
  
  /**
   * Hash a value
   */
  hashValue(value: string): string {
    const hash = createHash('sha256');
    hash.update(value);
    
    if (this.options.hashSalt) {
      hash.update(this.options.hashSalt);
    }
    
    return hash.digest('hex');
  }
  
  /**
   * Encrypt a value
   */
  async encryptValue(value: string, type: PiiType): Promise<string> {
    return await encryptionService.encryptField(value, `pii:${type}`);
  }
  
  /**
   * Anonymize a value
   */
  anonymizeValue(value: string, type: PiiType): string {
    switch (type) {
      case PiiType.EMAIL:
        return 'anonymous@example.com';
        
      case PiiType.PHONE:
        return '(555) 555-5555';
        
      case PiiType.SSN:
        return '000-00-0000';
        
      case PiiType.CREDIT_CARD:
        return '0000-0000-0000-0000';
        
      case PiiType.IP_ADDRESS:
        return '0.0.0.0';
        
      case PiiType.ADDRESS:
        return '123 Main St.';
        
      case PiiType.PERSON_NAME:
        return 'John Doe';
        
      case PiiType.DATE_OF_BIRTH:
        return '01/01/2000';
        
      case PiiType.USERNAME:
        return 'anonymous_user';
        
      default:
        return '[REDACTED]';
    }
  }
  
  /**
   * Parse a path string into parts
   */
  private parsePath(path: string): string[] {
    // Handle array indices
    if (path.includes('[') && path.includes(']')) {
      return path.split(/\.(?![^\[]*\])/).map(part => part.trim());
    }
    
    // Simple dot notation
    return path.split('.').map(part => part.trim());
  }
  
  /**
   * Deep clone an object
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

// Export singleton instance
export const piiRedactor = new PiiRedactor();
