/**
 * Compliance Reporting Types
 * 
 * Type definitions for compliance reporting
 */

/**
 * Compliance control status
 */
export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  PARTIAL = 'partial',
  NON_COMPLIANT = 'non_compliant',
  NOT_APPLICABLE = 'not_applicable',
  UNKNOWN = 'unknown'
}

/**
 * Compliance control interface
 */
export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  framework: string;
  status: ComplianceStatus;
  evidence?: string[];
  lastAssessed?: Date;
  notes?: string;
}

/**
 * Compliance framework interface
 */
export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  controls: ComplianceControl[];
  enabled: boolean;
}

/**
 * Compliance report status
 */
export enum ReportStatus {
  DRAFT = 'draft',
  GENERATED = 'generated',
  REVIEWED = 'reviewed',
  FINALIZED = 'finalized'
}

/**
 * Compliance report interface
 */
export interface ComplianceReport {
  id: string;
  type: string;
  period: {
    start: Date;
    end: Date;
  };
  status: ReportStatus;
  data: Record<string, any>;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  fileUrl?: string;
}

/**
 * Compliance assessment interface
 */
export interface ComplianceAssessment {
  frameworkId: string;
  frameworkName: string;
  timestamp: Date;
  overallStatus: ComplianceStatus;
  controlResults: Array<{
    controlId: string;
    controlName: string;
    status: ComplianceStatus;
    findings?: string[];
    remediation?: string;
  }>;
  summary: {
    compliant: number;
    partial: number;
    nonCompliant: number;
    notApplicable: number;
    unknown: number;
    total: number;
    complianceScore: number; // 0-100
  };
}

/**
 * Time period for reports and assessments
 */
export interface Period {
  start: Date;
  end: Date;
}

/**
 * Report filter interface
 */
export interface ReportFilter {
  type?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ReportStatus;
  limit?: number;
  offset?: number;
}

/**
 * Export format
 */
export type ExportFormat = 'pdf' | 'csv' | 'json';

/**
 * Export result interface
 */
export interface ExportResult {
  fileUrl: string;
  fileName: string;
  contentType: string;
  expiresAt: Date;
}
