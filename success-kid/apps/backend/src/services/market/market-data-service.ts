/**
 * Market Data Service
 * 
 * Service for fetching, processing, and caching market data from external APIs
 * with multi-provider support and failover mechanisms.
 */

import axios from 'axios';
import { logger } from '../../lib/logger';
import { env } from '../../config/environment';
import { redisClient } from '../../lib/redis-client';
import { eventEmitter } from '../../lib/event-emitter';

// Market data types
export interface MarketData {
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  volume7d: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  trades24h: number;
  allTimeHigh: {
    price: number;
    date: string;
  };
  timestamp: Date;
}

export interface MarketDataProvider {
  id: string;
  name: string;
  url: string;
  priority: number;
  apiKey?: string;
}

export interface MilestoneDefinition {
  id: string;
  value: number;
  label: string;
  description: string;
}

export interface MilestoneStatus {
  id: string;
  value: number;
  label: string;
  description: string;
  achievedAt: Date | null;
}

export interface MilestoneData {
  milestones: MilestoneStatus[];
  currentMarketCap: number;
  nextMilestone: {
    id: string;
    value: number;
    label: string;
    progress: number;
  } | null;
}

export class MarketDataService {
  private providers: MarketDataProvider[];
  private lastFailure: Map<string, number> = new Map();
  private failureCounters: Map<string, number> = new Map();
  private readonly failoverThreshold = 3;
  private readonly failureWindow = 60000; // 1 minute
  
  // Define market cap milestones
  private readonly milestones: MilestoneDefinition[] = [
    { id: 'first', value: 100000, label: '$100K', description: 'First milestone' },
    { id: 'initial', value: 500000, label: '$500K', description: 'Initial growth target' },
    { id: 'community', value: 1000000, label: '$1M', description: 'Community establishment' },
    { id: 'expansion', value: 5000000, label: '$5M', description: 'Expansion milestone' },
    { id: 'medium', value: 10000000, label: '$10M', description: 'Medium-term goal' },
    { id: 'ambitious', value: 50000000, label: '$50M', description: 'Ambitious target' },
    { id: 'long-term', value: 100000000, label: '$100M', description: 'Long-term vision' }
  ];
  
  constructor() {
    // Initialize providers from environment configuration
    this.initializeProviders();
    
    // Start periodic market data updates
    this.startPeriodicUpdates();
    
    logger.info('Market data service initialized');
  }
  
  /**
   * Initialize market data providers from configuration
   */
  private initializeProviders(): void {
    // Parse provider configuration
    try {
      const providerConfig = JSON.parse(env.MARKET_DATA_PROVIDERS || '[]');
      this.providers = providerConfig;
      
      // Sort providers by priority
      this.providers.sort((a, b) => a.priority - b.priority);
      
      logger.info(`Initialized ${this.providers.length} market data providers`);
    } catch (error) {
      logger.error('Failed to parse market data provider configuration', { error });
      this.providers = [];
    }
    
    // Fallback to defaults if no providers configured
    if (this.providers.length === 0) {
      this.providers = [
        {
          id: 'dexscreener',
          name: 'DexScreener',
          url: 'https://api.dexscreener.com/latest/dex/tokens',
          priority: 1
        },
        {
          id: 'birdeye',
          name: 'Birdeye',
          url: 'https://public-api.birdeye.so/public/tokeninfo',
          priority: 2
        }
      ];
      
      logger.info('Using default market data providers');
    }
  }
  
  /**
   * Start periodic market data updates
   */
  private startPeriodicUpdates(): void {
    // Update immediately on startup
    this.updateMarketData();
    
    // Schedule periodic updates
    const updateInterval = parseInt(env.MARKET_DATA_UPDATE_INTERVAL, 10) || 300000; // 5 minutes default
    
    setInterval(() => {
      this.updateMarketData();
    }, updateInterval);
    
    logger.info(`Scheduled market data updates every ${updateInterval / 1000} seconds`);
  }
  
  /**
   * Get latest market data from cache or update if needed
   */
  async getMarketData(): Promise<MarketData> {
    try {
      // Try to get data from cache
      const cachedData = await redisClient.get('market:data');
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // If not in cache, update and return
      return await this.updateMarketData();
    } catch (error) {
      logger.error('Failed to get market data', { error });
      throw error;
    }
  }
  
  /**
   * Get milestone data with current status
   */
  async getMilestoneData(): Promise<MilestoneData> {
    try {
      // Try to get data from cache
      const cachedData = await redisClient.get('market:milestones');
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // If not in cache, update milestone data
      return await this.updateMilestoneData();
    } catch (error) {
      logger.error('Failed to get milestone data', { error });
      throw error;
    }
  }
  
  /**
   * Update market data from providers
   */
  private async updateMarketData(): Promise<MarketData> {
    let marketData: MarketData | null = null;
    let providerUsed: string | null = null;
    
    // Try each provider in priority order
    for (const provider of this.providers) {
      // Skip providers that have failed recently
      if (this.shouldSkipProvider(provider.id)) {
        continue;
      }
      
      try {
        // Fetch data from provider
        marketData = await this.fetchFromProvider(provider);
        
        // If successful, reset failure counter
        this.failureCounters.set(provider.id, 0);
        
        // Remember which provider was used
        providerUsed = provider.id;
        
        // Exit the loop since we have data
        break;
      } catch (error) {
        logger.error(`Failed to fetch market data from ${provider.name}`, { error });
        
        // Increment failure counter
        const currentCount = this.failureCounters.get(provider.id) || 0;
        this.failureCounters.set(provider.id, currentCount + 1);
        this.lastFailure.set(provider.id, Date.now());
      }
    }
    
    // If no data was fetched, throw error
    if (!marketData) {
      throw new Error('Failed to fetch market data from any provider');
    }
    
    // Cache the result for quick access
    await redisClient.set('market:data', JSON.stringify(marketData), 'EX', 300); // 5 minutes
    
    logger.info(`Updated market data from ${providerUsed}`);
    
    // Update milestone data based on market cap
    await this.updateMilestoneData(marketData.marketCap);
    
    return marketData;
  }
  
  /**
   * Determine if a provider should be skipped due to recent failures
   */
  private shouldSkipProvider(providerId: string): boolean {
    const failureCount = this.failureCounters.get(providerId) || 0;
    const lastFailureTime = this.lastFailure.get(providerId) || 0;
    
    // Skip if failure threshold reached and within failure window
    if (failureCount >= this.failoverThreshold) {
      const now = Date.now();
      const elapsed = now - lastFailureTime;
      
      // If within failure window, skip this provider
      if (elapsed < this.failureWindow) {
        return true;
      }
      
      // Reset failure counter if failure window has passed
      this.failureCounters.set(providerId, 0);
    }
    
    return false;
  }
  
  /**
   * Fetch market data from a specific provider
   */
  private async fetchFromProvider(provider: MarketDataProvider): Promise<MarketData> {
    const tokenAddress = env.TOKEN_ADDRESS;
    
    try {
      let response;
      
      switch (provider.id) {
        case 'dexscreener':
          response = await this.fetchFromDexScreener(provider, tokenAddress);
          break;
        case 'birdeye':
          response = await this.fetchFromBirdeye(provider, tokenAddress);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider.id}`);
      }
      
      // Return normalized market data
      return response;
    } catch (error) {
      logger.error(`Error fetching from ${provider.name}`, { error });
      throw error;
    }
  }
  
  /**
   * Fetch from DexScreener API
   */
  private async fetchFromDexScreener(
    provider: MarketDataProvider,
    tokenAddress: string
  ): Promise<MarketData> {
    const url = `${provider.url}/${tokenAddress}`;
    
    const response = await axios.get(url, {
      timeout: 5000 // 5 second timeout
    });
    
    // Parse response data
    const data = response.data;
    
    if (!data.pairs || data.pairs.length === 0) {
      throw new Error('No pairs found for token');
    }
    
    // Use the most liquid pair
    const pair = data.pairs[0];
    
    // Calculate all-time high (simplified)
    const athPrice = pair.priceUsd;
    const athDate = new Date().toISOString();
    
    return {
      price: parseFloat(pair.priceUsd),
      priceChangePercent24h: parseFloat(pair.priceChange.h24),
      volume24h: parseFloat(pair.volume.h24),
      volume7d: parseFloat(pair.volume.h24) * 7, // Estimate weekly volume
      marketCap: parseFloat(pair.fdv), // Fully diluted valuation as market cap
      liquidity: parseFloat(pair.liquidity.usd),
      holders: 0, // Not available from DexScreener
      trades24h: 0, // Not available from DexScreener
      allTimeHigh: {
        price: parseFloat(athPrice),
        date: athDate
      },
      timestamp: new Date()
    };
  }
  
  /**
   * Fetch from Birdeye API
   */
  private async fetchFromBirdeye(
    provider: MarketDataProvider,
    tokenAddress: string
  ): Promise<MarketData> {
    const url = `${provider.url}?address=${tokenAddress}`;
    
    const headers = provider.apiKey 
      ? { 'x-api-key': provider.apiKey }
      : {};
    
    const response = await axios.get(url, {
      headers,
      timeout: 5000 // 5 second timeout
    });
    
    // Parse response data
    const data = response.data.data;
    
    if (!data) {
      throw new Error('No data returned from Birdeye');
    }
    
    // Calculate all-time high (simplified)
    const athPrice = data.price;
    const athDate = new Date().toISOString();
    
    return {
      price: parseFloat(data.price),
      priceChangePercent24h: parseFloat(data.priceChange24h || 0),
      volume24h: parseFloat(data.volume24h || 0),
      volume7d: parseFloat(data.volume7d || 0),
      marketCap: parseFloat(data.marketCap || 0),
      liquidity: parseFloat(data.liquidity || 0),
      holders: parseInt(data.holderCount || 0, 10),
      trades24h: parseInt(data.txns24h || 0, 10),
      allTimeHigh: {
        price: parseFloat(data.ath || athPrice),
        date: data.athDate || athDate
      },
      timestamp: new Date()
    };
  }
  
  /**
   * Update milestone data based on current market cap
   */
  private async updateMilestoneData(currentMarketCap?: number): Promise<MilestoneData> {
    try {
      // If market cap not provided, get latest market data
      let marketCap = currentMarketCap;
      if (!marketCap) {
        const marketData = await this.getMarketData();
        marketCap = marketData.marketCap;
      }
      
      // Get milestone status from database
      const milestoneStatuses = await this.getMilestoneStatusesFromDb();
      
      // Update milestone statuses based on current market cap
      let nextMilestone: MilestoneDefinition | null = null;
      let milestoneAchieved = false;
      
      const updatedStatuses = this.milestones.map(milestone => {
        const existingStatus = milestoneStatuses.find(s => s.id === milestone.id);
        const wasAchieved = existingStatus?.achievedAt !== null;
        const isAchievedNow = marketCap >= milestone.value;
        
        // Check if a milestone was just achieved
        if (!wasAchieved && isAchievedNow) {
          milestoneAchieved = true;
        }
        
        // Find the next milestone to achieve
        if (!isAchievedNow && (!nextMilestone || milestone.value < nextMilestone.value)) {
          nextMilestone = milestone;
        }
        
        return {
          id: milestone.id,
          value: milestone.value,
          label: milestone.label,
          description: milestone.description,
          achievedAt: isAchievedNow 
            ? existingStatus?.achievedAt || new Date() 
            : null
        };
      });
      
      // Update statuses in database
      await this.updateMilestoneStatusesInDb(updatedStatuses);
      
      // Calculate progress to next milestone
      let nextMilestoneData = null;
      if (nextMilestone) {
        const progress = Math.min(100, Math.round((marketCap / nextMilestone.value) * 100));
        
        nextMilestoneData = {
          id: nextMilestone.id,
          value: nextMilestone.value,
          label: nextMilestone.label,
          progress
        };
      }
      
      // Prepare response data
      const milestoneData: MilestoneData = {
        milestones: updatedStatuses,
        currentMarketCap: marketCap,
        nextMilestone: nextMilestoneData
      };
      
      // Cache result
      await redisClient.set('market:milestones', JSON.stringify(milestoneData), 'EX', 600); // 10 minutes
      
      // Emit event if milestone was just achieved
      if (milestoneAchieved) {
        eventEmitter.emit('milestone:achieved', {
          marketCap,
          milestone: updatedStatuses.find(s => s.achievedAt && 
            s.achievedAt.getTime() > Date.now() - 60000) // Milestone achieved in last minute
        });
      }
      
      return milestoneData;
    } catch (error) {
      logger.error('Failed to update milestone data', { error });
      throw error;
    }
  }
  
  /**
   * Get milestone statuses from database
   * This is a placeholder - in a real implementation, would query from database
   */
  private async getMilestoneStatusesFromDb(): Promise<MilestoneStatus[]> {
    try {
      // Try to get from cache first
      const cached = await redisClient.get('market:milestone_statuses');
      if (cached) {
        return JSON.parse(cached);
      }
      
      // In a real implementation, would query from database
      // For now, return empty array to indicate no milestones achieved yet
      return [];
    } catch (error) {
      logger.error('Error getting milestone statuses from database', { error });
      return [];
    }
  }
  
  /**
   * Update milestone statuses in database
   * This is a placeholder - in a real implementation, would update in database
   */
  private async updateMilestoneStatusesInDb(statuses: MilestoneStatus[]): Promise<void> {
    try {
      // In a real implementation, would update database
      // For now, just update cache
      await redisClient.set('market:milestone_statuses', JSON.stringify(statuses));
    } catch (error) {
      logger.error('Error updating milestone statuses in database', { error });
    }
  }
}
