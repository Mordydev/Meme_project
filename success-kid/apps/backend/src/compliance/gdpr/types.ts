/**
 * GDPR Types
 * 
 * Type definitions for GDPR compliance features
 */

/**
 * Data subject request types
 */
export enum DataSubjectRequestType {
  ACCESS = 'access',
  DELETION = 'deletion',
  RECTIFICATION = 'rectification',
  RESTRICTION = 'restriction',
  OBJECTION = 'objection',
  PORTABILITY = 'portability'
}

/**
 * Data subject request status
 */
export enum DataSubjectRequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

/**
 * Data subject request interface
 */
export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  data?: any;
  notes?: string;
}

/**
 * Data category interface
 */
export interface DataCategory {
  id: string;
  name: string;
  description: string;
  retention: string;
  legalBasis: string;
  sensitive: boolean;
  fields: string[];
}

/**
 * Consent record interface
 */
export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: string;
  granted: boolean;
  timestamp: Date;
  expiry?: Date;
  source: string;
  version: string;
}

/**
 * Data export result interface
 */
export interface ExportResult {
  exportId: string;
  fileSize: number;
  fileFormat: string;
  downloadUrl: string;
  expiresAt: Date;
}

/**
 * Data deletion result interface
 */
export interface DeletionResult {
  userId: string;
  success: boolean;
  deletedCategories: string[];
  errors: Array<{
    category: string;
    error: string;
  }>;
  completedAt: Date;
}

/**
 * Legal basis for processing
 */
export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

/**
 * Processing purpose interface
 */
export interface ProcessingPurpose {
  id: string;
  name: string;
  description: string;
  legalBasis: LegalBasis;
  requiresConsent: boolean;
  version: string;
  activeFrom: Date;
  activeTo?: Date;
}
