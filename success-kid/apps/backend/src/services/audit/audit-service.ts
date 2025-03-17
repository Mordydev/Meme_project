/**
 * Audit Service
 * 
 * Provides comprehensive auditing capabilities for the points-to-token
 * redemption system, tracking operations, verifying integrity,
 * and generating audit reports.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { RedemptionRepository } from '../../repositories/redemption-repository';
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { TokenTransferService } from '../blockchain/token-transfer-service';
import { RedemptionStatus } from '../points/redemption-service';
import { ReconciliationService } from './reconciliation-service';
import { logger } from '../../lib/logger';

/**
 * Audit operation types
 */
export enum AuditOperationType {
  REDEMPTION_REQUEST = 'redemption_request',
  REDEMPTION_PROCESS = 'redemption_process',
  REDEMPTION_COMPLETE = 'redemption_complete',
  REDEMPTION_FAIL = 'redemption_fail',
  POINTS_DEDUCT = 'points_deduct',
  POINTS_REFUND = 'points_refund',
  TOKEN_TRANSFER = 'token_transfer',
  MANUAL_INTERVENTION = 'manual_intervention',
  SYSTEM_RECONCILIATION = 'system_reconciliation'
}

/**
 * Audit record interface
 */
export interface AuditRecord {
  id: string;
  operationType: AuditOperationType;
  userId?: string;
  redemptionId?: string;
  transactionHash?: string;
  pointsAmount?: number;
  tokenAmount?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
  performedBy?: string;
  status: 'success' | 'failure';
  details?: string;
}

/**
 * Audit summary interface
 */
export interface AuditSummary {
  timeframe: {
    startDate: Date;
    endDate: Date;
  };
  operations: {
    total: number;
    byType: Record<AuditOperationType, number>;
    success: number;
    failure: number;
  };
  users: {
    total: number;
    withActivity: number;
  };
  points: {
    total: number;
    redeemed: number;
    refunded: number;
  };
  tokens: {
    total: number;
    transferred: number;
  };
  reconciliation: {
    lastRun?: Date;
    discrepancies: number;
    resolution: {
      pending: number;
      resolved: number;
    };
  };
}

/**
 * Service for auditing redemption operations
 */
export class AuditService {
  private reconciliationService: ReconciliationService;
  
  constructor(
    private db: Pool,
    private redemptionRepository: RedemptionRepository,
    private userPointsRepository: UserPointsRepository,
    private tokenTransferService: TokenTransferService
  ) {
    // Create reconciliation service
    this.reconciliationService = new ReconciliationService(
      db,
      redemptionRepository,
      tokenTransferService
    );
  }

  /**
   * Record an audit event
   * 
   * @param auditRecord - Audit record to save
   * @returns Created audit record ID
   */
  async recordAuditEvent(auditRecord: Omit<AuditRecord, 'id' | 'timestamp'>): Promise<string> {
    try {
      const id = uuidv4();
      const timestamp = new Date();
      
      // In a real implementation, this would be stored in a database
      // For now, we just log it
      logger.info('Audit event recorded', {
        id,
        ...auditRecord,
        timestamp
      });
      
      return id;
    } catch (error) {
      logger.error('Error recording audit event', { error, auditRecord });
      throw error;
    }
  }

  /**
   * Get audit records
   * 
   * @param options - Query options
   * @returns Audit records
   */
  async getAuditRecords(options: {
    userId?: string;
    redemptionId?: string;
    operationType?: AuditOperationType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<AuditRecord[]> {
    try {
      // In a real implementation, this would query a database
      // For now, we return a mock response
      return [];
    } catch (error) {
      logger.error('Error getting audit records', { error, options });
      throw error;
    }
  }

  /**
   * Generate audit summary for a time period
   * 
   * @param startDate - Start date for summary
   * @param endDate - End date for summary
   * @returns Audit summary
   */
  async generateAuditSummary(
    startDate: Date,
    endDate: Date
  ): Promise<AuditSummary> {
    try {
      logger.info('Generating audit summary', { startDate, endDate });
      
      // Get redemptions in the period
      const redemptions = await this.redemptionRepository.findByQuery({
        startDate,
        endDate,
        limit: 100000 // High limit to get all
      });
      
      // Count success/failure
      const successfulRedemptions = redemptions.filter(r => r.status === RedemptionStatus.COMPLETED);
      const failedRedemptions = redemptions.filter(r => r.status === RedemptionStatus.FAILED);
      
      // Get unique users
      const uniqueUsers = new Set(redemptions.map(r => r.userId));
      
      // Calculate points totals
      const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + r.pointsAmount, 0);
      
      // Calculate token totals
      const totalTokensTransferred = successfulRedemptions.reduce((sum, r) => sum + r.tokenAmount, 0);
      
      // Run reconciliation to get discrepancies
      const reconciliation = await this.reconciliationService.reconcileRedemptions(startDate, endDate);
      
      // Create summary
      return {
        timeframe: {
          startDate,
          endDate
        },
        operations: {
          total: redemptions.length,
          byType: {
            [AuditOperationType.REDEMPTION_REQUEST]: redemptions.length,
            [AuditOperationType.REDEMPTION_PROCESS]: redemptions.filter(r => 
              r.status === RedemptionStatus.PROCESSING || 
              r.status === RedemptionStatus.COMPLETED || 
              r.status === RedemptionStatus.FAILED
            ).length,
            [AuditOperationType.REDEMPTION_COMPLETE]: successfulRedemptions.length,
            [AuditOperationType.REDEMPTION_FAIL]: failedRedemptions.length,
            [AuditOperationType.POINTS_DEDUCT]: redemptions.length, // Assuming each redemption had a points deduction
            [AuditOperationType.POINTS_REFUND]: failedRedemptions.length, // Assuming failed redemptions had points refunded
            [AuditOperationType.TOKEN_TRANSFER]: successfulRedemptions.length,
            [AuditOperationType.MANUAL_INTERVENTION]: redemptions.filter(r => 
              r.metadata && r.metadata.manualUpdate
            ).length,
            [AuditOperationType.SYSTEM_RECONCILIATION]: 1 // Current reconciliation
          },
          success: successfulRedemptions.length,
          failure: failedRedemptions.length
        },
        users: {
          total: uniqueUsers.size,
          withActivity: uniqueUsers.size
        },
        points: {
          total: totalPointsRedeemed,
          redeemed: totalPointsRedeemed,
          refunded: failedRedemptions.reduce((sum, r) => sum + r.pointsAmount, 0)
        },
        tokens: {
          total: totalTokensTransferred,
          transferred: totalTokensTransferred
        },
        reconciliation: {
          lastRun: new Date(),
          discrepancies: reconciliation.discrepancies.length,
          resolution: {
            pending: reconciliation.discrepancies.filter(d => !d.resolved).length,
            resolved: reconciliation.discrepancies.filter(d => d.resolved).length
          }
        }
      };
    } catch (error) {
      logger.error('Error generating audit summary', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Run a full system audit
   * 
   * @param startDate - Start date for audit
   * @param endDate - End date for audit
   * @returns Audit results
   */
  async runSystemAudit(
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: AuditSummary;
    reconciliation: {
      totalRedemptions: number;
      matchedTransactions: number;
      discrepancyCount: number;
      reconciliationRate: number;
    };
    integrityCheck: {
      passed: boolean;
      issues: string[];
    };
  }> {
    try {
      logger.info('Running system audit', { startDate, endDate });
      
      // Generate summary
      const summary = await this.generateAuditSummary(startDate, endDate);
      
      // Run reconciliation
      const reconciliation = await this.reconciliationService.reconcileRedemptions(startDate, endDate);
      
      // Run integrity checks
      const integrityCheck = await this.checkSystemIntegrity(startDate, endDate);
      
      // Record audit operation
      await this.recordAuditEvent({
        operationType: AuditOperationType.SYSTEM_RECONCILIATION,
        metadata: {
          timeframe: {
            startDate,
            endDate
          },
          reconciliationRate: reconciliation.reconciliationRate,
          discrepancyCount: reconciliation.discrepancies.length,
          integrityPassed: integrityCheck.passed
        },
        status: integrityCheck.passed ? 'success' : 'failure',
        details: integrityCheck.passed 
          ? 'System audit completed successfully' 
          : `System audit found ${integrityCheck.issues.length} issues`
      });
      
      return {
        summary,
        reconciliation: {
          totalRedemptions: reconciliation.totalRedemptions,
          matchedTransactions: reconciliation.matchedTransactions,
          discrepancyCount: reconciliation.discrepancies.length,
          reconciliationRate: reconciliation.reconciliationRate
        },
        integrityCheck
      };
    } catch (error) {
      logger.error('Error running system audit', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Check system integrity
   * 
   * @param startDate - Start date for check
   * @param endDate - End date for check
   * @returns Integrity check result
   */
  private async checkSystemIntegrity(
    startDate: Date,
    endDate: Date
  ): Promise<{
    passed: boolean;
    issues: string[];
  }> {
    try {
      const issues: string[] = [];
      
      // Get all redemptions in period
      const redemptions = await this.redemptionRepository.findByQuery({
        startDate,
        endDate,
        limit: 100000 // High limit to get all
      });
      
      // 1. Check for redemptions with inconsistent statuses
      for (const redemption of redemptions) {
        // If status is completed but no transaction hash
        if (redemption.status === RedemptionStatus.COMPLETED && !redemption.transactionHash) {
          issues.push(`Redemption ${redemption.id} marked as completed but has no transaction hash`);
        }
        
        // If status is processing for too long (more than 24 hours)
        if (redemption.status === RedemptionStatus.PROCESSING) {
          const processingTime = Date.now() - redemption.requestedAt.getTime();
          const hoursPending = processingTime / (1000 * 60 * 60);
          
          if (hoursPending > 24) {
            issues.push(`Redemption ${redemption.id} has been processing for ${hoursPending.toFixed(1)} hours`);
          }
        }
      }
      
      // 2. Check for points ledger imbalances
      // In a real implementation, this would verify that points deducted for redemptions
      // match the sum of redemption records
      
      // 3. Check treasury balance vs. tokens issued
      // In a real implementation, this would compare the sum of successful redemptions
      // with the tokens transferred from treasury
      
      // Return result
      return {
        passed: issues.length === 0,
        issues
      };
    } catch (error) {
      logger.error('Error checking system integrity', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Get reconciliation service
   */
  getReconciliationService(): ReconciliationService {
    return this.reconciliationService;
  }
}
