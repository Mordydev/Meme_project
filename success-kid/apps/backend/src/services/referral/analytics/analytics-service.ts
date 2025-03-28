/**
 * Referral Analytics Service
 * 
 * Service for analyzing and reporting on referral program performance
 */
import { 
  ReferralRepository,
  ReferralCodeRepository,
  ReferralCampaignRepository
} from '../../../repositories/referral';
import { logger } from '../../../lib/logger';

/**
 * Analytics period type
 */
export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

/**
 * Referral metrics
 */
export interface ReferralMetrics {
  period: AnalyticsPeriod;
  visits: number;
  totalReferrals: number;
  uniqueReferrers: number;
  conversionRate: number;
  totalRewards: number;
  rewardsPerReferral: number;
  tierMetrics: {
    tier: string;
    referrals: number;
    rewards: number;
    conversionRate: number;
  }[];
  sourceMetrics: {
    source: string;
    referrals: number;
    percentage: number;
  }[];
  topReferrers: {
    userId: string;
    referrals: number;
    rewards: number;
  }[];
}

/**
 * User referral performance
 */
export interface UserReferralPerformance {
  userId: string;
  period: AnalyticsPeriod;
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  totalRewards: number;
  averageRewardPerReferral: number;
  performance: {
    percentile: number;
    rank: number;
    totalUsers: number;
  };
  trending: {
    direction: 'up' | 'down' | 'stable';
    changePercentage: number;
  };
  sources: {
    source: string;
    referrals: number;
    percentage: number;
  }[];
}

/**
 * Conversion funnel stage
 */
export interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number;
  dropOff: number;
}

/**
 * Conversion funnel
 */
export interface ConversionFunnel {
  total: number;
  stages: FunnelStage[];
  overallConversion: number;
}

/**
 * Referral report
 */
export interface ReferralReport {
  startDate: Date;
  endDate: Date;
  summary: {
    totalReferrals: number;
    newReferrers: number;
    totalRewards: number;
    conversionRate: number;
  };
  dailyBreakdown: {
    date: string;
    referrals: number;
    rewards: number;
  }[];
  statusBreakdown: {
    status: string;
    count: number;
    percentage: number;
  }[];
  sourceBreakdown: {
    source: string;
    count: number;
    percentage: number;
  }[];
  campaignPerformance: {
    campaignId: string;
    name: string;
    referrals: number;
    rewards: number;
    conversionRate: number;
  }[];
}

/**
 * Referral trends
 */
export interface ReferralTrends {
  daily: {
    date: string;
    referrals: number;
    rewards: number;
  }[];
  weekly: {
    week: string;
    referrals: number;
    rewards: number;
  }[];
  monthly: {
    month: string;
    referrals: number;
    rewards: number;
  }[];
  yearlyGrowth: number;
  quarterlyGrowth: number;
  monthlyGrowth: number;
  weeklyGrowth: number;
}

/**
 * Service for referral analytics and reporting
 */
export class ReferralAnalyticsService {
  /**
   * Create a new ReferralAnalyticsService instance
   */
  constructor(
    private referralRepository: ReferralRepository,
    private referralCodeRepository: ReferralCodeRepository,
    private campaignRepository: ReferralCampaignRepository
  ) {}

  /**
   * Get referral metrics for the specified period
   * 
   * @param period Analysis period
   * @returns Referral metrics
   */
  async getReferralMetrics(period: AnalyticsPeriod = 'monthly'): Promise<ReferralMetrics> {
    try {
      // Calculate time boundaries
      const { startDate, endDate } = this.getDateRangeForPeriod(period);
      
      // Get all referrals in the period
      const referrals = await this.referralRepository.findByDateRange(
        startDate, 
        endDate,
        1000, // Limit
        0     // Offset
      );
      
      // Get visit data for the period (in a real implementation, this would
      // query tracking records)
      const visits = await this.getVisitsInPeriod(startDate, endDate);
      
      // Calculate key metrics
      const uniqueReferrers = new Set(referrals.map(r => r.referrer_id)).size;
      const totalReferrals = referrals.length;
      const conversionRate = visits > 0 ? (totalReferrals / visits) * 100 : 0;
      
      // Calculate reward distribution (in a real implementation, this would
      // query reward records)
      const rewards = await this.getRewardsInPeriod(startDate, endDate);
      
      // Calculate metrics by referrer tier
      const tierMetrics = await this.calculateTierMetrics(referrals, rewards);
      
      // Calculate source breakdown
      const sourceMetrics = this.calculateSourceBreakdown(referrals);
      
      // Get top referrers
      const topReferrers = await this.getTopReferrers(startDate, endDate, 10);
      
      return {
        period,
        visits,
        totalReferrals,
        uniqueReferrers,
        conversionRate,
        totalRewards: rewards.total,
        rewardsPerReferral: totalReferrals > 0 ? rewards.total / totalReferrals : 0,
        tierMetrics,
        sourceMetrics,
        topReferrers
      };
    } catch (error) {
      logger.error('Failed to get referral metrics', { period, error });
      throw error;
    }
  }

  /**
   * Get user referral performance metrics
   * 
   * @param userId User ID
   * @param period Analysis period
   * @returns User referral performance
   */
  async getUserReferralPerformance(
    userId: string, 
    period: AnalyticsPeriod = 'monthly'
  ): Promise<UserReferralPerformance> {
    try {
      // Calculate time boundaries
      const { startDate, endDate } = this.getDateRangeForPeriod(period);
      
      // Get user's referrals in the period
      const referrals = await this.getUserReferralsInPeriod(userId, startDate, endDate);
      
      // Get user's referral stats
      const stats = await this.referralRepository.getReferralStats(userId);
      
      // Calculate active referrals
      const activeStatuses = ['completed', 'converted', 'rewarded'];
      const activeReferrals = referrals.filter(r => 
        activeStatuses.includes(r.status)
      ).length;
      
      // Calculate conversion rate
      const conversionRate = referrals.length > 0 
        ? (activeReferrals / referrals.length) * 100 
        : 0;
      
      // Get user's rewards in the period
      const rewards = await this.getUserRewardsInPeriod(userId, startDate, endDate);
      
      // Calculate user's rank and percentile
      const ranking = await this.getUserReferralRanking(userId, startDate, endDate);
      
      // Calculate trend compared to previous period
      const trend = await this.calculateUserTrend(userId, period);
      
      // Calculate source breakdown
      const sources = this.calculateUserSourceBreakdown(referrals);
      
      return {
        userId,
        period,
        totalReferrals: referrals.length,
        activeReferrals,
        conversionRate,
        totalRewards: rewards.total,
        averageRewardPerReferral: referrals.length > 0 ? rewards.total / referrals.length : 0,
        performance: {
          percentile: ranking.percentile,
          rank: ranking.rank,
          totalUsers: ranking.totalUsers
        },
        trending: {
          direction: trend.direction,
          changePercentage: trend.changePercentage
        },
        sources
      };
    } catch (error) {
      logger.error('Failed to get user referral performance', { userId, period, error });
      throw error;
    }
  }

  /**
   * Get conversion funnel analysis
   * 
   * @param period Analysis period
   * @returns Conversion funnel
   */
  async getConversionFunnelAnalysis(period: AnalyticsPeriod = 'monthly'): Promise<ConversionFunnel> {
    try {
      // Calculate time boundaries
      const { startDate, endDate } = this.getDateRangeForPeriod(period);
      
      // Define funnel stages
      const stages: FunnelStage[] = [
        { name: 'Visit', count: 0, conversionRate: 0, dropOff: 0 },
        { name: 'Signup', count: 0, conversionRate: 0, dropOff: 0 },
        { name: 'Completed Onboarding', count: 0, conversionRate: 0, dropOff: 0 },
        { name: 'Connected Wallet', count: 0, conversionRate: 0, dropOff: 0 },
        { name: 'Active Engagement', count: 0, conversionRate: 0, dropOff: 0 }
      ];
      
      // In a real implementation, this would query actual tracking and
      // referral data for each stage
      
      // Simulate funnel data
      stages[0].count = await this.getVisitsInPeriod(startDate, endDate);
      stages[1].count = Math.floor(stages[0].count * 0.15); // 15% signup
      stages[2].count = Math.floor(stages[1].count * 0.7); // 70% complete onboarding
      stages[3].count = Math.floor(stages[2].count * 0.4); // 40% connect wallet
      stages[4].count = Math.floor(stages[3].count * 0.6); // 60% become active
      
      // Calculate conversion rates and drop-offs
      for (let i = 0; i < stages.length; i++) {
        if (i > 0) {
          const previousStage = stages[i - 1];
          stages[i].conversionRate = previousStage.count > 0 
            ? (stages[i].count / previousStage.count) * 100 
            : 0;
          stages[i].dropOff = previousStage.count - stages[i].count;
        } else {
          stages[i].conversionRate = 100;
          stages[i].dropOff = 0;
        }
      }
      
      // Calculate overall conversion
      const overallConversion = stages[0].count > 0 
        ? (stages[stages.length - 1].count / stages[0].count) * 100 
        : 0;
      
      return {
        total: stages[0].count,
        stages,
        overallConversion
      };
    } catch (error) {
      logger.error('Failed to get conversion funnel analysis', { period, error });
      throw error;
    }
  }

  /**
   * Generate a comprehensive referral report
   * 
   * @param startDate Start date
   * @param endDate End date
   * @returns Referral report
   */
  async generateReferralReport(startDate: Date, endDate: Date): Promise<ReferralReport> {
    try {
      // Get referrals in the period
      const referrals = await this.referralRepository.findByDateRange(
        startDate, 
        endDate,
        1000, // Limit
        0     // Offset
      );
      
      // Get referrers who made their first referral in this period
      const newReferrers = await this.getNewReferrersInPeriod(startDate, endDate);
      
      // Get rewards in the period
      const rewards = await this.getRewardsInPeriod(startDate, endDate);
      
      // Calculate visits
      const visits = await this.getVisitsInPeriod(startDate, endDate);
      const conversionRate = visits > 0 ? (referrals.length / visits) * 100 : 0;
      
      // Generate daily breakdown
      const dailyBreakdown = await this.generateDailyBreakdown(startDate, endDate);
      
      // Generate status breakdown
      const statusBreakdown = this.generateStatusBreakdown(referrals);
      
      // Generate source breakdown
      const sourceBreakdown = this.generateSourceBreakdown(referrals);
      
      // Generate campaign performance
      const campaignPerformance = await this.generateCampaignPerformance(startDate, endDate);
      
      return {
        startDate,
        endDate,
        summary: {
          totalReferrals: referrals.length,
          newReferrers,
          totalRewards: rewards.total,
          conversionRate
        },
        dailyBreakdown,
        statusBreakdown,
        sourceBreakdown,
        campaignPerformance
      };
    } catch (error) {
      logger.error('Failed to generate referral report', { startDate, endDate, error });
      throw error;
    }
  }

  /**
   * Get referral trends for growth analysis
   * 
   * @returns Referral trends
   */
  async getReferralTrends(): Promise<ReferralTrends> {
    try {
      // Generate trend data
      const daily = await this.generateDailyTrends();
      const weekly = await this.generateWeeklyTrends();
      const monthly = await this.generateMonthlyTrends();
      
      // Calculate growth rates
      const yearlyGrowth = this.calculateGrowthRate(monthly, 12);
      const quarterlyGrowth = this.calculateGrowthRate(monthly, 3);
      const monthlyGrowth = this.calculateGrowthRate(weekly, 4);
      const weeklyGrowth = this.calculateGrowthRate(daily, 7);
      
      return {
        daily,
        weekly,
        monthly,
        yearlyGrowth,
        quarterlyGrowth,
        monthlyGrowth,
        weeklyGrowth
      };
    } catch (error) {
      logger.error('Failed to get referral trends', { error });
      throw error;
    }
  }

  /**
   * Get date range for the specified period
   * 
   * @param period Analysis period
   * @returns Date range
   */
  private getDateRangeForPeriod(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1); // Start from beginning of 2020
        break;
    }
    
    return { startDate, endDate };
  }

  /**
   * Get visits in the specified period
   * 
   * @param startDate Start date
   * @param endDate End date
   * @returns Number of visits
   */
  private async getVisitsInPeriod(startDate: Date, endDate: Date): Promise<number> {
    // In a real implementation, this would query tracking records
    // For now, we'll simulate 6-10x the number of referrals
    const referrals = await this.referralRepository.findByDateRange(
      startDate, 
      endDate,
      1, // Limit
      0  // Offset
    );
    
    // Count referrals in this period
    const referralCount = await this.countReferralsInPeriod(startDate, endDate);
    
    // Simulate visits (6-10x referrals)
    const multiplier = 6 + Math.floor(Math.random() * 5);
    return referralCount * multiplier;
  }

  /**
   * Get rewards in the specified period
   * 
   * @param startDate Start date
   * @param endDate End date
   * @returns Reward summary
   */
  private async getRewardsInPeriod(
    startDate: Date, 
    endDate: Date
  ): Promise<{
    total: number;
    signup: number;
    engagement: number;
    wallet: number;
    other: number;
  }> {
    // In a real implementation, this would query reward records
    // For now, we'll generate synthetic data based on referrals
    
    // Count referrals in this period
    const referralCount = await this.countReferralsInPeriod(startDate, endDate);
    
    // Generate reward distribution
    const signupRewards = referralCount * 500; // 500 points per signup
    const walletRewards = Math.floor(referralCount * 0.4) * 250; // 40% connect wallet, 250 points each
    const engagementRewards = Math.floor(referralCount * 0.3) * 100; // 30% engagement, 100 points each
    const otherRewards = Math.floor(referralCount * 0.1) * 100; // 10% other rewards, 100 points each
    
    return {
      total: signupRewards + walletRewards + engagementRewards + otherRewards,
      signup: signupRewards,
      engagement: engagementRewards,
      wallet: walletRewards,
      other: otherRewards
    };
  }

  /**
   * Calculate tier metrics
   * 
   * @param referrals Referral array
   * @param rewards Reward summary
   * @returns Tier metrics
   */
  private async calculateTierMetrics(
    referrals: any[], 
    rewards: any
  ): Promise<{
    tier: string;
    referrals: number;
    rewards: number;
    conversionRate: number;
  }[]> {
    // In a real implementation, this would analyze referrals by tier
    // For now, we'll simulate three tiers
    
    // Group referrers by number of referrals
    const referrerCounts: Record<string, number> = {};
    
    for (const referral of referrals) {
      const referrerId = referral.referrer_id;
      referrerCounts[referrerId] = (referrerCounts[referrerId] || 0) + 1;
    }
    
    // Define tiers
    const tiers = [
      { name: 'Bronze', min: 1, max: 4 },
      { name: 'Silver', min: 5, max: 9 },
      { name: 'Gold', min: 10, max: Infinity }
    ];
    
    // Group referrers by tier
    const tierGroups: Record<string, string[]> = {
      'Bronze': [],
      'Silver': [],
      'Gold': []
    };
    
    for (const [referrerId, count] of Object.entries(referrerCounts)) {
      for (const tier of tiers) {
        if (count >= tier.min && count <= tier.max) {
          tierGroups[tier.name].push(referrerId);
          break;
        }
      }
    }
    
    // Calculate metrics for each tier
    const metrics = [];
    
    for (const tier of tiers) {
      const referrers = tierGroups[tier.name];
      const tierReferrals = referrers.reduce((sum, referrerId) => 
        sum + (referrerCounts[referrerId] || 0), 0
      );
      
      // Simulate rewards distribution
      const tierRewardShare = tier.name === 'Bronze' ? 0.3 : 
                             tier.name === 'Silver' ? 0.3 : 0.4;
      const tierRewards = Math.floor(rewards.total * tierRewardShare);
      
      // Calculate conversion rate
      const tierVisits = tierReferrals * 8; // Assume 8x visits per referral
      const conversionRate = tierVisits > 0 ? (tierReferrals / tierVisits) * 100 : 0;
      
      metrics.push({
        tier: tier.name,
        referrals: tierReferrals,
        rewards: tierRewards,
        conversionRate
      });
    }
    
    return metrics;
  }

  /**
   * Calculate source breakdown
   * 
   * @param referrals Referral array
   * @returns Source metrics
   */
  private calculateSourceBreakdown(
    referrals: any[]
  ): {
    source: string;
    referrals: number;
    percentage: number;
  }[] {
    // Group referrals by source
    const sourceGroups: Record<string, number> = {};
    
    for (const referral of referrals) {
      const source = referral.source || 'direct';
      sourceGroups[source] = (sourceGroups[source] || 0) + 1;
    }
    
    // Calculate percentages
    const total = referrals.length;
    const sources = [];
    
    for (const [source, count] of Object.entries(sourceGroups)) {
      sources.push({
        source,
        referrals: count,
        percentage: total > 0 ? (count / total) * 100 : 0
      });
    }
    
    // Sort by count, descending
    return sources.sort((a, b) => b.referrals - a.referrals);
  }

  /**
   * Get top referrers in the specified period
   * 
   * @param startDate Start date
   * @param endDate End date
   * @param limit Maximum number of referrers to return
   * @returns Top referrers
   */
  private async getTopReferrers(
    startDate: Date, 
    endDate: Date, 
    limit: number
  ): Promise<{
    userId: string;
    referrals: number;
    rewards: number;
  }[]> {
    // In a real implementation, this would query referrals and rewards
    // For now, we'll simulate data
    
    // Get referrals in the period
    const referrals = await this.referralRepository.findByDateRange(
      startDate, 
      endDate,
      1000, // Limit
      0     // Offset
    );
    
    // Group by referrer
    const referrerCounts: Record<string, number> = {};
    
    for (const referral of referrals) {
      const referrerId = referral.referrer_id;
      referrerCounts[referrerId] = (referrerCounts[referrerId] || 0) + 1;
    }
    
    // Convert to array and sort
    const referrers = Object.entries(referrerCounts)
      .map(([userId, count]) => ({
        userId,
        referrals: count,
        rewards: count * 500 + Math.floor(count * 0.4) * 250 // Simulate rewards
      }))
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, limit);
    
    return referrers;
  }

  /**
   * Get user's referrals in the specified period
   * 
   * @param userId User ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Referrals array
   */
  private async getUserReferralsInPeriod(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<any[]> {
    // In a real implementation, this would query the referrals table
    // For now, we'll use the date range method
    
    const referrals = await this.referralRepository.findByDateRange(
      startDate, 
      endDate,
      1000, // Limit
      0     // Offset
    );
    
    // Filter by referrer ID
    return referrals.filter(r => r.referrer_id === userId);
  }

  /**
   * Get user's rewards in the specified period
   * 
   * @param userId User ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Reward summary
   */
  private async getUserRewardsInPeriod(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{
    total: number;
    signup: number;
    engagement: number;
    wallet: number;
    other: number;
  }> {
    // In a real implementation, this would query reward records
    // For now, we'll generate synthetic data based on the user's referrals
    
    // Get user's referrals in the period
    const referrals = await this.getUserReferralsInPeriod(userId, startDate, endDate);
    
    // Generate reward distribution
    const signupRewards = referrals.length * 500; // 500 points per signup
    const walletRewards = Math.floor(referrals.length * 0.4) * 250; // 40% connect wallet, 250 points each
    const engagementRewards = Math.floor(referrals.length * 0.3) * 100; // 30% engagement, 100 points each
    const otherRewards = Math.floor(referrals.length * 0.1) * 100; // 10% other rewards, 100 points each
    
    return {
      total: signupRewards + walletRewards + engagementRewards + otherRewards,
      signup: signupRewards,
      engagement: engagementRewards,
      wallet: walletRewards,
      other: otherRewards
    };
  }

  /**
   * Get user's referral ranking
   * 
   * @param userId User ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Ranking information
   */
  private async getUserReferralRanking(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{
    rank: number;
    percentile: number;
    totalUsers: number;
  }> {
    // In a real implementation, this would query all users and rank them
    // For now, we'll generate a synthetic ranking
    
    // Get top referrers in the period
    const topReferrers = await this.getTopReferrers(startDate, endDate, 1000);
    
    // Find user's position
    const userIndex = topReferrers.findIndex(r => r.userId === userId);
    
    // Calculate ranking
    if (userIndex === -1) {
      // User not in top referrers
      return {
        rank: topReferrers.length + 1,
        percentile: 0,
        totalUsers: topReferrers.length + 10 // Simulate some extra users
      };
    } else {
      const rank = userIndex + 1;
      const totalUsers = topReferrers.length;
      const percentile = totalUsers > 0 
        ? Math.max(0, 100 - (rank / totalUsers) * 100)
        : 0;
      
      return { rank, percentile, totalUsers };
    }
  }

  /**
   * Calculate user trend compared to previous period
   * 
   * @param userId User ID
   * @param period Analysis period
   * @returns Trend information
   */
  private async calculateUserTrend(
    userId: string, 
    period: AnalyticsPeriod
  ): Promise<{
    direction: 'up' | 'down' | 'stable';
    changePercentage: number;
  }> {
    // Calculate current and previous periods
    const currentPeriod = this.getDateRangeForPeriod(period);
    const previousPeriod = this.getPreviousPeriod(period);
    
    // Get referrals in both periods
    const currentReferrals = await this.getUserReferralsInPeriod(
      userId, 
      currentPeriod.startDate, 
      currentPeriod.endDate
    );
    
    const previousReferrals = await this.getUserReferralsInPeriod(
      userId, 
      previousPeriod.startDate, 
      previousPeriod.endDate
    );
    
    // Calculate change
    const currentCount = currentReferrals.length;
    const previousCount = previousReferrals.length;
    
    let changePercentage = 0;
    let direction: 'up' | 'down' | 'stable' = 'stable';
    
    if (previousCount > 0) {
      changePercentage = ((currentCount - previousCount) / previousCount) * 100;
      
      if (changePercentage > 5) {
        direction = 'up';
      } else if (changePercentage < -5) {
        direction = 'down';
      }
    } else if (currentCount > 0) {
      // No previous referrals, but some current ones
      direction = 'up';
      changePercentage = 100;
    }
    
    return { direction, changePercentage };
  }

  /**
   * Calculate user source breakdown
   * 
   * @param referrals Referral array
   * @returns Source breakdown
   */
  private calculateUserSourceBreakdown(
    referrals: any[]
  ): {
    source: string;
    referrals: number;
    percentage: number;
  }[] {
    // Group referrals by source
    const sourceGroups: Record<string, number> = {};
    
    for (const referral of referrals) {
      const source = referral.source || 'direct';
      sourceGroups[source] = (sourceGroups[source] || 0) + 1;
    }
    
    // Calculate percentages
    const total = referrals.length;
    const sources = [];
    
    for (const [source, count] of Object.entries(sourceGroups)) {
      sources.push({
        source,
        referrals: count,
        percentage: total > 0 ? (count / total) * 100 : 0
      });
    }
    
    // Sort by count, descending
    return sources.sort((a, b) => b.referrals - a.referrals);
  }

  /**
   * Get previous period date range
   * 
   * @param period Analysis period
   * @returns Previous period date range
   */
  private getPreviousPeriod(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
    const current = this.getDateRangeForPeriod(period);
    
    // Calculate previous period
    const periodLength = current.endDate.getTime() - current.startDate.getTime();
    
    const endDate = new Date(current.startDate.getTime());
    const startDate = new Date(endDate.getTime() - periodLength);
    
    return { startDate, endDate };
  }

  /**
   * Count referrals in the specified period
   * 
   * @param startDate Start date
   * @param endDate End date
   * @returns Number of referrals
   */
  private async countReferralsInPeriod(startDate: Date, endDate: Date): Promise<number> {
    // In a real implementation, this would use a COUNT query
    // For now, we'll count the results from findByDateRange
    
    const referrals = await this.referralRepository.findByDateRange(
      startDate, 
      endDate,
      1000, // Limit
      0     // Offset
    );
    
    return referrals.length;
  }

  /**
   * Get new referrers in the specified period
   * 
   * @param startDate Start date
   * @param endDate End date
   * @returns Number of new referrers
   */
  private async getNewReferrersInPeriod(startDate: Date, endDate: Date): Promise<number> {
    // In a real implementation, this would be a more complex query
    // For now, we'll estimate as 20% of referrers in the period
    
    // Get referrals in the period
    const referrals = await this.referralRepository.findByDateRange(
      startDate, 
      endDate,
      1000, // Limit
      0     // Offset
    );
    
    // Get unique referrers
    const uniqueReferrers = new Set(referrals.map(r => r.referrer_id)).size;
    
    // Estimate new referrers
    return Math.floor(uniqueReferrers * 0.2);
  }

  /**
   * Generate daily breakdown for report
   * 
   * @param startDate Start date
   * @param endDate End date
   * @returns Daily breakdown array
   */
  private async generateDailyBreakdown(
    startDate: Date, 
    endDate: Date
  ): Promise<{
    date: string;
    referrals: number;
    rewards: number;
  }[]> {
    // In a real implementation, this would query referrals and rewards by day
    // For now, we'll generate synthetic data
    
    const breakdown = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayReferrals = 10 + Math.floor(Math.random() * 20); // 10-30 referrals per day
      const dayRewards = dayReferrals * 500 + Math.floor(dayReferrals * 0.4) * 250;
      
      breakdown.push({
        date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD
        referrals: dayReferrals,
        rewards: dayRewards
      });
      
      // Increment date by 1 day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return breakdown;
  }

  /**
   * Generate status breakdown
   * 
   * @param referrals Referral array
   * @returns Status breakdown array
   */
  private generateStatusBreakdown(
    referrals: any[]
  ): {
    status: string;
    count: number;
    percentage: number;
  }[] {
    // Group referrals by status
    const statusGroups: Record<string, number> = {};
    
    for (const referral of referrals) {
      const status = referral.status;
      statusGroups[status] = (statusGroups[status] || 0) + 1;
    }
    
    // Calculate percentages
    const total = referrals.length;
    const statuses = [];
    
    for (const [status, count] of Object.entries(statusGroups)) {
      statuses.push({
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      });
    }
    
    // Sort by count, descending
    return statuses.sort((a, b) => b.count - a.count);
  }

  /**
   * Generate source breakdown
   * 
   * @param referrals Referral array
   * @returns Source breakdown array
   */
  private generateSourceBreakdown(
    referrals: any[]
  ): {
    source: string;
    count: number;
    percentage: number;
  }[] {
    // Group referrals by source
    const sourceGroups: Record<string, number> = {};
    
    for (const referral of referrals) {
      const source = referral.source || 'direct';
      sourceGroups[source] = (sourceGroups[source] || 0) + 1;
    }
    
    // Calculate percentages
    const total = referrals.length;
    const sources = [];
    
    for (const [source, count] of Object.entries(sourceGroups)) {
      sources.push({
        source,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      });
    }
    
    // Sort by count, descending
    return sources.sort((a, b) => b.count - a.count);
  }

  /**
   * Generate campaign performance
   * 
   * @param startDate Start date
   * @param endDate End date
   * @returns Campaign performance array
   */
  private async generateCampaignPerformance(
    startDate: Date, 
    endDate: Date
  ): Promise<{
    campaignId: string;
    name: string;
    referrals: number;
    rewards: number;
    conversionRate: number;
  }[]> {
    // In a real implementation, this would query campaigns and their referrals
    // For now, we'll generate synthetic data for 3 campaigns
    
    const campaigns = [
      { id: 'camp-1', name: 'Spring Launch' },
      { id: 'camp-2', name: 'Summer Promo' },
      { id: 'camp-3', name: 'Referral Contest' }
    ];
    
    const result = [];
    
    for (const campaign of campaigns) {
      const campaignReferrals = 20 + Math.floor(Math.random() * 80); // 20-100 referrals per campaign
      const campaignRewards = campaignReferrals * 500 + Math.floor(campaignReferrals * 0.4) * 250;
      const campaignVisits = campaignReferrals * 8; // Assume 8x visits per referral
      const conversionRate = campaignVisits > 0 ? (campaignReferrals / campaignVisits) * 100 : 0;
      
      result.push({
        campaignId: campaign.id,
        name: campaign.name,
        referrals: campaignReferrals,
        rewards: campaignRewards,
        conversionRate
      });
    }
    
    // Sort by referrals, descending
    return result.sort((a, b) => b.referrals - a.referrals);
  }

  /**
   * Generate daily trends
   * 
   * @returns Daily trends array
   */
  private async generateDailyTrends(): Promise<{
    date: string;
    referrals: number;
    rewards: number;
  }[]> {
    // Generate trend data for the last 14 days
    const trends = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);
    
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayReferrals = 10 + Math.floor(Math.random() * 20); // 10-30 referrals per day
      const dayRewards = dayReferrals * 500 + Math.floor(dayReferrals * 0.4) * 250;
      
      trends.push({
        date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD
        referrals: dayReferrals,
        rewards: dayRewards
      });
      
      // Increment date by 1 day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return trends;
  }

  /**
   * Generate weekly trends
   * 
   * @returns Weekly trends array
   */
  private async generateWeeklyTrends(): Promise<{
    week: string;
    referrals: number;
    rewards: number;
  }[]> {
    // Generate trend data for the last 8 weeks
    const trends = [];
    const endDate = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      
      const weekReferrals = 70 + Math.floor(Math.random() * 130); // 70-200 referrals per week
      const weekRewards = weekReferrals * 500 + Math.floor(weekReferrals * 0.4) * 250;
      
      trends.push({
        week: `Week ${8 - i}`, // Week 1, Week 2, etc.
        referrals: weekReferrals,
        rewards: weekRewards
      });
    }
    
    return trends;
  }

  /**
   * Generate monthly trends
   * 
   * @returns Monthly trends array
   */
  private async generateMonthlyTrends(): Promise<{
    month: string;
    referrals: number;
    rewards: number;
  }[]> {
    // Generate trend data for the last 12 months
    const trends = [];
    const endDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      const monthReferrals = 300 + Math.floor(Math.random() * 500); // 300-800 referrals per month
      const monthRewards = monthReferrals * 500 + Math.floor(monthReferrals * 0.4) * 250;
      
      trends.push({
        month: monthName,
        referrals: monthReferrals,
        rewards: monthRewards
      });
    }
    
    return trends;
  }

  /**
   * Calculate growth rate from trend data
   * 
   * @param trendData Trend data array
   * @param periods Number of periods to compare
   * @returns Growth rate percentage
   */
  private calculateGrowthRate(trendData: any[], periods: number): number {
    if (trendData.length < periods + 1) {
      return 0;
    }
    
    // Get older and newer periods
    const olderPeriods = trendData.slice(0, periods);
    const newerPeriods = trendData.slice(trendData.length - periods);
    
    // Calculate sums
    const olderSum = olderPeriods.reduce((sum, period) => sum + period.referrals, 0);
    const newerSum = newerPeriods.reduce((sum, period) => sum + period.referrals, 0);
    
    // Calculate growth rate
    return olderSum > 0 ? ((newerSum - olderSum) / olderSum) * 100 : 0;
  }
}
