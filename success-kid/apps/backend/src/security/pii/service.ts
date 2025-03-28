/**
 * PII Service
 * 
 * This module provides a service for handling PII (Personally Identifiable Information).
 */

import { logger } from '../../lib/logger';
import { PiiScanner, PiiScanResult, PiiType, PiiFieldConfig } from './scanner';
import { PiiRedactor, RedactionOptions } from './redaction';
import { PiiAnonymizer, AnonymizationStrategy, AnonymizationOptions } from './anonymization';

/**
 * PII collection
 */
export interface PiiCollection {
  userId: string;
  fields: Record<string, any>;
}

/**
 * PII service options
 */
export interface PiiServiceOptions {
  fieldConfigs?: PiiFieldConfig[];
  redaction?: Partial<RedactionOptions>;
  anonymization?: Partial<AnonymizationOptions>;
}

/**
 * PII Service
 */
export class PiiService {
  private scanner: PiiScanner;
  private redactor: PiiRedactor;
  private anonymizer: PiiAnonymizer;
  
  /**
   * Create a new PII service
   */
  constructor(options: PiiServiceOptions = {}) {
    this.scanner = new PiiScanner(options.fieldConfigs);
    this.redactor = new PiiRedactor(options.redaction);
    this.anonymizer = new PiiAnonymizer(options.anonymization);
    
    logger.info('PII service initialized');
  }
  
  /**
   * Scan data for PII
   */
  scanForPii(data: any): PiiScanResult {
    try {
      return this.scanner.scanForPii(data);
    } catch (error) {
      logger.error('Error scanning for PII', { error });
      return { hasPii: false, fields: [] };
    }
  }
  
  /**
   * Apply PII handling policy to data
   */
  async applyPiiPolicy(data: any, policy?: string): Promise<any> {
    try {
      // Scan for PII
      const scanResult = this.scanForPii(data);
      
      // If no PII found, return original data
      if (!scanResult.hasPii) {
        return data;
      }
      
      // Apply redaction by default
      if (!policy || policy === 'redact') {
        return await this.redactor.applyRedaction(data, scanResult);
      }
      
      // Apply anonymization if specified
      if (policy === 'anonymize') {
        return this.anonymizer.anonymizeData(data, scanResult);
      }
      
      // Other policies
      switch (policy) {
        case 'mask':
          // Use redactor with mask policy
          const maskedScanResult = {
            ...scanResult,
            fields: scanResult.fields.map(field => ({
              ...field,
              handlingPolicy: 'mask'
            }))
          };
          return await this.redactor.applyRedaction(data, maskedScanResult);
          
        case 'hash':
          // Use redactor with hash policy
          const hashedScanResult = {
            ...scanResult,
            fields: scanResult.fields.map(field => ({
              ...field,
              handlingPolicy: 'hash'
            }))
          };
          return await this.redactor.applyRedaction(data, hashedScanResult);
          
        case 'encrypt':
          // Use redactor with encrypt policy
          const encryptedScanResult = {
            ...scanResult,
            fields: scanResult.fields.map(field => ({
              ...field,
              handlingPolicy: 'encrypt'
            }))
          };
          return await this.redactor.applyRedaction(data, encryptedScanResult);
          
        case 'pseudonymize':
          // Use anonymizer with pseudonymize strategy
          this.anonymizer = new PiiAnonymizer({
            strategy: AnonymizationStrategy.PSEUDONYMIZE
          });
          return this.anonymizer.anonymizeData(data, scanResult);
          
        case 'remove':
          // Use anonymizer with remove strategy
          this.anonymizer = new PiiAnonymizer({
            strategy: AnonymizationStrategy.REMOVE
          });
          return this.anonymizer.anonymizeData(data, scanResult);
          
        default:
          // Default to redaction
          return await this.redactor.applyRedaction(data, scanResult);
      }
    } catch (error) {
      logger.error('Error applying PII policy', { error });
      return data; // Return original data on error
    }
  }
  
  /**
   * Mask PII value based on type
   */
  maskPii(value: string, type: string): string {
    try {
      return this.redactor.maskValue(value, type as PiiType);
    } catch (error) {
      logger.error('Error masking PII', { error });
      return value; // Return original value on error
    }
  }
  
  /**
   * Retrieve all PII for a user (for GDPR data subject access requests)
   */
  async getDataSubjectPii(userId: string): Promise<PiiCollection> {
    try {
      // In a real implementation, this would query PII from various systems
      // For now, return a placeholder
      logger.info(`Retrieving PII for user ${userId}`);
      
      return {
        userId,
        fields: {
          // This would be populated from actual data stores
          message: 'PII retrieval would gather data from all systems'
        }
      };
    } catch (error) {
      logger.error('Error retrieving user PII', { error, userId });
      throw new Error(`Failed to retrieve PII for user ${userId}`);
    }
  }
  
  /**
   * Anonymize data based on strategy
   */
  anonymizeData(data: any, strategy: AnonymizationStrategy): Promise<any> {
    try {
      // Scan for PII
      const scanResult = this.scanForPii(data);
      
      // Create anonymizer with specified strategy
      const anonymizer = new PiiAnonymizer({ strategy });
      
      // Apply anonymization
      return Promise.resolve(anonymizer.anonymizeData(data, scanResult));
    } catch (error) {
      logger.error('Error anonymizing data', { error });
      return Promise.resolve(data); // Return original data on error
    }
  }
  
  /**
   * Pseudonymize data with format preservation
   */
  pseudonymizeData(data: any, preserveFormat: boolean): Promise<any> {
    try {
      // Scan for PII
      const scanResult = this.scanForPii(data);
      
      // Create anonymizer with pseudonymize strategy
      const anonymizer = new PiiAnonymizer({
        strategy: AnonymizationStrategy.PSEUDONYMIZE,
        preserveFormat
      });
      
      // Apply pseudonymization
      return Promise.resolve(anonymizer.anonymizeData(data, scanResult));
    } catch (error) {
      logger.error('Error pseudonymizing data', { error });
      return Promise.resolve(data); // Return original data on error
    }
  }
  
  /**
   * Add a custom PII field configuration
   */
  addFieldConfig(config: PiiFieldConfig): void {
    this.scanner.addFieldConfig(config);
  }
}

// Export singleton instance
export const piiService = new PiiService();
