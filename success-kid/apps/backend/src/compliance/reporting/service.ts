/**
 * Compliance Reporting Service
 * 
 * This module provides a service for generating compliance reports.
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { ComplianceError } from '../../security/errors';
import { AuditAction, AuditResource } from '../../audit/types';
import { auditService } from '../../audit/service';
import { getComplianceFrameworks, ComplianceFramework } from './frameworks';
import { generateReport } from './generators';
import { collectEvidence } from './evidence';

/**
 * Report period
 */
export interface Period {
  start: Date;
  end: Date;
}

/**
 * Report filter
 */
export interface ReportFilter {
  type?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  createdBy?: string;
}

/**
 * Compliance report
 */
export interface ComplianceReport {
  id: string;
  type: string;
  period: Period;
  status: 'draft' | 'generated' | 'reviewed' | 'finalized';
  data: Record<string, any>;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  fileUrl?: string;
}

/**
 * Compliance assessment
 */
export interface ComplianceAssessment {
  frameworkId: string;
  frameworkName: string;
  timestamp: Date;
  overallScore: number;
  controlResults: {
    controlId: string;
    controlName: string;
    description: string;
    compliant: boolean;
    evidence?: string;
    notes?: string;
  }[];
  gaps: {
    controlId: string;
    controlName: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    recommendation: string;
  }[];
}

/**
 * Compliance Reporting Service
 */
export class ComplianceReportingService {
  // In-memory storage for reports (would be a database in production)
  private reports: ComplianceReport[] = [];
  
  /**
   * Generate a compliance report
   */
  async generateReport(type: string, period: Period): Promise<ComplianceReport> {
    try {
      // Validate report type
      if (!this.isValidReportType(type)) {
        throw new ComplianceError(`Invalid report type: ${type}`);
      }
      
      // Validate period
      this.validateReportPeriod(period);
      
      // Create report record
      const report: ComplianceReport = {
        id: uuidv4(),
        type,
        period,
        status: 'draft',
        data: {},
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: new Date()
      };
      
      // Store report
      this.reports.push(report);
      
      logger.info(`Created compliance report of type ${type}`, { reportId: report.id });
      
      // Generate report data
      const reportData = await this.generateReportData(report);
      
      // Update report
      report.data = reportData;
      report.status = 'generated';
      report.updatedAt = new Date();
      
      // Audit report generation
      await auditService.logEvent({
        userId: 'system',
        action: 'compliance.report_generated',
        resource: AuditResource.SYSTEM,
        ip: 'system',
        status: 'success',
        metadata: {
          reportId: report.id,
          reportType: type
        }
      });
      
      logger.info(`Generated compliance report of type ${type}`, { reportId: report.id });
      
      return report;
    } catch (error) {
      logger.error('Error generating compliance report', { error, type });
      throw new ComplianceError('Failed to generate compliance report');
    }
  }
  
  /**
   * Get a report by ID
   */
  async getReportById(reportId: string): Promise<ComplianceReport> {
    try {
      const report = this.reports.find(r => r.id === reportId);
      
      if (!report) {
        throw new ComplianceError(`Report not found: ${reportId}`);
      }
      
      return report;
    } catch (error) {
      logger.error('Error getting report', { error, reportId });
      throw new ComplianceError('Failed to get report');
    }
  }
  
  /**
   * List reports with filtering
   */
  async listReports(filter: ReportFilter = {}): Promise<ComplianceReport[]> {
    try {
      let filteredReports = [...this.reports];
      
      // Apply type filter
      if (filter.type) {
        filteredReports = filteredReports.filter(r => r.type === filter.type);
      }
      
      // Apply status filter
      if (filter.status) {
        filteredReports = filteredReports.filter(r => r.status === filter.status);
      }
      
      // Apply date range filters
      if (filter.fromDate) {
        filteredReports = filteredReports.filter(r => r.createdAt >= filter.fromDate);
      }
      
      if (filter.toDate) {
        filteredReports = filteredReports.filter(r => r.createdAt <= filter.toDate);
      }
      
      // Apply creator filter
      if (filter.createdBy) {
        filteredReports = filteredReports.filter(r => r.createdBy === filter.createdBy);
      }
      
      // Sort by creation date, newest first
      filteredReports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return filteredReports;
    } catch (error) {
      logger.error('Error listing reports', { error, filter });
      throw new ComplianceError('Failed to list reports');
    }
  }
  
  /**
   * Export a report to a specified format
   */
  async exportReport(
    reportId: string,
    format: 'pdf' | 'csv' | 'json'
  ): Promise<{ url: string; expiresAt: Date }> {
    try {
      // Get the report
      const report = await this.getReportById(reportId);
      
      // In a real implementation, this would generate the file in the requested format
      // For now, return a placeholder URL
      const url = `/api/v1/compliance/reports/${reportId}/export?format=${format}`;
      
      // Update report with file URL
      report.fileUrl = url;
      report.updatedAt = new Date();
      
      logger.info(`Exported compliance report to ${format}`, { reportId });
      
      // Return download URL with expiration
      return {
        url,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
    } catch (error) {
      logger.error('Error exporting report', { error, reportId, format });
      throw new ComplianceError('Failed to export report');
    }
  }
  
  /**
   * Assess compliance against a framework
   */
  async assessCompliance(frameworkId: string): Promise<ComplianceAssessment> {
    try {
      // Get the framework
      const frameworks = await this.getFrameworks();
      const framework = frameworks.find(f => f.id === frameworkId);
      
      if (!framework) {
        throw new ComplianceError(`Framework not found: ${frameworkId}`);
      }
      
      // Collect evidence for all controls
      const evidence = await collectEvidence(framework);
      
      // Process results
      const controlResults = framework.controls.map(control => {
        const controlEvidence = evidence.find(e => e.controlId === control.id);
        
        return {
          controlId: control.id,
          controlName: control.name,
          description: control.description,
          compliant: controlEvidence?.compliant || false,
          evidence: controlEvidence?.evidence,
          notes: controlEvidence?.notes
        };
      });
      
      // Identify gaps
      const gaps = controlResults
        .filter(result => !result.compliant)
        .map(result => {
          const control = framework.controls.find(c => c.id === result.controlId);
          
          return {
            controlId: result.controlId,
            controlName: result.controlName,
            description: control?.description || '',
            severity: control?.severity || 'medium',
            recommendation: control?.recommendation || 'Implement the required control'
          };
        });
      
      // Calculate overall score
      const totalControls = framework.controls.length;
      const compliantControls = controlResults.filter(r => r.compliant).length;
      const overallScore = totalControls > 0 ? (compliantControls / totalControls) * 100 : 0;
      
      // Create assessment result
      const assessment: ComplianceAssessment = {
        frameworkId,
        frameworkName: framework.name,
        timestamp: new Date(),
        overallScore,
        controlResults,
        gaps
      };
      
      logger.info(`Completed compliance assessment for framework ${frameworkId}`, {
        score: overallScore,
        compliantControls,
        totalControls
      });
      
      return assessment;
    } catch (error) {
      logger.error('Error assessing compliance', { error, frameworkId });
      throw new ComplianceError('Failed to assess compliance');
    }
  }
  
  /**
   * Get available compliance frameworks
   */
  async getFrameworks(): Promise<ComplianceFramework[]> {
    try {
      return getComplianceFrameworks();
    } catch (error) {
      logger.error('Error getting compliance frameworks', { error });
      throw new ComplianceError('Failed to get compliance frameworks');
    }
  }
  
  /**
   * Check if report type is valid
   */
  private isValidReportType(type: string): boolean {
    const validTypes = [
      'gdpr',
      'ccpa',
      'hipaa',
      'security',
      'data_protection',
      'access_control',
      'incident_response'
    ];
    
    return validTypes.includes(type);
  }
  
  /**
   * Validate report period
   */
  private validateReportPeriod(period: Period): void {
    // Check if start date is before end date
    if (period.start > period.end) {
      throw new ComplianceError('Start date must be before end date');
    }
    
    // Check if period is not in the future
    if (period.end > new Date()) {
      throw new ComplianceError('Report period cannot extend into the future');
    }
  }
  
  /**
   * Generate report data
   */
  private async generateReportData(report: ComplianceReport): Promise<Record<string, any>> {
    // Generate report data based on type
    return generateReport(report.type, report.period);
  }
}

// Export singleton instance
export const complianceReportingService = new ComplianceReportingService();
