/**
 * Reconciliation Service
 * 
 * Validates the consistency between on-platform redemption records
 * and actual blockchain transactions, identifying discrepancies
 * and providing audit capabilities.
 */
import { Pool } from 'pg';
import { RedemptionRepository } from '../../repositories/redemption-repository';
import { TokenTransferService, TransactionStatus } from '../blockchain/token-transfer-service';
import { RedemptionStatus } from '../points/redemption-service';
import { logger } from '../../lib/logger';
import { eventBus, EventType } from '../../lib/event-bus';

/**
 * Discrepancy types
 */
export enum DiscrepancyType {
  MISSING_BLOCKCHAIN_TRANSACTION = 'missing_blockchain_transaction',
  AMOUNT_MISMATCH = 'amount_mismatch',
  STATUS_MISMATCH = 'status_mismatch',
  MISSING_REDEMPTION_RECORD = 'missing_redemption_record',
  TRANSACTION_FAILURE = 'transaction_failure'
}

/**
 * Discrepancy interface
 */
export interface Discrepancy {
  id: string;
  type: DiscrepancyType;
  redemptionId?: string;
  transactionHash?: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

/**
 * Reconciliation result interface
 */
export interface ReconciliationResult {
  startDate: Date;
  endDate: Date;
  totalRedemptions: number;
  totalBlockchainTransactions: number;
  matchedTransactions: number;
  discrepancies: Discrepancy[];
  reconciliationRate: number;
  timestamp: Date;
}

/**
 * Resolution interface
 */
export interface Resolution {
  action: 'reprocess' | 'mark_resolved' | 'refund' | 'manual_update';
  notes: string;
  updatedStatus?: RedemptionStatus;
}

/**
 * Service to reconcile on-platform redemptions with blockchain transactions
 */
export class ReconciliationService {
  constructor(
    private db: Pool,
    private redemptionRepository: RedemptionRepository,
    private tokenTransferService: TokenTransferService
  ) {}

  /**
   * Reconcile redemptions with blockchain transactions in a date range
   * 
   * @param startDate - Start date for reconciliation
   * @param endDate - End date for reconciliation
   * @returns Reconciliation result
   */
  async reconcileRedemptions(
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationResult> {
    try {
      logger.info('Starting reconciliation', { startDate, endDate });
      
      // Get all completed redemptions in date range
      const redemptions = await this.redemptionRepository.findByQuery({
        status: [RedemptionStatus.COMPLETED, RedemptionStatus.PROCESSING],
        startDate,
        endDate,
        limit: 1000 // Set a reasonably high limit
      });
      
      // Extract transaction hashes
      const txHashes = redemptions
        .filter(r => r.transactionHash)
        .map(r => r.transactionHash);
      
      // Get blockchain transactions status
      const blockchainTransactions = await Promise.all(
        txHashes.map(hash => this.tokenTransferService.getTransactionStatus(hash))
      );
      
      // Filter out null results
      const validBlockchainTransactions = blockchainTransactions.filter(tx => tx !== null);
      
      // Build hash maps for comparison
      const redemptionMap = new Map(
        redemptions.map(r => [r.transactionHash, r])
      );
      
      const blockchainMap = new Map(
        validBlockchainTransactions.map(tx => [tx.txHash, tx])
      );
      
      // Find discrepancies
      const discrepancies: Discrepancy[] = [];
      const now = new Date();
      
      // Check for missing blockchain transactions
      for (const redemption of redemptions) {
        if (!redemption.transactionHash) {
          continue; // Skip redemptions without transaction hash
        }
        
        const blockchainTx = blockchainMap.get(redemption.transactionHash);
        
        if (!blockchainTx) {
          // Transaction hash exists in redemption but not found on blockchain
          discrepancies.push({
            id: `missing-tx-${redemption.id}`,
            type: DiscrepancyType.MISSING_BLOCKCHAIN_TRANSACTION,
            redemptionId: redemption.id,
            transactionHash: redemption.transactionHash,
            details: {
              redemptionAmount: redemption.tokenAmount,
              redemptionTimestamp: redemption.requestedAt,
              redemptionStatus: redemption.status
            },
            timestamp: now
          });
          continue;
        }
        
        // Check for amount mismatches
        if (!this.areAmountsEqual(redemption.tokenAmount, blockchainTx.amount)) {
          discrepancies.push({
            id: `amount-mismatch-${redemption.id}`,
            type: DiscrepancyType.AMOUNT_MISMATCH,
            redemptionId: redemption.id,
            transactionHash: redemption.transactionHash,
            details: {
              redemptionAmount: redemption.tokenAmount,
              blockchainAmount: blockchainTx.amount,
              difference: Math.abs(redemption.tokenAmount - blockchainTx.amount)
            },
            timestamp: now
          });
        }
        
        // Check for status mismatches
        if (
          redemption.status === RedemptionStatus.COMPLETED && 
          blockchainTx.status !== TransactionStatus.CONFIRMED
        ) {
          discrepancies.push({
            id: `status-mismatch-${redemption.id}`,
            type: DiscrepancyType.STATUS_MISMATCH,
            redemptionId: redemption.id,
            transactionHash: redemption.transactionHash,
            details: {
              redemptionStatus: redemption.status,
              blockchainStatus: blockchainTx.status,
              redemptionTimestamp: redemption.requestedAt,
              processedAt: redemption.processedAt
            },
            timestamp: now
          });
        }
        
        if (
          redemption.status === RedemptionStatus.PROCESSING && 
          blockchainTx.status === TransactionStatus.FAILED
        ) {
          discrepancies.push({
            id: `tx-failure-${redemption.id}`,
            type: DiscrepancyType.TRANSACTION_FAILURE,
            redemptionId: redemption.id,
            transactionHash: redemption.transactionHash,
            details: {
              redemptionStatus: redemption.status,
              blockchainStatus: blockchainTx.status,
              redemptionTimestamp: redemption.requestedAt
            },
            timestamp: now
          });
        }
      }
      
      // Calculate statistics
      const totalRedemptions = redemptions.length;
      const matchedTransactions = totalRedemptions - discrepancies.length;
      const reconciliationRate = totalRedemptions > 0 
        ? (matchedTransactions / totalRedemptions) * 100 
        : 100;
      
      // Create result
      const result: ReconciliationResult = {
        startDate,
        endDate,
        totalRedemptions,
        totalBlockchainTransactions: validBlockchainTransactions.length,
        matchedTransactions,
        discrepancies,
        reconciliationRate,
        timestamp: now
      };
      
      // Log summary
      logger.info('Reconciliation completed', { 
        startDate, 
        endDate,
        totalRedemptions,
        matchedTransactions,
        discrepancyCount: discrepancies.length,
        reconciliationRate: `${reconciliationRate.toFixed(2)}%`
      });
      
      if (discrepancies.length > 0) {
        logger.warn('Reconciliation found discrepancies', {
          count: discrepancies.length,
          types: this.countDiscrepancyTypes(discrepancies)
        });
        
        // Publish event for notification
        await eventBus.publish(EventType.AUDIT_DISCREPANCIES_FOUND, {
          count: discrepancies.length,
          types: this.countDiscrepancyTypes(discrepancies),
          reconciliationId: `${startDate.toISOString()}-${endDate.toISOString()}`
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Error reconciling redemptions', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Find all discrepancies
   * 
   * @param options - Query options
   * @returns Array of discrepancies
   */
  async findDiscrepancies(options: {
    startDate?: Date;
    endDate?: Date;
    types?: DiscrepancyType[];
    resolved?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<Discrepancy[]> {
    try {
      // In a real implementation, this would query a database table of stored discrepancies
      // For this implementation, we'll return an empty array
      
      // Perform reconciliation to find current discrepancies
      const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endDate = options.endDate || new Date();
      
      const reconciliation = await this.reconcileRedemptions(startDate, endDate);
      
      let discrepancies = reconciliation.discrepancies;
      
      // Apply filters
      if (options.types && options.types.length > 0) {
        discrepancies = discrepancies.filter(d => options.types.includes(d.type));
      }
      
      if (options.resolved !== undefined) {
        discrepancies = discrepancies.filter(d => d.resolved === options.resolved);
      }
      
      // Apply pagination
      if (options.offset !== undefined && options.limit !== undefined) {
        discrepancies = discrepancies.slice(options.offset, options.offset + options.limit);
      } else if (options.limit !== undefined) {
        discrepancies = discrepancies.slice(0, options.limit);
      }
      
      return discrepancies;
    } catch (error) {
      logger.error('Error finding discrepancies', { error, options });
      throw error;
    }
  }

  /**
   * Resolve a discrepancy
   * 
   * @param discrepancyId - Discrepancy ID to resolve
   * @param resolution - Resolution details
   * @returns Success status
   */
  async resolveDiscrepancy(
    discrepancyId: string,
    resolution: Resolution
  ): Promise<boolean> {
    try {
      // In a real implementation, this would update a database record
      
      // For now, we log the resolution request
      logger.info('Discrepancy resolution requested', { 
        discrepancyId, 
        resolution 
      });
      
      // Here we would apply the appropriate action based on resolution.action
      const actions = {
        // Re-process a failed transaction
        reprocess: async (discrepancyId: string) => {
          // Extract redemption ID from discrepancy ID
          const redemptionId = discrepancyId.split('-')[2];
          
          // Logic to re-queue the redemption for processing would go here
          logger.info('Reprocessing redemption', { redemptionId });
          return true;
        },
        
        // Mark as resolved without action
        mark_resolved: async () => {
          logger.info('Marking discrepancy as resolved', { discrepancyId });
          return true;
        },
        
        // Refund points to user
        refund: async (discrepancyId: string) => {
          // Extract redemption ID from discrepancy ID
          const redemptionId = discrepancyId.split('-')[2];
          
          // Logic to refund points would go here
          logger.info('Refunding points for redemption', { redemptionId });
          return true;
        },
        
        // Manually update redemption status
        manual_update: async (discrepancyId: string, newStatus: RedemptionStatus) => {
          // Extract redemption ID from discrepancy ID
          const redemptionId = discrepancyId.split('-')[2];
          
          if (!redemptionId || !newStatus) {
            return false;
          }
          
          // Update redemption status
          try {
            await this.redemptionRepository.updateStatus(
              redemptionId,
              newStatus,
              {
                metadata: {
                  manualUpdate: {
                    reason: resolution.notes,
                    timestamp: new Date().toISOString()
                  }
                }
              }
            );
            
            logger.info('Manually updated redemption status', { 
              redemptionId, 
              newStatus 
            });
            
            return true;
          } catch (error) {
            logger.error('Error updating redemption status', { 
              error, 
              redemptionId, 
              newStatus 
            });
            return false;
          }
        }
      };
      
      // Execute the corresponding action
      if (resolution.action === 'reprocess') {
        return await actions.reprocess(discrepancyId);
      } else if (resolution.action === 'mark_resolved') {
        return await actions.mark_resolved();
      } else if (resolution.action === 'refund') {
        return await actions.refund(discrepancyId);
      } else if (resolution.action === 'manual_update' && resolution.updatedStatus) {
        return await actions.manual_update(discrepancyId, resolution.updatedStatus);
      }
      
      return false;
    } catch (error) {
      logger.error('Error resolving discrepancy', { error, discrepancyId, resolution });
      throw error;
    }
  }

  /**
   * Schedule a recurring reconciliation job
   * 
   * @param intervalHours - Hours between reconciliations
   * @param lookbackDays - Days to look back for each reconciliation
   * @returns Function to stop the job
   */
  scheduleRecurringReconciliation(
    intervalHours: number = 24,
    lookbackDays: number = 7
  ): { stop: () => void } {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    logger.info('Scheduling recurring reconciliation', { 
      intervalHours, 
      lookbackDays
    });
    
    const timer = setInterval(async () => {
      try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
        
        logger.info('Running scheduled reconciliation', { startDate, endDate });
        
        await this.reconcileRedemptions(startDate, endDate);
      } catch (error) {
        logger.error('Error in scheduled reconciliation', { error });
      }
    }, intervalMs);
    
    return {
      stop: () => {
        clearInterval(timer);
        logger.info('Stopped recurring reconciliation');
      }
    };
  }

  /**
   * Check if two amounts are equal within a small tolerance
   * 
   * @param amount1 First amount
   * @param amount2 Second amount
   * @returns true if amounts are equal within tolerance
   */
  private areAmountsEqual(amount1: number, amount2: number): boolean {
    // Allow for very small rounding differences
    const tolerance = 0.00001;
    return Math.abs(amount1 - amount2) < tolerance;
  }
  
  /**
   * Count discrepancies by type
   * 
   * @param discrepancies List of discrepancies
   * @returns Count by type
   */
  private countDiscrepancyTypes(discrepancies: Discrepancy[]): Record<DiscrepancyType, number> {
    const counts = {
      [DiscrepancyType.MISSING_BLOCKCHAIN_TRANSACTION]: 0,
      [DiscrepancyType.AMOUNT_MISMATCH]: 0,
      [DiscrepancyType.STATUS_MISMATCH]: 0,
      [DiscrepancyType.MISSING_REDEMPTION_RECORD]: 0,
      [DiscrepancyType.TRANSACTION_FAILURE]: the 0
    };
    
    for (const discrepancy of discrepancies) {
      counts[discrepancy.type]++;
    }
    
    return counts;
  }
}
