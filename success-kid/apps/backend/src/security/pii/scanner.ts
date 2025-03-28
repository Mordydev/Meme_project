/**
 * PII Scanner
 * 
 * This module provides functionality for detecting PII in data.
 */

import { logger } from '../../lib/logger';

/**
 * PII field type
 */
export enum PiiType {
  EMAIL = 'email',
  PHONE = 'phone',
  SSN = 'ssn',
  CREDIT_CARD = 'credit_card',
  IP_ADDRESS = 'ip_address',
  ADDRESS = 'address',
  PERSON_NAME = 'person_name',
  DATE_OF_BIRTH = 'date_of_birth',
  PASSWORD = 'password',
  API_KEY = 'api_key',
  USERNAME = 'username',
  CUSTOM = 'custom'
}

/**
 * PII field sensitivity level
 */
export enum PiiSensitivity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * PII field configuration
 */
export interface PiiFieldConfig {
  path: string;
  type: PiiType;
  pattern?: RegExp;
  sensitivity: PiiSensitivity;
  handlingPolicy: 'encrypt' | 'mask' | 'redact' | 'hash' | 'anonymize';
}

/**
 * PII scan result
 */
export interface PiiScanResult {
  hasPii: boolean;
  fields: Array<{
    path: string;
    type: PiiType;
    sensitivity: PiiSensitivity;
    handlingPolicy: string;
    value: string;
  }>;
}

/**
 * Default PII patterns
 */
const PII_PATTERNS: Record<PiiType, RegExp> = {
  [PiiType.EMAIL]: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  [PiiType.PHONE]: /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
  [PiiType.SSN]: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/,
  [PiiType.CREDIT_CARD]: /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
  [PiiType.IP_ADDRESS]: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  [PiiType.ADDRESS]: /\b\d+\s+([a-zA-Z]+\s)+(?:st(?:reet)?|ave(?:nue)?|rd|road|blvd|boulevard|ln|lane|dr(?:ive)?|way|court|plaza|square|run|parkway|point|pike|circle)\b/i,
  [PiiType.PERSON_NAME]: /\b([A-Z][a-z]+\s+){1,2}[A-Z][a-z]+\b/,
  [PiiType.DATE_OF_BIRTH]: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
  [PiiType.PASSWORD]: /\b(password|passwd)\s*[:=]\s*\S+\b/i,
  [PiiType.API_KEY]: /\b(api[_-]?key|access[_-]?token)\s*[:=]\s*\S+\b/i,
  [PiiType.USERNAME]: /\b(username|user[_-]?name|user[_-]?id)\s*[:=]\s*\S+\b/i,
  [PiiType.CUSTOM]: /.*/  // Custom pattern placeholder
};

/**
 * Default field sensitivity by type
 */
const DEFAULT_SENSITIVITY: Record<PiiType, PiiSensitivity> = {
  [PiiType.EMAIL]: PiiSensitivity.MEDIUM,
  [PiiType.PHONE]: PiiSensitivity.MEDIUM,
  [PiiType.SSN]: PiiSensitivity.HIGH,
  [PiiType.CREDIT_CARD]: PiiSensitivity.HIGH,
  [PiiType.IP_ADDRESS]: PiiSensitivity.LOW,
  [PiiType.ADDRESS]: PiiSensitivity.MEDIUM,
  [PiiType.PERSON_NAME]: PiiSensitivity.MEDIUM,
  [PiiType.DATE_OF_BIRTH]: PiiSensitivity.MEDIUM,
  [PiiType.PASSWORD]: PiiSensitivity.HIGH,
  [PiiType.API_KEY]: PiiSensitivity.HIGH,
  [PiiType.USERNAME]: PiiSensitivity.LOW,
  [PiiType.CUSTOM]: PiiSensitivity.MEDIUM
};

/**
 * Default handling policy by sensitivity
 */
const DEFAULT_HANDLING_POLICY: Record<PiiSensitivity, 'encrypt' | 'mask' | 'redact' | 'hash' | 'anonymize'> = {
  [PiiSensitivity.LOW]: 'mask',
  [PiiSensitivity.MEDIUM]: 'mask',
  [PiiSensitivity.HIGH]: 'encrypt'
};

/**
 * PII Scanner
 */
export class PiiScanner {
  private fieldConfigs: PiiFieldConfig[] = [];
  
  /**
   * Create a new PII scanner
   */
  constructor(fieldConfigs: PiiFieldConfig[] = []) {
    this.fieldConfigs = fieldConfigs;
    
    // Add default field configurations if none provided
    if (this.fieldConfigs.length === 0) {
      this.addDefaultFieldConfigs();
    }
  }
  
  /**
   * Add a field configuration
   */
  addFieldConfig(config: PiiFieldConfig): void {
    this.fieldConfigs.push(config);
  }
  
  /**
   * Add default field configurations
   */
  private addDefaultFieldConfigs(): void {
    // Common PII field paths
    const commonPaths = {
      [PiiType.EMAIL]: ['email', 'emailAddress', 'user.email'],
      [PiiType.PHONE]: ['phone', 'phoneNumber', 'user.phone', 'user.phoneNumber'],
      [PiiType.SSN]: ['ssn', 'socialSecurityNumber', 'user.ssn'],
      [PiiType.CREDIT_CARD]: ['creditCard', 'cardNumber', 'payment.cardNumber'],
      [PiiType.IP_ADDRESS]: ['ipAddress', 'ip', 'user.ipAddress'],
      [PiiType.ADDRESS]: ['address', 'user.address', 'shippingAddress', 'billingAddress'],
      [PiiType.PERSON_NAME]: ['name', 'fullName', 'user.name', 'firstName', 'lastName'],
      [PiiType.DATE_OF_BIRTH]: ['dob', 'dateOfBirth', 'birthDate', 'user.dateOfBirth'],
      [PiiType.PASSWORD]: ['password', 'user.password'],
      [PiiType.API_KEY]: ['apiKey', 'accessToken', 'token'],
      [PiiType.USERNAME]: ['username', 'user.username', 'userId', 'user.userId'],
    };
    
    // Add configurations for each type and path
    Object.entries(commonPaths).forEach(([type, paths]) => {
      const piiType = type as PiiType;
      const sensitivity = DEFAULT_SENSITIVITY[piiType];
      const handlingPolicy = DEFAULT_HANDLING_POLICY[sensitivity];
      
      paths.forEach(path => {
        this.addFieldConfig({
          path,
          type: piiType,
          pattern: PII_PATTERNS[piiType],
          sensitivity,
          handlingPolicy
        });
      });
    });
  }
  
  /**
   * Scan data for PII
   */
  scanForPii(data: any): PiiScanResult {
    try {
      const result: PiiScanResult = {
        hasPii: false,
        fields: []
      };
      
      // Skip if data is null or not an object
      if (!data || typeof data !== 'object') {
        return result;
      }
      
      // Search for configured fields
      this.searchObject(data, '', result);
      
      // Set hasPii flag
      result.hasPii = result.fields.length > 0;
      
      return result;
    } catch (error) {
      logger.error('Error scanning for PII', { error });
      return { hasPii: false, fields: [] };
    }
  }
  
  /**
   * Recursively search an object for PII
   */
  private searchObject(obj: any, prefix: string, result: PiiScanResult): void {
    // Handle arrays
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPrefix = `${prefix}[${index}]`;
        
        if (typeof item === 'object' && item !== null) {
          this.searchObject(item, newPrefix, result);
        } else if (typeof item === 'string') {
          this.checkStringForPii(item, newPrefix, result);
        }
      });
      return;
    }
    
    // Handle objects
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      // Check if this path matches any configured fields
      const matchingConfigs = this.fieldConfigs.filter(config => {
        if (config.path === path || config.path === key) {
          return true;
        }
        
        // Check for wildcard paths (ending with *)
        if (config.path.endsWith('*')) {
          const pathPrefix = config.path.slice(0, -1);
          return path.startsWith(pathPrefix) || key.startsWith(pathPrefix);
        }
        
        return false;
      });
      
      if (matchingConfigs.length > 0 && typeof value === 'string') {
        // Use the first matching config
        const config = matchingConfigs[0];
        
        result.fields.push({
          path,
          type: config.type,
          sensitivity: config.sensitivity,
          handlingPolicy: config.handlingPolicy,
          value
        });
      } else if (typeof value === 'string') {
        // Scan string for PII patterns
        this.checkStringForPii(value, path, result);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively scan nested objects
        this.searchObject(value, path, result);
      }
    }
  }
  
  /**
   * Check a string for PII patterns
   */
  private checkStringForPii(value: string, path: string, result: PiiScanResult): void {
    // Skip empty strings
    if (!value.trim()) {
      return;
    }
    
    // Check against all patterns
    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      // Skip custom pattern
      if (type === PiiType.CUSTOM) {
        continue;
      }
      
      if (pattern.test(value)) {
        const piiType = type as PiiType;
        const sensitivity = DEFAULT_SENSITIVITY[piiType];
        const handlingPolicy = DEFAULT_HANDLING_POLICY[sensitivity];
        
        result.fields.push({
          path,
          type: piiType,
          sensitivity,
          handlingPolicy,
          value
        });
        
        // Only report once per field (first matching pattern)
        break;
      }
    }
  }
}

// Export singleton instance
export const piiScanner = new PiiScanner();
