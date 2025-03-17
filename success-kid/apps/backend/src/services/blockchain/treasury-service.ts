/**
 * Treasury Service
 * 
 * Manages the token treasury, including balance checking and alert thresholds.
 */
import { getBlockchainProviderFactory } from '../../blockchain';
import { BalanceData } from '../../blockchain/types';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';

/**
 * Treasury status
 */
export enum TreasuryStatus {
  HEALTHY = 'healthy',
  LOW = 'low',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

/**
 * Treasury balance response
 */
export interface TreasuryBalanceResponse {
  address: string;
  balance: string;
  formattedBalance: string;
  usdValue: number | null;
  status: TreasuryStatus;
  lastUpdated: Date;
}

/**
 * Treasury service
 */
export class TreasuryService {
  private readonly treasuryAddress: string;
  private readonly tokenAddress: string;
  private readonly lowBalanceThreshold: number;
  private readonly criticalBalanceThreshold: number;
  
  // Cache for treasury balance
  private cachedBalance: {
    data: BalanceData;
    timestamp: number;
    expiresAt: number;
  } | null = null;
  
  /**
   * Create treasury service
   * 
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private readonly eventBus: EventBus
  ) {
    // Get configuration from environment
    this.treasuryAddress = process.env.TREASURY_ADDRESS || '';
    this.tokenAddress = process.env.TOKEN_ADDRESS || '';
    this.lowBalanceThreshold = parseFloat(process.env.TREASURY_LOW_THRESHOLD || '1000');
    this.criticalBalanceThreshold = parseFloat(process.env.TREASURY_CRITICAL_THRESHOLD || '100');
    
    if (!this.treasuryAddress) {
      logger.error('Treasury address not configured');
    }
  }

  /**
   * Get treasury balance
   * 
   * @param forceRefresh Whether to force a refresh from blockchain
   * @returns Treasury balance
   */
  async getTreasuryBalance(forceRefresh: boolean = false): Promise<TreasuryBalanceResponse> {
    logger.info('Getting treasury balance', { forceRefresh });
    
    // Validate treasury address
    if (!this.treasuryAddress) {
      throw new Error('Treasury address not configured');
    }
    
    // Check cache
    if (
      this.cachedBalance && 
      Date.now() < this.cachedBalance.expiresAt && 
      !forceRefresh
    ) {
      logger.debug('Using cached treasury balance');
      return this.formatBalanceResponse(this.cachedBalance.data);
    }
    
    try {
      // Get provider for treasury address
      const providerFactory = getBlockchainProviderFactory();
      const provider = providerFactory.getProviderForAddress(this.treasuryAddress);
      
      // Get balance from blockchain
      const balance = await provider.getBalance(
        this.treasuryAddress,
        this.tokenAddress
      );
      
      // Update cache
      this.cachedBalance = {
        data: balance,
        timestamp: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
      };
      
      // Check if balance is low and emit event if needed
      this.checkBalanceThresholds(parseFloat(balance.amount));
      
      return this.formatBalanceResponse(balance);
    } catch (error) {
      logger.error('Failed to get treasury balance', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return cached balance if available
      if (this.cachedBalance) {
        return this.formatBalanceResponse(this.cachedBalance.data);
      }
      
      // Return unknown status if no cached balance
      return {
        address: this.treasuryAddress,
        balance: '0',
        formattedBalance: '0.00',
        usdValue: null,
        status: TreasuryStatus.UNKNOWN,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Check if treasury has sufficient balance for a transfer
   * 
   * @param amount Amount to transfer
   * @returns Whether treasury has sufficient balance
   */
  async hasSufficientBalance(amount: number): Promise<boolean> {
    try {
      const balance = await this.getTreasuryBalance();
      return parseFloat(balance.balance) >= amount;
    } catch (error) {
      logger.error('Failed to check treasury balance', { amount, error });
      return false; // Fail safe by returning false
    }
  }

  /**
   * Schedule regular balance monitoring
   * 
   * @param intervalMinutes Interval in minutes
   */
  scheduleBalanceMonitoring(intervalMinutes: number = 15): void {
    logger.info(`Scheduling treasury balance monitoring every ${intervalMinutes} minutes`);
    
    // Initial check
    this.checkTreasuryBalance();
    
    // Set interval
    setInterval(() => {
      this.checkTreasuryBalance();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Check treasury balance and emit events if needed
   */
  private async checkTreasuryBalance(): Promise<void> {
    try {
      // Force refresh to get current balance
      const balance = await this.getTreasuryBalance(true);
      logger.info('Treasury balance checked', { 
        balance: balance.balance,
        status: balance.status
      });
    } catch (error) {
      logger.error('Failed to check treasury balance', { error });
    }
  }

  /**
   * Check balance against thresholds and emit events if needed
   * 
   * @param balance Current balance
   */
  private checkBalanceThresholds(balance: number): void {
    if (balance <= this.criticalBalanceThreshold) {
      // Critical balance alert
      logger.warn('Treasury balance critical', { 
        balance,
        threshold: this.criticalBalanceThreshold
      });
      
      this.eventBus.publish(EventType.TREASURY_BALANCE_CRITICAL, {
        balance,
        threshold: this.criticalBalanceThreshold,
        timestamp: new Date()
      }).catch(error => {
        logger.error('Failed to publish treasury critical event', { error });
      });
    } else if (balance <= this.lowBalanceThreshold) {
      // Low balance alert
      logger.warn('Treasury balance low', { 
        balance,
        threshold: this.lowBalanceThreshold
      });
      
      this.eventBus.publish(EventType.TREASURY_BALANCE_LOW, {
        balance,
        threshold: this.lowBalanceThreshold,
        timestamp: new Date()
      }).catch(error => {
        logger.error('Failed to publish treasury low event', { error });
      });
    }
  }

  /**
   * Format balance response
   * 
   * @param balance Balance data
   * @returns Formatted balance response
   */
  private formatBalanceResponse(balance: BalanceData): TreasuryBalanceResponse {
    const numericBalance = parseFloat(balance.amount);
    let status = TreasuryStatus.HEALTHY;
    
    if (numericBalance <= this.criticalBalanceThreshold) {
      status = TreasuryStatus.CRITICAL;
    } else if (numericBalance <= this.lowBalanceThreshold) {
      status = TreasuryStatus.LOW;
    }
    
    return {
      address: this.treasuryAddress,
      balance: balance.amount,
      formattedBalance: this.formatDecimal(numericBalance, 2),
      usdValue: balance.usdValue || null,
      status,
      lastUpdated: balance.lastUpdated
    };
  }

  /**
   * Format decimal number
   * 
   * @param value Numeric value
   * @param decimals Number of decimal places
   * @returns Formatted string
   */
  private formatDecimal(value: number, decimals: number): string {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
}
