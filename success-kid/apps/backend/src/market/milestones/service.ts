/**
 * Milestone Service
 * 
 * Service for tracking market cap milestones and triggering celebrations.
 */
import { logger } from '../../lib/logger';
import { marketDataCache } from '../common/cache-service';
import { marketCapService } from '../marketcap/service';
import { priceService } from '../price/service';
import { EventEmitter } from 'events';
import { Milestone, MilestoneType, MilestoneProgress, MilestoneCelebration, MilestoneEntity } from '../../models/entities/market/milestone.model';
import { MarketCapData } from '../../models/entities/market/marketcap.model';
import BigNumber from 'bignumber.js';

/**
 * Service for tracking market cap milestones
 */
export class MilestoneService {
  // Milestone celebration event emitter
  private readonly eventEmitter = new EventEmitter();
  
  // Cache TTLs for different data types (in seconds)
  private readonly MILESTONE_CACHE_TTL = 3600; // 1 hour for milestone data
  private readonly PROGRESS_CACHE_TTL = 300; // 5 minutes for progress data
  
  // Check interval (in milliseconds)
  private readonly MILESTONE_CHECK_INTERVAL = 60000; // 1 minute
  
  // Active check intervals
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  // Confirmed milestone achievements (to prevent duplicate celebrations)
  private confirmedAchievements: Set<string> = new Set();
  
  // Milestone definitions for SKC token
  private readonly SKC_MILESTONES: Milestone[] = [
    {
      id: "milestone_100k",
      name: "Launch Success",
      description: "Reaching $100,000 market cap",
      targetValue: "100000",
      type: MilestoneType.MARKET_CAP,
      achieved: false,
      nextMilestoneId: "milestone_500k",
      icon: "milestone_launch"
    },
    {
      id: "milestone_500k",
      name: "Initial Growth",
      description: "Reaching $500,000 market cap",
      targetValue: "500000",
      type: MilestoneType.MARKET_CAP,
      achieved: false,
      nextMilestoneId: "milestone_1m",
      previousMilestoneId: "milestone_100k",
      icon: "milestone_growth"
    },
    {
      id: "milestone_1m",
      name: "Community Establishment",
      description: "Reaching $1,000,000 market cap",
      targetValue: "1000000",
      type: MilestoneType.MARKET_CAP,
      achieved: false,
      nextMilestoneId: "milestone_5m",
      previousMilestoneId: "milestone_500k",
      icon: "milestone_community"
    },
    {
      id: "milestone_5m",
      name: "Expansion Milestone",
      description: "Reaching $5,000,000 market cap",
      targetValue: "5000000",
      type: MilestoneType.MARKET_CAP,
      achieved: false,
      nextMilestoneId: "milestone_10m",
      previousMilestoneId: "milestone_1m",
      icon: "milestone_expansion"
    },
    {
      id: "milestone_10m",
      name: "Medium-term Goal",
      description: "Reaching $10,000,000 market cap",
      targetValue: "10000000",
      type: MilestoneType.MARKET_CAP,
      achieved: false,
      nextMilestoneId: "milestone_50m",
      previousMilestoneId: "milestone_5m",
      icon: "milestone_medium"
    },
    {
      id: "milestone_50m",
      name: "Ambitious Target",
      description: "Reaching $50,000,000 market cap",
      targetValue: "50000000",
      type: MilestoneType.MARKET_CAP,
      achieved: false,
      nextMilestoneId: "milestone_100m",
      previousMilestoneId: "milestone_10m",
      icon: "milestone_ambitious"
    },
    {
      id: "milestone_100m",
      name: "Long-term Vision",
      description: "Reaching $100,000,000 market cap",
      targetValue: "100000000",
      type: MilestoneType.MARKET_CAP,
      achieved: false,
      previousMilestoneId: "milestone_50m",
      icon: "milestone_vision"
    }
  ];
  
  // Milestone definitions by token
  private readonly milestones: Record<string, Milestone[]> = {
    'SKC': this.SKC_MILESTONES
  };
  
  /**
   * Create a new milestone service
   */
  constructor() {
    // Set max listeners to prevent memory leak warnings
    this.eventEmitter.setMaxListeners(100);
  }
  
  /**
   * Get all milestones for a token
   * 
   * @param symbol Token symbol
   * @returns Array of milestones
   */
  async getMilestones(symbol = 'SKC'): Promise<Milestone[]> {
    const cacheKey = `milestones:${symbol}`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // In a real implementation, this would query a database
          // For now, return the hardcoded milestones with updated achievement status
          const milestones = this.milestones[symbol] || [];
          
          // Update achievement status
          await this.updateMilestoneAchievements(symbol, milestones);
          
          return milestones;
        },
        { ttl: this.MILESTONE_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error getting milestones', { symbol, error });
      return this.milestones[symbol] || [];
    }
  }
  
  /**
   * Get milestone by ID
   * 
   * @param id Milestone ID
   * @param symbol Token symbol
   * @returns Milestone or null if not found
   */
  async getMilestone(id: string, symbol = 'SKC'): Promise<Milestone | null> {
    try {
      const milestones = await this.getMilestones(symbol);
      return milestones.find(m => m.id === id) || null;
    } catch (error) {
      logger.error('Error getting milestone', { id, symbol, error });
      return null;
    }
  }
  
  /**
   * Get current milestone for a token
   * 
   * @param symbol Token symbol
   * @param type Milestone type
   * @returns Current milestone
   */
  async getCurrentMilestone(
    symbol = 'SKC',
    type = MilestoneType.MARKET_CAP
  ): Promise<Milestone | null> {
    try {
      const milestones = await this.getMilestones(symbol);
      
      // Filter by type
      const typeMilestones = milestones.filter(m => m.type === type);
      
      if (typeMilestones.length === 0) {
        return null;
      }
      
      // Find the first unachieved milestone
      const nextMilestone = typeMilestones.find(m => !m.achieved);
      
      if (nextMilestone) {
        return nextMilestone;
      }
      
      // If all achieved, return the last one
      return typeMilestones[typeMilestones.length - 1];
    } catch (error) {
      logger.error('Error getting current milestone', { symbol, type, error });
      return null;
    }
  }
  
  /**
   * Update milestone achievements
   * 
   * @param symbol Token symbol
   * @param milestones Milestones to update
   */
  private async updateMilestoneAchievements(
    symbol: string,
    milestones: Milestone[]
  ): Promise<void> {
    try {
      // Get current market data
      const marketCapData = await marketCapService.getMarketCap(symbol);
      const priceData = await priceService.getCurrentPrice(symbol);
      
      // Update each milestone
      for (const milestone of milestones) {
        let currentValue: string;
        let targetValue: string;
        
        // Get current value based on milestone type
        switch (milestone.type) {
          case MilestoneType.MARKET_CAP:
            currentValue = marketCapData.marketCap;
            targetValue = milestone.targetValue;
            break;
          case MilestoneType.PRICE:
            currentValue = priceData.priceUsd.toString();
            targetValue = milestone.targetValue;
            break;
          case MilestoneType.HOLDERS:
            // Placeholder for holder count
            currentValue = '0';
            targetValue = milestone.targetValue;
            break;
          default:
            continue;
        }
        
        // Check if milestone is achieved
        const isAchieved = new BigNumber(currentValue)
          .isGreaterThanOrEqualTo(targetValue);
        
        // Update milestone achieved status
        milestone.achieved = isAchieved;
        
        // Set achieved date if newly achieved
        if (isAchieved && !milestone.achievedAt) {
          milestone.achievedAt = new Date();
          
          // Store achievement in database in a real implementation
          logger.info(`Milestone ${milestone.id} achieved`, { 
            symbol, 
            type: milestone.type 
          });
        }
      }
    } catch (error) {
      logger.error('Error updating milestone achievements', { symbol, error });
    }
  }
  
  /**
   * Get milestone progress
   * 
   * @param milestoneId Milestone ID
   * @param symbol Token symbol
   * @returns Milestone progress
   */
  async getMilestoneProgress(
    milestoneId: string,
    symbol = 'SKC'
  ): Promise<MilestoneProgress | null> {
    const cacheKey = `milestone:${symbol}:${milestoneId}:progress`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // Get milestone
          const milestone = await this.getMilestone(milestoneId, symbol);
          
          if (!milestone) {
            return null;
          }
          
          // Get current value based on milestone type
          let currentValue: string;
          
          switch (milestone.type) {
            case MilestoneType.MARKET_CAP:
              const marketCapData = await marketCapService.getMarketCap(symbol);
              currentValue = marketCapData.marketCap;
              break;
            case MilestoneType.PRICE:
              const priceData = await priceService.getCurrentPrice(symbol);
              currentValue = priceData.priceUsd.toString();
              break;
            case MilestoneType.HOLDERS:
              // Placeholder for holder count
              currentValue = '0';
              break;
            default:
              return null;
          }
          
          // Calculate progress
          const current = new BigNumber(currentValue);
          const target = new BigNumber(milestone.targetValue);
          
          let percentComplete = 0;
          let valueRemaining = '0';
          
          if (target.isGreaterThan(0)) {
            percentComplete = Math.min(
              100,
              current.dividedBy(target).multipliedBy(100).toNumber()
            );
            
            valueRemaining = target.minus(current).toString();
            if (new BigNumber(valueRemaining).isLessThan(0)) {
              valueRemaining = '0';
            }
          }
          
          return {
            milestone,
            currentValue,
            percentComplete,
            valueRemaining
          };
        },
        { ttl: this.PROGRESS_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error getting milestone progress', { 
        milestoneId, 
        symbol, 
        error 
      });
      return null;
    }
  }
  
  /**
   * Check milestones for a token
   * 
   * @param symbol Token symbol
   * @returns Array of newly achieved milestones
   */
  async checkMilestones(symbol = 'SKC'): Promise<Milestone[]> {
    try {
      // Get all milestones
      const milestones = await this.getMilestones(symbol);
      
      // Get current market data
      const marketCapData = await marketCapService.getMarketCap(symbol);
      const priceData = await priceService.getCurrentPrice(symbol);
      
      // Find unconfirmed achieved milestones
      const newlyAchieved: Milestone[] = [];
      
      for (const milestone of milestones) {
        // Skip already confirmed achievements
        if (this.confirmedAchievements.has(milestone.id)) {
          continue;
        }
        
        let isAchieved = false;
        
        // Check if milestone is achieved based on type
        switch (milestone.type) {
          case MilestoneType.MARKET_CAP:
            isAchieved = new BigNumber(marketCapData.marketCap)
              .isGreaterThanOrEqualTo(milestone.targetValue);
            break;
          case MilestoneType.PRICE:
            isAchieved = new BigNumber(priceData.priceUsd.toString())
              .isGreaterThanOrEqualTo(milestone.targetValue);
            break;
          case MilestoneType.HOLDERS:
            // Placeholder for holder count check
            isAchieved = false;
            break;
        }
        
        if (isAchieved) {
          // Add to newly achieved list
          newlyAchieved.push(milestone);
          
          // Update milestone achieved status
          milestone.achieved = true;
          milestone.achievedAt = new Date();
          
          // Add to confirmed achievements
          this.confirmedAchievements.add(milestone.id);
          
          // Trigger celebration
          await this.triggerCelebration(milestone, symbol);
        }
      }
      
      return newlyAchieved;
    } catch (error) {
      logger.error('Error checking milestones', { symbol, error });
      return [];
    }
  }
  
  /**
   * Trigger milestone celebration
   * 
   * @param milestone Achieved milestone
   * @param symbol Token symbol
   */
  async triggerCelebration(milestone: Milestone, symbol = 'SKC'): Promise<void> {
    try {
      logger.info('Milestone celebration triggered', { 
        milestone: milestone.id, 
        name: milestone.name,
        symbol
      });
      
      // Get next milestone if available
      let nextMilestone: Milestone | undefined;
      
      if (milestone.nextMilestoneId) {
        nextMilestone = await this.getMilestone(milestone.nextMilestoneId, symbol);
      }
      
      // Create celebration data
      const celebration: MilestoneCelebration = {
        milestone,
        achievedAt: milestone.achievedAt || new Date(),
        previousValue: '0', // Placeholder
        nextMilestone,
        contributors: 0, // Placeholder
      };
      
      // Emit celebration event
      this.eventEmitter.emit('milestoneCelebration', celebration);
      
      // In a real implementation, you would:
      // 1. Record achievement in database
      // 2. Send notifications to users
      // 3. Update platform-wide celebration state
    } catch (error) {
      logger.error('Error triggering milestone celebration', { 
        milestone: milestone.id,
        symbol,
        error
      });
    }
  }
  
  /**
   * Start automatic milestone checking
   * 
   * @param symbol Token symbol
   */
  startMilestoneChecking(symbol = 'SKC'): void {
    // Check if already checking
    if (this.checkIntervals.has(symbol)) {
      return;
    }
    
    logger.info(`Starting milestone checking for ${symbol}`);
    
    // Initial check
    this.checkMilestones(symbol).catch(error => {
      logger.error('Error in initial milestone check', { symbol, error });
    });
    
    // Create check interval
    const interval = setInterval(async () => {
      try {
        await this.checkMilestones(symbol);
      } catch (error) {
        logger.error('Error in milestone check interval', { symbol, error });
      }
    }, this.MILESTONE_CHECK_INTERVAL);
    
    // Store interval for cleanup
    this.checkIntervals.set(symbol, interval);
  }
  
  /**
   * Stop automatic milestone checking
   * 
   * @param symbol Token symbol
   */
  stopMilestoneChecking(symbol = 'SKC'): void {
    const interval = this.checkIntervals.get(symbol);
    
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(symbol);
      logger.info(`Stopped milestone checking for ${symbol}`);
    }
  }
  
  /**
   * Subscribe to milestone celebrations
   * 
   * @param callback Callback function for celebrations
   * @returns Unsubscribe function
   */
  subscribeToCelebrations(
    callback: (celebration: MilestoneCelebration) => void
  ): () => void {
    this.eventEmitter.on('milestoneCelebration', callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off('milestoneCelebration', callback);
    };
  }
  
  /**
   * Reset milestone achievements (for testing)
   * 
   * @param symbol Token symbol
   */
  async resetMilestones(symbol = 'SKC'): Promise<void> {
    try {
      const milestones = this.milestones[symbol] || [];
      
      // Reset all milestones
      for (const milestone of milestones) {
        milestone.achieved = false;
        milestone.achievedAt = undefined;
      }
      
      // Clear confirmed achievements
      this.confirmedAchievements.clear();
      
      // Invalidate cache
      await marketDataCache.invalidate(`milestones:${symbol}`);
      
      logger.info(`Reset milestones for ${symbol}`);
    } catch (error) {
      logger.error('Error resetting milestones', { symbol, error });
    }
  }
}

// Export singleton instance
export const milestoneService = new MilestoneService();
