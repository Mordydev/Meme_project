/**
 * PII Anonymization
 * 
 * This module provides functionality for anonymizing PII in data.
 */

import { createHash } from 'crypto';
import { logger } from '../../lib/logger';
import { PiiType, PiiScanResult } from './scanner';

/**
 * Anonymization strategy
 */
export enum AnonymizationStrategy {
  /**
   * Replace PII with fake data
   */
  SYNTHETIC = 'synthetic',
  
  /**
   * Replace PII with a hash/token that is consistent for the same input
   */
  PSEUDONYMIZE = 'pseudonymize',
  
  /**
   * Replace PII with a generic placeholder
   */
  GENERALIZE = 'generalize',
  
  /**
   * Remove PII fields completely
   */
  REMOVE = 'remove'
}

/**
 * Anonymization options
 */
export interface AnonymizationOptions {
  /**
   * Strategy to use for anonymization
   */
  strategy: AnonymizationStrategy;
  
  /**
   * Salt for pseudonymization
   */
  salt?: string;
  
  /**
   * Whether to preserve format (e.g., keep dots in email addresses)
   */
  preserveFormat: boolean;
  
  /**
   * Dictionary of custom replacements for specific fields
   */
  customReplacements?: Record<string, string>;
}

/**
 * Default anonymization options
 */
const defaultAnonymizationOptions: AnonymizationOptions = {
  strategy: AnonymizationStrategy.SYNTHETIC,
  preserveFormat: true
};

/**
 * PII Anonymizer
 */
export class PiiAnonymizer {
  private options: AnonymizationOptions;
  
  /**
   * Create a new PII anonymizer
   */
  constructor(options: Partial<AnonymizationOptions> = {}) {
    this.options = { ...defaultAnonymizationOptions, ...options };
  }
  
  /**
   * Anonymize data
   */
  anonymizeData(data: any, scanResult: PiiScanResult): any {
    try {
      // If no PII found, return original data
      if (!scanResult.hasPii) {
        return data;
      }
      
      // Clone data to avoid modifying original
      const result = this.deepClone(data);
      
      // Apply anonymization to each field
      for (const field of scanResult.fields) {
        const pathParts = this.parsePath(field.path);
        
        this.applyAnonymizationToPath(
          result,
          pathParts,
          field.value,
          field.type
        );
      }
      
      return result;
    } catch (error) {
      logger.error('Error anonymizing data', { error });
      return data; // Return original data on error
    }
  }
  
  /**
   * Apply anonymization to a specific path
   */
  private applyAnonymizationToPath(
    obj: any,
    pathParts: string[],
    originalValue: string,
    type: PiiType
  ): void {
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
    
    // Apply anonymization based on strategy
    switch (this.options.strategy) {
      case AnonymizationStrategy.SYNTHETIC:
        current[lastPart] = this.generateSyntheticData(type);
        break;
        
      case AnonymizationStrategy.PSEUDONYMIZE:
        current[lastPart] = this.pseudonymize(originalValue, type);
        break;
        
      case AnonymizationStrategy.GENERALIZE:
        current[lastPart] = this.generalize(type);
        break;
        
      case AnonymizationStrategy.REMOVE:
        delete current[lastPart];
        break;
        
      default:
        // Default to synthetic data
        current[lastPart] = this.generateSyntheticData(type);
    }
  }
  
  /**
   * Generate synthetic data based on PII type
   */
  private generateSyntheticData(type: PiiType): string {
    // Check for custom replacement
    if (this.options.customReplacements && this.options.customReplacements[type]) {
      return this.options.customReplacements[type];
    }
    
    // Generate synthetic data based on type
    switch (type) {
      case PiiType.EMAIL:
        return 'user@example.com';
        
      case PiiType.PHONE:
        return '(555) 555-5555';
        
      case PiiType.SSN:
        return '000-00-0000';
        
      case PiiType.CREDIT_CARD:
        return '4111-1111-1111-1111';
        
      case PiiType.IP_ADDRESS:
        return '192.0.2.0';
        
      case PiiType.ADDRESS:
        return '123 Example Street, Anytown, XX 12345';
        
      case PiiType.PERSON_NAME:
        return 'John Doe';
        
      case PiiType.DATE_OF_BIRTH:
        return '1970-01-01';
        
      case PiiType.PASSWORD:
        return '********';
        
      case PiiType.API_KEY:
        return 'xxxx-xxxx-xxxx-xxxx';
        
      case PiiType.USERNAME:
        return 'user123';
        
      default:
        return '[REDACTED]';
    }
  }
  
  /**
   * Pseudonymize a value to a consistent token
   */
  private pseudonymize(value: string, type: PiiType): string {
    // Generate hash
    const hash = createHash('sha256');
    hash.update(value);
    
    if (this.options.salt) {
      hash.update(this.options.salt);
    }
    
    const fullHash = hash.digest('hex');
    
    // Format pseudonym based on type
    if (this.options.preserveFormat) {
      switch (type) {
        case PiiType.EMAIL:
          return `user-${fullHash.substr(0, 8)}@example.com`;
          
        case PiiType.PHONE:
          return `(555) ${fullHash.substr(0, 3)}-${fullHash.substr(3, 4)}`;
          
        case PiiType.SSN:
          return `${fullHash.substr(0, 3)}-${fullHash.substr(3, 2)}-${fullHash.substr(5, 4)}`;
          
        case PiiType.CREDIT_CARD:
          return `XXXX-XXXX-XXXX-${fullHash.substr(0, 4)}`;
          
        case PiiType.PERSON_NAME:
          return `User ${fullHash.substr(0, 8)}`;
          
        default:
          return fullHash.substr(0, 16);
      }
    }
    
    // Return a fixed length hash
    return fullHash.substr(0, 16);
  }
  
  /**
   * Generalize a value to a category
   */
  private generalize(type: PiiType): string {
    switch (type) {
      case PiiType.EMAIL:
        return '[EMAIL ADDRESS]';
        
      case PiiType.PHONE:
        return '[PHONE NUMBER]';
        
      case PiiType.SSN:
        return '[SOCIAL SECURITY NUMBER]';
        
      case PiiType.CREDIT_CARD:
        return '[CREDIT CARD NUMBER]';
        
      case PiiType.IP_ADDRESS:
        return '[IP ADDRESS]';
        
      case PiiType.ADDRESS:
        return '[STREET ADDRESS]';
        
      case PiiType.PERSON_NAME:
        return '[PERSON NAME]';
        
      case PiiType.DATE_OF_BIRTH:
        return '[DATE OF BIRTH]';
        
      case PiiType.PASSWORD:
        return '[PASSWORD]';
        
      case PiiType.API_KEY:
        return '[API KEY]';
        
      case PiiType.USERNAME:
        return '[USERNAME]';
        
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
export const piiAnonymizer = new PiiAnonymizer();
