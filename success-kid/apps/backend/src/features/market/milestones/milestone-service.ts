/**
 * Milestone service for tracking market milestones
 */
import { Milestone, MilestoneProgress } from '../types';
import { IMarketCapService } from '../marketcap/marketcap-service';
import { ICacheService } from '../caching/cache-service';
import { logger } from '../../../lib/logger';
import { eventBus, EventType } from '../../../lib/event-bus';
import BigNumber from 'bignumber.js';

/**
 * Milestone service interface
 */
export interface IMilestoneService {
  getMilestones(): Promise<Milestone[]>;
  getCurrentMilestone(type: string): Promise<Milestone>;
  checkMilestones(): Promise<Milestone[]>;
  getMilestoneProgress(milestoneId: string): Promise<MilestoneProgress>;
  triggerCelebration(milestone: Milestone): Promise<void>;
}

/**
 * Milestone service implementation
 */
export class MilestoneService implements IMilestoneService {
  // Predefined milestones based on market cap
  private marketCapMilestones: Milestone[] = [
    {
      id: 'marketcap-100k',
      name: 'First Milestone',
      description: 'Achieving $100,000 market cap',
      targetValue: '100000',
      type: 'marketCap',
      achieved: false,
      nextMilestoneId: 'marketcap-500k'
    },
    {
      id: 'marketcap-500k',
      name: 'Growing Community',
      description: 'Reaching $500,000 market cap',
      targetValue: '500000',
      type: 'marketCap',
      achieved: false,
      previousMilestoneId: 'marketcap-100k',
      nextMilestoneId: 'marketcap-1m'
    },
    {
      id: 'marketcap-1m',
      name: 'Community Establishment',
      description: 'Crossing the $1 million market cap threshold',
      targetValue: '1000000',
      type: 'marketCap',
      achieved: false,
      previousMilestoneId: 'marketcap-500k',
      nextMilestoneId: 'marketcap-5m'
    },
    {
      id: 'marketcap-5m',
      name: 'Expansion Milestone',
      description: 'Reaching $5 million market cap',
      targetValue: '5000000',
      type: 'marketCap',
      achieved: false,
      previousMilestoneId: 'marketcap-1m',
      nextMilestoneId: 'marketcap-10m'
    },
    {
      id: 'marketcap-10m',
      name: 'Medium-term Goal',
      description: 'Crossing the $10 million market cap threshold',
      targetValue: '10000000',
      type: 'marketCap',
      achieved: false,
      previousMilestoneId: 'marketcap-5m',
      nextMilestoneId: 'marketcap-50m'
    },
    {
      id: 'marketcap-50m',
      name: 'Ambitious Target',
      description: 'Reaching $50 million market cap',
      targetValue: '50000000',
      type: 'marketCap',
      achieved: false,
      previousMilestoneId: 'marketcap-10m',
      nextMilestoneId: 'marketcap-100m'
    },
    {
      id: 'marketcap-100m',
      name: 'Long-term Vision',
      description: 'Crossing the $100 million market cap threshold',
      targetValue: '100000000',
      type: 'marketCap',
      achieved: false,
      previousMilestoneId: 'marketcap-50m'
    }
  ];
  
  /**
   * Create a new milestone service
   * @param marketCapService Market cap service
   * @param cacheService Cache service
   */
  constructor(
    private marketCapService: IMarketCapService,
    private cacheService: ICacheService
  ) {
    // Load milestone state from cache on startup
    this.loadMilestoneState();
    
    // Set up scheduled milestone checks
    this.setupMilestoneChecks();
  }
  
  /**
   * Get all milestones
   * @returns List of all milestones
   */
  async getMilestones(): Promise<Milestone[]> {
    return [...this.marketCapMilestones];
  }
  
  /**
   * Get current milestone for the specified type
   * @param type Milestone type
   * @returns Current milestone
   */
  async getCurrentMilestone(type: string): Promise<Milestone> {
    // Validate milestone type
    if (type !== 'marketCap' && type !== 'price' && type !== 'holders') {
      throw new Error(`Invalid milestone type: ${type}`);
    }
    
    // Get milestones of the specified type
    const milestones = this.marketCapMilestones.filter(m => m.type === type);
    
    // Get current market cap
    const marketCap = await this.marketCapService.getMarketCap('SKC');
    const marketCapValue = new BigNumber(marketCap.marketCap);
    
    // Find the next unachieved milestone
    for (const milestone of milestones) {
      const targetValue = new BigNumber(milestone.targetValue);
      
      if (!milestone.achieved && marketCapValue.isLessThan(targetValue)) {
        return milestone;
      }
    }
    
    // If all milestones are achieved, return the last one
    return milestones[milestones.length - 1];
  }
  
  /**
   * Check all milestones and update status
   * @returns List of newly achieved milestones
   */
  async checkMilestones(): Promise<Milestone[]> {
    // Get all pending milestones
    const pendingMilestones = this.marketCapMilestones.filter(m => !m.achieved);
    
    // Get current market data
    const marketCap = await this.marketCapService.getMarketCap('SKC');
    const marketCapValue = new BigNumber(marketCap.marketCap);
    
    // Check each milestone
    const achievedMilestones: Milestone[] = [];
    
    for (const milestone of pendingMilestones) {
      let isAchieved = false;
      
      // Check based on type
      if (milestone.type === 'marketCap') {
        isAchieved = marketCapValue.isGreaterThanOrEqualTo(milestone.targetValue);
      } else if (milestone.type === 'price') {
        isAchieved = marketCap.price >= parseFloat(milestone.targetValue);
      }
      
      // If achieved, update and notify
      if (isAchieved) {
        // Mark as achieved
        milestone.achieved = true;
        milestone.achievedAt = new Date();
        
        // Save milestone state
        await this.saveMilestoneState();
        
        // Trigger celebration
        await this.triggerCelebration(milestone);
        
        achievedMilestones.push(milestone);
        
        logger.info(`Milestone achieved: ${milestone.name}`, {
          id: milestone.id,
          targetValue: milestone.targetValue,
          currentValue: marketCap.marketCap
        });
      }
    }
    
    return achievedMilestones;
  }
  
  /**
   * Get progress for a specific milestone
   * @param milestoneId Milestone ID
   * @returns Milestone progress
   */
  async getMilestoneProgress(milestoneId: string): Promise<MilestoneProgress> {
    // Find milestone
    const milestone = this.marketCapMilestones.find(m => m.id === milestoneId);
    if (!milestone) {
      throw new Error(`Milestone not found: ${milestoneId}`);
    }
    
    // Get current market cap
    const marketCap = await this.marketCapService.getMarketCap('SKC');
    const marketCapValue = new BigNumber(marketCap.marketCap);
    const targetValue = new BigNumber(milestone.targetValue);
    
    // Calculate progress percentage
    let percentComplete = 0;
    
    if (milestone.achieved) {
      percentComplete = 100;
    } else {
      // Find previous milestone to calculate progress from
      let baseValue = new BigNumber(0);
      
      if (milestone.previousMilestoneId) {
        const prevMilestone = this.marketCapMilestones.find(
          m => m.id === milestone.previousMilestoneId
        );
        
        if (prevMilestone) {
          baseValue = new BigNumber(prevMilestone.targetValue);
        }
      }
      
      // Calculate progress as percentage of the way from previous milestone to current target
      if (marketCapValue.isLessThan(targetValue)) {
        const range = targetValue.minus(baseValue);
        const progress = marketCapValue.minus(baseValue);
        
        if (range.isGreaterThan(0)) {
          percentComplete = Math.min(100, Math.max(0, 
            progress.dividedBy(range).multipliedBy(100).toNumber()
          ));
        }
      } else {
        percentComplete = 100;
      }
    }
    
    // Calculate remaining amount
    const remaining = targetValue.minus(marketCapValue).isLessThan(0) 
      ? '0' 
      : targetValue.minus(marketCapValue).toString();
    
    return {
      milestone,
      currentValue: marketCap.marketCap,
      percentComplete,
      remaining
    };
  }
  
  /**
   * Trigger celebration for a milestone
   * @param milestone Milestone that was achieved
   */
  async triggerCelebration(milestone: Milestone): Promise<void> {
    try {
      // Emit milestone reached event
      await eventBus.publish(EventType.MILESTONE_REACHED, {
        milestone: milestone.name,
        id: milestone.id,
        description: milestone.description,
        targetValue: milestone.targetValue,
        achievedAt: milestone.achievedAt || new Date(),
        type: milestone.type
      });
      
      logger.info(`Celebration triggered for milestone: ${milestone.name}`);
    } catch (error) {
      logger.error('Failed to trigger milestone celebration', { 
        milestone: milestone.id, 
        error: error.message 
      });
    }
  }
  
  /**
   * Load milestone state from cache
   */
  private async loadMilestoneState(): Promise<void> {
    try {
      // Get milestone state from cache
      const cachedState = await this.cacheService.get<Record<string, any>>('milestones:state');
      
      if (cachedState) {
        // Update milestone states
        for (const milestone of this.marketCapMilestones) {
          const cachedMilestone = cachedState[milestone.id];
          
          if (cachedMilestone) {
            milestone.achieved = cachedMilestone.achieved;
            milestone.achievedAt = cachedMilestone.achievedAt 
              ? new Date(cachedMilestone.achievedAt) 
              : undefined;
          }
        }
        
        logger.info('Loaded milestone state from cache');
      }
    } catch (error) {
      logger.error('Failed to load milestone state', { error: error.message });
    }
  }
  
  /**
   * Save milestone state to cache
   */
  private async saveMilestoneState(): Promise<void> {
    try {
      // Convert milestones to serializable format
      const state: Record<string, any> = {};
      
      for (const milestone of this.marketCapMilestones) {
        state[milestone.id] = {
          achieved: milestone.achieved,
          achievedAt: milestone.achievedAt?.toISOString()
        };
      }
      
      // Save to cache
      await this.cacheService.set('milestones:state', state, {
        ttl: 86400 * 30, // Cache for 30 days
        staleWhileRevalidate: false
      });
    } catch (error) {
      logger.error('Failed to save milestone state', { error: error.message });
    }
  }
  
  /**
   * Set up scheduled milestone checks
   */
  private setupMilestoneChecks(): void {
    // Check milestones every 5 minutes
    setInterval(async () => {
      try {
        await this.checkMilestones();
      } catch (error) {
        logger.error('Scheduled milestone check failed', { error: error.message });
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}
