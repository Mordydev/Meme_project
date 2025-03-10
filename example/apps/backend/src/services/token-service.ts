import { TokenRepository } from '../repositories/token-repository';
import { WalletRepository } from '../repositories/wallet-repository';
import { EventEmitter, EventType } from '../lib/events';
import { NotFoundError, ValidationError } from '../lib/errors';
import { TokenHolderTier, TierConfig, UserTokenBenefits } from '../models/wallet';
import { Logger } from 'pino';
import { BlockchainService } from './blockchain-service';

/**
 * Service for managing token-related operations
 */
export class TokenService {
  private tiers: TierConfig[] = [
    { name: TokenHolderTier.BRONZE, threshold: 1, multiplier: 1, benefits: ['basic_battles'] },
    { name: TokenHolderTier.SILVER, threshold: 1000, multiplier: 1.25, benefits: ['basic_battles', 'creator_spotlight', 'silver_badge'] },
    { name: TokenHolderTier.GOLD, threshold: 10000, multiplier: 1.5, benefits: ['basic_battles', 'creator_spotlight', 'gold_badge', 'exclusive_battles', 'priority_support'] },
    { name: TokenHolderTier.PLATINUM, threshold: 100000, multiplier: 2, benefits: ['basic_battles', 'creator_spotlight', 'platinum_badge', 'exclusive_battles', 'priority_support', 'premium_content', 'governance_vote'] }
  ];
  
  constructor(
    private tokenRepository: TokenRepository,
    private walletRepository: WalletRepository,
    private blockchainService: BlockchainService,
    private eventEmitter: EventEmitter,
    private logger: Logger
  ) {}

  /**
   * Register event handlers for this service
   */
  registerEventHandlers(): void {
    // Listen for token price updates
    this.eventEmitter.on(EventType.TOKEN_PRICE_UPDATED, async (data) => {
      // Future implementation: Handle token price updates
    });

    // Listen for token milestone events
    this.eventEmitter.on(EventType.TOKEN_MILESTONE_REACHED, async (data) => {
      // Future implementation: Handle milestone reached events
      // For example, update UI, trigger notifications, etc.
    });
  }

  /**
   * Get current token price and stats
   */
  async getCurrentTokenPrice() {
    const latestPrice = await this.tokenRepository.getLatestPrice();
    
    if (!latestPrice) {
      // Return default values if no price data exists yet
      return {
        price: 0,
        marketCap: 0,
        change24h: 0,
        volume24h: 0,
        timestamp: new Date()
      };
    }
    
    return latestPrice;
  }

  /**
   * Get token price history
   */
  async getTokenPriceHistory(period: 'day' | 'week' | 'month' | 'year') {
    return this.tokenRepository.getPriceHistory(period);
  }

  /**
   * Update token price
   * This would be called by external price feed service
   */
  async updateTokenPrice(
    price: number,
    marketCap: number,
    change24h: number,
    volume24h: number
  ) {
    // Validate inputs
    if (price < 0) {
      throw new ValidationError('Price cannot be negative');
    }
    
    if (marketCap < 0) {
      throw new ValidationError('Market cap cannot be negative');
    }
    
    // Add price record
    const priceRecord = await this.tokenRepository.addPriceRecord(
      price,
      marketCap,
      change24h,
      volume24h
    );
    
    // Emit price update event
    await this.eventEmitter.emit(EventType.TOKEN_PRICE_UPDATED, {
      price: priceRecord.price,
      change: priceRecord.change24h,
      timestamp: new Date().toISOString()
    });
    
    return priceRecord;
  }

  /**
   * Get token milestones
   */
  async getTokenMilestones() {
    return this.tokenRepository.getMilestones();
  }

  /**
   * Get current milestone progress
   */
  async getCurrentMilestoneProgress() {
    return this.tokenRepository.getCurrentMilestoneProgress();
  }

  /**
   * Get recent token transactions
   */
  async getRecentTransactions(limit = 20) {
    return this.tokenRepository.getRecentTransactions(limit);
  }

  /**
   * Process a token transaction
   * This would be called by blockchain listener service
   */
  async processTransaction(transactionData: {
    transactionHash: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
    blockNumber: number;
    timestamp: Date;
  }) {
    // Add transaction to history
    const transaction = await this.tokenRepository.addTransaction(transactionData);
    
    // Emit transaction event
    await this.eventEmitter.emit(EventType.TOKEN_TRANSACTION_PROCESSED, {
      transactionId: transaction.id,
      timestamp: new Date().toISOString()
    });
    
    return transaction;
  }

  /**
   * Determine user tier based on token holdings
   * @param tokenAmount The amount of tokens held
   * @returns The tier configuration
   */
  getUserTier(tokenAmount: number): TierConfig {
    // Find the highest tier the user qualifies for
    // Tiers are sorted from lowest to highest threshold
    let userTier = this.tiers[0]; // Default to lowest tier
    
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (tokenAmount >= this.tiers[i].threshold) {
        userTier = this.tiers[i];
        break;
      }
    }
    
    return userTier;
  }
  
  /**
   * Get benefits for a specific tier
   * @param tier The tier configuration
   * @returns List of benefits for the tier
   */
  private async getBenefitsForTier(tier: TierConfig): Promise<any[]> {
    try {
      // Get all benefits
      const allBenefits = await this.walletRepository.getAllTokenBenefits();
      
      // Filter benefits based on tier
      return allBenefits
        .filter(benefit => tier.benefits.includes(benefit.id))
        .map(benefit => ({
          ...benefit,
          status: 'active',
          activatedAt: new Date()
        }));
    } catch (error) {
      this.logger.error({ error, tier }, 'Failed to get benefits for tier');
      return [];
    }
  }
  
  /**
   * Refresh user benefits based on token holdings
   * @param userId User ID
   * @returns Success status
   */
  async refreshUserBenefits(userId: string): Promise<boolean> {
    try {
      // Get user's verified wallet
      const wallet = await this.walletRepository.getUserWallet(userId);
      if (!wallet || !wallet.verified) {
        this.logger.warn({ userId }, 'No verified wallet found for user during benefit refresh');
        return false;
      }
      
      // Get current token balance
      const holdings = await this.walletRepository.getUserTokenHoldings(userId);
      
      let tokenAmount = 0;
      
      // If no holdings record exists or it's stale, fetch from blockchain
      if (!holdings || this.isHoldingsStale(holdings.lastCheckedAt)) {
        try {
          tokenAmount = await this.blockchainService.getTokenBalance(wallet.address);
        } catch (error) {
          this.logger.error({ error, userId }, 'Failed to get token balance from blockchain');
          // Use existing holdings as fallback
          tokenAmount = holdings?.tokenAmount || 0;
        }
      } else {
        // Use existing holdings record
        tokenAmount = holdings.tokenAmount;
      }
      
      // Determine user's tier
      const tier = this.getUserTier(tokenAmount);
      
      // Get benefits for tier
      const benefits = await this.getBenefitsForTier(tier);
      
      // Update user's benefits
      await this.walletRepository.updateUserTokenBenefits(userId, {
        holdings: tokenAmount,
        tier: tier.name,
        updatedAt: new Date(),
        benefits,
        multiplier: tier.multiplier
      });
      
      // Emit benefit update event
      await this.eventEmitter.emit(EventType.USER_BENEFITS_UPDATED, {
        userId, 
        tier: tier.name, 
        holdings: tokenAmount,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to refresh user benefits');
      return false;
    }
  }
  
  /**
   * Check if holdings data is stale and should be refreshed
   * @param lastCheckedAt Timestamp of last check
   * @returns True if holdings are stale
   */
  private isHoldingsStale(lastCheckedAt: Date): boolean {
    // Consider holdings stale if older than 24 hours
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return Date.now() - new Date(lastCheckedAt).getTime() > staleThreshold;
  }
  
  /**
   * Get user benefits
   * @param userId User ID
   * @returns User token benefits
   */
  async getUserBenefits(userId: string): Promise<UserTokenBenefits | null> {
    try {
      // Check if we need to refresh benefits
      await this.maybeRefreshBenefits(userId);
      
      // Get user data with benefits
      const { data, error } = await this.db
        .from('users')
        .select('tokenBenefits')
        .eq('id', userId)
        .single();
      
      if (error) {
        this.logger.error({ error, userId }, 'Failed to get user benefits');
        return null;
      }
      
      return data.tokenBenefits as UserTokenBenefits || null;
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to get user benefits');
      return null;
    }
  }
  
  /**
   * Refresh benefits if necessary
   * @param userId User ID
   */
  private async maybeRefreshBenefits(userId: string): Promise<void> {
    try {
      // Get user data with benefits
      const { data, error } = await this.db
        .from('users')
        .select('tokenBenefits')
        .eq('id', userId)
        .single();
      
      if (error) return;
      
      // If no benefits or benefits are stale, refresh
      if (!data.tokenBenefits || this.isBenefitsStale(data.tokenBenefits.updatedAt)) {
        await this.refreshUserBenefits(userId);
      }
    } catch (error) {
      // Log but don't throw - this is a background operation
      this.logger.error({ error, userId }, 'Failed to check benefit freshness');
    }
  }
  
  /**
   * Check if benefits are stale
   * @param updatedAt Last update timestamp
   * @returns True if benefits are stale
   */
  private isBenefitsStale(updatedAt: string | Date): boolean {
    if (!updatedAt) return true;
    
    // Consider benefits stale if older than 12 hours
    const staleThreshold = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    return Date.now() - new Date(updatedAt).getTime() > staleThreshold;
  }
}
