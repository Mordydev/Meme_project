/**
 * Wallet Balance Service
 * 
 * Handles wallet balance retrieval, caching, and refreshing.
 */
import { WalletRepository } from '../../repositories/wallet-repository';
import { WalletConnection, TokenBalance } from '../../models/entities/wallet.model';
import { logger } from '../../lib/logger';
import { NotFoundError } from '../../errors';
import { getBlockchainProviderFactory } from '../../blockchain';
import { BalanceData } from '../../blockchain/types';

/**
 * Balance refresh frequency
 */
export enum RefreshFrequency {
  HIGH = 'high',     // Every 1 minute
  MEDIUM = 'medium', // Every 5 minutes
  LOW = 'low'        // Every 15 minutes
}

/**
 * Balance response with human-readable values
 */
export interface BalanceResponse {
  address: string;
  tokenSymbol: string;
  balance: string;
  formattedBalance: string;
  usdValue: number | null;
  lastUpdated: Date;
}

/**
 * Wallet balance service
 */
export class WalletBalanceService {
  // Default cache TTL
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // In-memory balance cache
  // In production, use Redis or another distributed cache
  private balanceCache = new Map<string, {
    data: BalanceData;
    timestamp: number;
    expiresAt: number;
  }>();
  
  /**
   * Create wallet balance service
   * 
   * @param walletRepository Wallet repository
   */
  constructor(private readonly walletRepository: WalletRepository) {}

  /**
   * Get balance for a wallet
   * 
   * @param walletAddress Wallet address
   * @param forceRefresh Whether to force a refresh from blockchain
   * @returns Balance data
   */
  async getWalletBalance(
    walletAddress: string,
    forceRefresh: boolean = false
  ): Promise<BalanceResponse> {
    logger.info('Getting wallet balance', { walletAddress, forceRefresh });
    
    // Try to get from database first
    const storedBalance = await this.walletRepository.getTokenBalance(walletAddress);
    
    // Check if we have cached balance and it's not expired
    const cacheKey = `balance:${walletAddress}`;
    const cachedBalance = this.balanceCache.get(cacheKey);
    
    // Return cached balance if it's not expired and not forcing refresh
    if (
      cachedBalance && 
      Date.now() < cachedBalance.expiresAt && 
      !forceRefresh
    ) {
      logger.debug('Using cached balance', { walletAddress });
      
      return this.formatBalanceResponse(
        walletAddress,
        cachedBalance.data
      );
    }
    
    // Return stored balance if it's recent enough and not forcing refresh
    if (
      storedBalance && 
      Date.now() - storedBalance.last_updated.getTime() < this.DEFAULT_CACHE_TTL && 
      !forceRefresh
    ) {
      logger.debug('Using stored balance', { walletAddress });
      
      return {
        address: walletAddress,
        tokenSymbol: storedBalance.token_symbol,
        balance: storedBalance.balance.toString(),
        formattedBalance: this.formatDecimal(storedBalance.balance, 2),
        usdValue: storedBalance.usd_value || null,
        lastUpdated: storedBalance.last_updated
      };
    }
    
    // Get blockchain provider for this wallet
    const providerFactory = getBlockchainProviderFactory();
    const provider = providerFactory.getProviderForAddress(walletAddress);
    
    try {
      // Get fresh balance from blockchain
      logger.debug('Fetching fresh balance from blockchain', { walletAddress });
      const balanceData = await provider.getBalance(walletAddress);
      
      // Update cache
      this.balanceCache.set(cacheKey, {
        data: balanceData,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.DEFAULT_CACHE_TTL
      });
      
      // Update database
      await this.updateStoredBalance(walletAddress, balanceData);
      
      return this.formatBalanceResponse(walletAddress, balanceData);
    } catch (error) {
      logger.error('Error fetching balance from blockchain', {
        walletAddress,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // If we have stored balance, use it as fallback
      if (storedBalance) {
        logger.debug('Using stored balance as fallback', { walletAddress });
        
        return {
          address: walletAddress,
          tokenSymbol: storedBalance.token_symbol,
          balance: storedBalance.balance.toString(),
          formattedBalance: this.formatDecimal(storedBalance.balance, 2),
          usdValue: storedBalance.usd_value || null,
          lastUpdated: storedBalance.last_updated
        };
      }
      
      // Re-throw the error if we have no fallback
      throw error;
    }
  }

  /**
   * Get balance for a user's primary wallet
   * 
   * @param userId User ID
   * @param forceRefresh Whether to force a refresh from blockchain
   * @returns Balance data or null if no primary wallet
   */
  async getUserPrimaryWalletBalance(
    userId: string,
    forceRefresh: boolean = false
  ): Promise<BalanceResponse | null> {
    logger.info('Getting user primary wallet balance', { userId, forceRefresh });
    
    // Get user's primary wallet
    const primaryWallet = await this.walletRepository.findPrimaryWallet(userId);
    
    if (!primaryWallet) {
      logger.debug('No primary wallet found', { userId });
      return null;
    }
    
    return this.getWalletBalance(primaryWallet.wallet_address, forceRefresh);
  }

  /**
   * Get balances for all of user's wallets
   * 
   * @param userId User ID
   * @param forceRefresh Whether to force a refresh from blockchain
   * @returns Map of wallet address to balance data
   */
  async getUserWalletBalances(
    userId: string,
    forceRefresh: boolean = false
  ): Promise<BalanceResponse[]> {
    logger.info('Getting balances for all user wallets', { userId, forceRefresh });
    
    // Get all user wallets
    const wallets = await this.walletRepository.findByUserId(userId);
    
    if (wallets.length === 0) {
      logger.debug('No wallets found', { userId });
      return [];
    }
    
    // Get balances for all wallets
    const balancePromises = wallets.map(wallet => 
      this.getWalletBalance(wallet.wallet_address, forceRefresh)
        .catch(error => {
          logger.error('Error getting wallet balance', {
            userId,
            walletAddress: wallet.wallet_address,
            error: error instanceof Error ? error.message : String(error)
          });
          
          // Return null for failed balance fetches
          return null;
        })
    );
    
    const balances = await Promise.all(balancePromises);
    
    // Filter out nulls (failed fetches)
    return balances.filter(Boolean) as BalanceResponse[];
  }

  /**
   * Schedule background balance refresh
   * 
   * @param walletAddress Wallet address
   * @param frequency Refresh frequency
   */
  async scheduleBackgroundRefresh(
    walletAddress: string,
    frequency: RefreshFrequency = RefreshFrequency.MEDIUM
  ): Promise<void> {
    logger.info('Scheduling background balance refresh', {
      walletAddress,
      frequency
    });
    
    // In a real implementation, this would schedule a job
    // For now, just log the intent
    logger.info('Background refresh scheduled', {
      walletAddress,
      frequency,
      message: 'This would schedule a job in a production environment'
    });
  }

  /**
   * Update stored balance in database
   * 
   * @param walletAddress Wallet address
   * @param balanceData Balance data
   */
  private async updateStoredBalance(
    walletAddress: string,
    balanceData: BalanceData
  ): Promise<void> {
    try {
      const tokenBalance: TokenBalance = {
        wallet_address: walletAddress,
        token_symbol: balanceData.token,
        balance: parseFloat(balanceData.amount),
        usd_value: balanceData.usdValue,
        last_updated: balanceData.lastUpdated
      };
      
      await this.walletRepository.updateTokenBalance(tokenBalance);
    } catch (error) {
      logger.error('Error updating stored balance', {
        walletAddress,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Don't throw, this is a background operation
    }
  }

  /**
   * Format balance response
   * 
   * @param walletAddress Wallet address
   * @param balanceData Balance data
   * @returns Formatted balance response
   */
  private formatBalanceResponse(
    walletAddress: string,
    balanceData: BalanceData
  ): BalanceResponse {
    return {
      address: walletAddress,
      tokenSymbol: balanceData.token,
      balance: balanceData.amount,
      formattedBalance: this.formatDecimal(parseFloat(balanceData.amount), 2),
      usdValue: balanceData.usdValue || null,
      lastUpdated: balanceData.lastUpdated
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
