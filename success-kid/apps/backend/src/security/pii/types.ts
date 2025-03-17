/**
 * PII Types
 * 
 * Type definitions for PII detection and handling
 */

/**
 * PII field types
 */
export enum PiiType {
  EMAIL = 'email',
  PHONE = 'phone',
  ADDRESS = 'address',
  NAME = 'name',
  ID_NUMBER = 'id_number',
  CREDIT_CARD = 'credit_card',
  SSN = 'ssn',
  IP_ADDRESS = 'ip_address',
  DATE_OF_BIRTH = 'date_of_birth',
  USERNAME = 'username',
  PASSWORD = 'password',
  API_KEY = 'api_key',
  CUSTOM = 'custom'
}

/**
 * PII sensitivity levels
 */
export enum PiiSensitivity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * PII handling policies
 */
export enum PiiHandlingPolicy {
  ENCRYPT = 'encrypt',
  MASK = 'mask',
  REDACT = 'redact',
  HASH = 'hash',
  ANONYMIZE = 'anonymize',
  ALLOW = 'allow'
}

/**
 * PII field configuration
 */
export interface PiiField {
  path: string;
  type: PiiType;
  pattern?: RegExp;
  sensitivity: PiiSensitivity;
  handlingPolicy: PiiHandlingPolicy;
  description?: string;
}

/**
 * PII detection result
 */
export interface PiiDetection {
  field: string;
  value: string;
  type: PiiType;
  sensitivity: PiiSensitivity;
  confidence: number;
  handlingRecommendation: PiiHandlingPolicy;
}

/**
 * PII scan result
 */
export interface PiiScanResult {
  containsPii: boolean;
  detections: PiiDetection[];
  recommendations: Record<string, PiiHandlingPolicy>;
  dataSubjectRights?: string[];
}

/**
 * Anonymization strategy
 */
export enum AnonymizationStrategy {
  RANDOM_REPLACEMENT = 'random_replacement',
  CONSISTENT_REPLACEMENT = 'consistent_replacement',
  GENERALIZATION = 'generalization',
  PERTURBATION = 'perturbation'
}

/**
 * PII collection
 */
export interface PiiCollection {
  userId: string;
  categories: Record<string, any>;
  sources: string[];
  lastUpdated: Date;
}
