/**
 * PII Service
 * 
 * Service for handling PII (Personally Identifiable Information)
 */
import { logger } from '../../lib/logger';
import { db } from '../../lib/db';
import { redis } from '../../lib/redis';
import { 
  PiiType, 
  PiiSensitivity, 
  PiiHandlingPolicy, 
  PiiScanResult,
  PiiDetection,
  PiiField,
  AnonymizationStrategy,
  PiiCollection
} from './types';
import { scanForPii } from './scanner';
import { encryptionService } from '../encryption/service';

/**
 * PII Field Registry - defines PII fields for data processing
 */
const PII_FIELDS: PiiField[] = [
  {
    path: 'email',
    type: PiiType.EMAIL,
    sensitivity: PiiSensitivity.MEDIUM,
    handlingPolicy: PiiHandlingPolicy.MASK
  },
  {
    path: 'phone',
    type: PiiType.PHONE,
    sensitivity: PiiSensitivity.MEDIUM,
    handlingPolicy: PiiHandlingPolicy.MASK
  },
  {
    path: 'address',
    type: PiiType.ADDRESS,
    sensitivity: PiiSensitivity.MEDIUM,
    handlingPolicy: PiiHandlingPolicy.MASK
  },
  {
    path: 'full_name',
    type: PiiType.NAME,
    sensitivity: PiiSensitivity.MEDIUM,
    handlingPolicy: PiiHandlingPolicy.MASK
  },
  {
    path: 'date_of_birth',
    type: PiiType.DATE_OF_BIRTH,
    sensitivity: PiiSensitivity.HIGH,
    handlingPolicy: PiiHandlingPolicy.ENCRYPT
  },
  {
    path: 'payment.card_number',
    type: PiiType.CREDIT_CARD,
    sensitivity: PiiSensitivity.HIGH,
    handlingPolicy: PiiHandlingPolicy.ENCRYPT
  },
  {
    path: 'ip_address',
    type: PiiType.IP_ADDRESS,
    sensitivity: PiiSensitivity.MEDIUM,
    handlingPolicy: PiiHandlingPolicy.MASK
  },
  {
    path: 'wallet_address',
    type: PiiType.CUSTOM,
    sensitivity: PiiSensitivity.LOW,
    handlingPolicy: PiiHandlingPolicy.ALLOW,
    description: 'Public blockchain address'
  }
];

/**
 * PII Service Class
 */
export class PiiService {
  private fieldRegistry: PiiField[] = PII_FIELDS;
  
  /**
   * Register a PII field definition
   * 
   * @param field PII field to register
   */
  registerField(field: PiiField): void {
    this.fieldRegistry.push(field);
    logger.debug(`Registered PII field: ${field.path}`);
  }
  
  /**
   * Scan data for PII
   * 
   * @param data Data to scan
   * @returns Scan result with detections and recommendations
   */
  async scanForPii(data: any): Promise<PiiScanResult> {
    return scanForPii(data);
  }
  
  /**
   * Apply PII handling policy to data
   * 
   * @param data Data to process
   * @param policy Optional policy name (defaults to field definitions)
   * @returns Processed data with PII handled according to policy
   */
  async applyPiiPolicy(data: any, policy?: string): Promise<any> {
    try {
      // Get scan results
      const scanResult = await this.scanForPii(data);
      
      // If no PII detected, return original data
      if (!scanResult.containsPii) {
        return data;
      }
      
      // Clone data to avoid modifying original
      const processedData = JSON.parse(JSON.stringify(data));
      
      // Process each detection
      for (const detection of scanResult.detections) {
        // Determine handling policy (use default if not specified)
        let handlingPolicy = detection.handlingRecommendation;
        
        // Override with specific policy if provided
        if (policy) {
          switch (policy) {
            case 'strict':
              handlingPolicy = PiiHandlingPolicy.REDACT;
              break;
            case 'minimal':
              handlingPolicy = PiiHandlingPolicy.ENCRYPT;
              break;
            case 'standard':
              handlingPolicy = detection.handlingRecommendation;
              break;
            case 'anonymize':
              handlingPolicy = PiiHandlingPolicy.ANONYMIZE;
              break;
            default:
              handlingPolicy = detection.handlingRecommendation;
          }
        }
        
        // Get path components
        const pathParts = detection.field.split('.');
        
        // Apply policy
        this.applyPolicyToPath(
          processedData,
          pathParts,
          detection.value,
          handlingPolicy,
          detection.type
        );
      }
      
      return processedData;
    } catch (error) {
      logger.error('Error applying PII policy', { error });
      
      // Return original data on error
      return data;
    }
  }
  
  /**
   * Apply policy to a specific path in data
   * 
   * @param data Data to modify
   * @param pathParts Path components
   * @param originalValue Original value
   * @param policy Handling policy
   * @param piiType Type of PII
   */
  private applyPolicyToPath(
    data: any,
    pathParts: string[],
    originalValue: string,
    policy: PiiHandlingPolicy,
    piiType: PiiType
  ): void {
    // Skip for null/undefined data
    if (data == null) return;
    
    // Handle array indices in path
    const part = pathParts[0];
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    
    if (arrayMatch) {
      // Handle array path like "items[0]"
      const arrayName = arrayMatch[1];
      const index = parseInt(arrayMatch[2], 10);
      
      if (data[arrayName] && Array.isArray(data[arrayName]) && data[arrayName][index] !== undefined) {
        if (pathParts.length === 1) {
          // This is the leaf node, apply policy
          data[arrayName][index] = this.applyPolicyToValue(originalValue, policy, piiType);
        } else {
          // Continue to next part of path
          this.applyPolicyToPath(
            data[arrayName][index],
            pathParts.slice(1),
            originalValue,
            policy,
            piiType
          );
        }
      }
    } else {
      // Regular object path
      if (pathParts.length === 1) {
        // This is the leaf node, apply policy
        if (data[part] !== undefined) {
          data[part] = this.applyPolicyToValue(originalValue, policy, piiType);
        }
      } else {
        // Continue to next part of path
        if (data[part] !== undefined) {
          this.applyPolicyToPath(
            data[part],
            pathParts.slice(1),
            originalValue,
            policy,
            piiType
          );
        }
      }
    }
  }
  
  /**
   * Apply policy to a specific value
   * 
   * @param value Value to process
   * @param policy Handling policy
   * @param piiType Type of PII
   * @returns Processed value
   */
  private applyPolicyToValue(
    value: string,
    policy: PiiHandlingPolicy,
    piiType: PiiType
  ): string {
    if (!value) return value;
    
    switch (policy) {
      case PiiHandlingPolicy.MASK:
        return this.maskPii(value, piiType);
        
      case PiiHandlingPolicy.REDACT:
        return '[REDACTED]';
        
      case PiiHandlingPolicy.HASH:
        return this.hashPii(value);
        
      case PiiHandlingPolicy.ENCRYPT:
        // Just return a placeholder for encrypted values
        // In a real implementation, this would store the encrypted value elsewhere
        return '[ENCRYPTED]';
        
      case PiiHandlingPolicy.ANONYMIZE:
        return this.anonymizePii(value, piiType);
        
      case PiiHandlingPolicy.ALLOW:
      default:
        return value;
    }
  }
  
  /**
   * Mask PII based on type
   * 
   * @param value Value to mask
   * @param type Type of PII
   * @returns Masked value
   */
  maskPii(value: string, type: PiiType): string {
    if (!value) return value;
    
    switch (type) {
      case PiiType.EMAIL:
        // Mask email (show first 2 chars and domain)
        const [local, domain] = value.split('@');
        return `${local.substring(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
        
      case PiiType.PHONE:
        // Mask phone (show last 4 digits)
        return value.replace(/^.+(.{4})$/, '****$1');
        
      case PiiType.NAME:
        // Show first initial of each name part
        return value.split(' ')
          .map(part => `${part.charAt(0)}${'*'.repeat(part.length - 1)}`)
          .join(' ');
        
      case PiiType.ADDRESS:
        // Show only street number and city/state
        return value.replace(/(\d+)(\s+.+,)(.+)/, '$1 ******,$3');
        
      case PiiType.CREDIT_CARD:
        // Show only last 4 digits
        return value.replace(/^.+(.{4})$/, '************$1');
        
      case PiiType.DATE_OF_BIRTH:
        // Show only year
        return value.replace(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/, '**/**/****');
        
      case PiiType.SSN:
        // Show only last 4 digits
        return value.replace(/^.+(.{4})$/, '***-**-$1');
        
      default:
        // Default masking (show first and last character)
        if (value.length <= 2) return value;
        return `${value.charAt(0)}${'*'.repeat(value.length - 2)}${value.slice(-1)}`;
    }
  }
  
  /**
   * Hash PII value
   * 
   * @param value Value to hash
   * @returns Hashed value
   */
  private hashPii(value: string): string {
    // In a real implementation, use a secure hash function
    return '[HASHED]';
  }
  
  /**
   * Anonymize PII value
   * 
   * @param value Value to anonymize
   * @param type Type of PII
   * @returns Anonymized value
   */
  private anonymizePii(value: string, type: PiiType): string {
    switch (type) {
      case PiiType.EMAIL:
        return 'user@example.com';
        
      case PiiType.PHONE:
        return '555-555-5555';
        
      case PiiType.NAME:
        return 'John Doe';
        
      case PiiType.ADDRESS:
        return '123 Main St, Anytown, CA 90210';
        
      case PiiType.DATE_OF_BIRTH:
        return '01/01/2000';
        
      default:
        return '[ANONYMIZED]';
    }
  }
  
  /**
   * Anonymize data with a consistent strategy
   * 
   * @param data Data to anonymize
   * @param strategy Anonymization strategy
   * @returns Anonymized data
   */
  async anonymizeData(data: any, strategy: AnonymizationStrategy): Promise<any> {
    try {
      // Clone data
      const anonymizedData = JSON.parse(JSON.stringify(data));
      
      // Get PII scan results
      const scanResult = await this.scanForPii(data);
      
      // Apply anonymization based on strategy
      for (const detection of scanResult.detections) {
        const pathParts = detection.field.split('.');
        
        // Apply anonymization strategy
        this.applyAnonymizationToPath(
          anonymizedData,
          pathParts,
          detection.value,
          strategy,
          detection.type
        );
      }
      
      return anonymizedData;
    } catch (error) {
      logger.error('Error anonymizing data', { error });
      return data;
    }
  }
  
  /**
   * Apply anonymization to a specific path in data
   * 
   * @param data Data to modify
   * @param pathParts Path components
   * @param originalValue Original value
   * @param strategy Anonymization strategy
   * @param piiType Type of PII
   */
  private applyAnonymizationToPath(
    data: any,
    pathParts: string[],
    originalValue: string,
    strategy: AnonymizationStrategy,
    piiType: PiiType
  ): void {
    // Implementation similar to applyPolicyToPath but using anonymization
    // For brevity, focusing on the leaf node handling
    
    if (pathParts.length === 1 && data[pathParts[0]] !== undefined) {
      data[pathParts[0]] = this.getAnonymizedValue(originalValue, strategy, piiType);
    } else if (pathParts.length > 1 && data[pathParts[0]] !== undefined) {
      this.applyAnonymizationToPath(
        data[pathParts[0]],
        pathParts.slice(1),
        originalValue,
        strategy,
        piiType
      );
    }
  }
  
  /**
   * Get anonymized value based on strategy
   * 
   * @param value Original value
   * @param strategy Anonymization strategy
   * @param type PII type
   * @returns Anonymized value
   */
  private getAnonymizedValue(
    value: string,
    strategy: AnonymizationStrategy,
    type: PiiType
  ): string {
    switch (strategy) {
      case AnonymizationStrategy.RANDOM_REPLACEMENT:
        return this.anonymizePii(value, type);
        
      case AnonymizationStrategy.CONSISTENT_REPLACEMENT:
        // This would use a deterministic mapping in a real implementation
        return this.anonymizePii(value, type);
        
      case AnonymizationStrategy.GENERALIZATION:
        // Reduce specificity (e.g., full date to just year)
        return this.generalizeValue(value, type);
        
      case AnonymizationStrategy.PERTURBATION:
        // Add noise to values (for numeric data)
        return this.perturbValue(value, type);
        
      default:
        return this.anonymizePii(value, type);
    }
  }
  
  /**
   * Generalize value by reducing specificity
   * 
   * @param value Value to generalize
   * @param type PII type
   * @returns Generalized value
   */
  private generalizeValue(value: string, type: PiiType): string {
    switch (type) {
      case PiiType.DATE_OF_BIRTH:
        // Extract and return just the year
        const yearMatch = value.match(/\d{4}$/);
        return yearMatch ? yearMatch[0] : '2000';
        
      case PiiType.ADDRESS:
        // Return just city/state
        const cityStateMatch = value.match(/,\s*([^,]+,\s*[A-Z]{2})/);
        return cityStateMatch ? cityStateMatch[1].trim() : 'Anytown, CA';
        
      case PiiType.EMAIL:
        // Return just the domain
        const domainMatch = value.match(/@(.+)$/);
        return domainMatch ? `*@${domainMatch[1]}` : '*@example.com';
        
      default:
        return this.anonymizePii(value, type);
    }
  }
  
  /**
   * Add noise to numeric values
   * 
   * @param value Value to perturb
   * @param type PII type
   * @returns Perturbed value
   */
  private perturbValue(value: string, type: PiiType): string {
    // This would add random noise to numeric values
    // For simplicity, we'll return anonymized values
    return this.anonymizePii(value, type);
  }
  
  /**
   * Get all PII for a data subject (GDPR support)
   * 
   * @param userId User ID
   * @returns Collection of user's PII
   */
  async getDataSubjectPii(userId: string): Promise<PiiCollection> {
    try {
      // This would query various data sources to compile all PII
      // For simplicity, we're returning a placeholder implementation
      
      return {
        userId,
        categories: {
          identity: {
            // This would be gathered from user data
          },
          contact: {
            // This would be gathered from contact info
          },
          activity: {
            // This would be gathered from activity logs
          }
        },
        sources: ['user_profile', 'activity_logs', 'contact_info'],
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error retrieving data subject PII', { error, userId });
      throw error;
    }
  }
  
  /**
   * Pseudonymize data while preserving format
   * 
   * @param data Data to pseudonymize
   * @param preserveFormat Whether to preserve data format
   * @returns Pseudonymized data
   */
  async pseudonymizeData(data: any, preserveFormat: boolean = true): Promise<any> {
    try {
      // Clone data
      const pseudonymizedData = JSON.parse(JSON.stringify(data));
      
      // Get PII scan results
      const scanResult = await this.scanForPii(data);
      
      // Apply pseudonymization
      for (const detection of scanResult.detections) {
        const pathParts = detection.field.split('.');
        
        // Apply policy to path
        this.applyPolicyToPath(
          pseudonymizedData,
          pathParts,
          detection.value,
          preserveFormat ? PiiHandlingPolicy.MASK : PiiHandlingPolicy.ANONYMIZE,
          detection.type
        );
      }
      
      return pseudonymizedData;
    } catch (error) {
      logger.error('Error pseudonymizing data', { error });
      return data;
    }
  }
}

// Export singleton instance
export const piiService = new PiiService();
