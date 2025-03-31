import { FastifyRequest, FastifyReply } from 'fastify';
import { cacheService } from '../../lib/cache';
import { logger } from '../../lib/logger';
import { AppError, ErrorCode } from '../../lib/errors';

// Import actual services from the main service index
import {
  enhancedPointsService,
  achievementService,
  contentService,
  feedService,
  // marketService, // This service doesn't exist yet
  // userService, // This service doesn't exist yet
  // referralService, // This service doesn't exist yet
  walletService
} from '../../services';

// Create placeholder services for ones that don't exist yet
const marketService = {
  getCurrentStats: async () => ({ price: 0, priceChange24h: 0, marketCap: 0 }),
  getMilestoneProgress: async () => ({ progressPercentage: 0 })
};

const userService = {
  // Add any methods needed here
};

const referralService = {
  getUserReferralStats: async (userId: string) => ({ 
    referrals: { 
      completed: 0, 
      converted: 0, 
      rewarded: 0, 
      pending: 0 
    } 
  })
};

// Import specific types needed for casting or default values
import {
  PointsSummary,
  AchievementsSummary,
  ActivitySummary,
  MarketSummary,
  ReferralSummary,
  DashboardData
} from './types';

const CACHE_KEY_PREFIX = 'dashboard:';
const CACHE_TTL_SECONDS = 120; // 2 minutes

// Helper functions to create default summaries in case of service errors
const createDefaultPointsSummary = (): PointsSummary => ({
  currentBalance: 0,
  lifetimeEarned: 0,
  redeemedTotal: 0,
  dailyEarned: 0,
  recentTransactions: [],
  dailyCapStatus: { used: 0, limit: 0 },
  weeklyCapStatus: { used: 0, limit: 0 }
});

const createDefaultAchievementsSummary = (): AchievementsSummary => ({
  recentUnlocks: [],
  topInProgress: []
});

const createDefaultActivitySummary = (): ActivitySummary => ({
  recentItems: []
});

const createDefaultMarketSummary = (): MarketSummary => ({
  currentPrice: 0,
  change24h: 0,
  marketCap: 0,
  nextMilestoneProgress: 0
});

const createDefaultReferralSummary = (): ReferralSummary => ({
  referralCode: '',
  successfulReferrals: 0,
  pendingReferrals: 0
});

/**
 * Retrieves all dashboard data for a user from multiple services concurrently.
 * Handles partial failures gracefully and implements caching for performance.
 */
export async function getDashboardData(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Get the authenticated user ID
  const userId = request.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, 401);
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
  const startTime = process.hrtime();

  try {
    // 1. Check cache first
    const cachedData = await cacheService.get<DashboardData>(cacheKey);
    if (cachedData) {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      
      logger.info({ userId, cacheHit: true, duration }, 'Dashboard data served from cache');
      
      return reply.send({
        data: cachedData,
        meta: {
          timestamp: new Date().toISOString(),
          fromCache: true,
          duration: `${duration.toFixed(2)}ms`
        }
      });
    }

    logger.info({ userId, cacheHit: false }, 'Fetching fresh dashboard data');

    // 2. Fetch data concurrently from all services using Promise.allSettled
    const results = await Promise.allSettled([
      // Points summary data
      enhancedPointsService.getUserBalance(userId).then(async (currentBalance) => {
        const transactions = await enhancedPointsService.getUserTransactions(userId, { limit: 5 });
        const dailyCaps = await enhancedPointsService.getAllDailyCaps(userId);
        
        // Get daily cap for content creation as an example
        const contentCreationCap = dailyCaps.get('content_creation') || { current: 0, limit: 0 };
        // Get weekly cap (implementation would need to be added to EnhancedPointsService)
        const weeklyUsed = 0; // Placeholder
        const weeklyLimit = 0; // Placeholder
        
        return {
          currentBalance,
          lifetimeEarned: 0, // This would need to be calculated
          redeemedTotal: 0, // This would need to be calculated
          dailyEarned: 0, // This would need to be calculated
          recentTransactions: transactions.transactions,
          dailyCapStatus: { 
            used: contentCreationCap.current, 
            limit: contentCreationCap.limit 
          },
          weeklyCapStatus: { 
            used: weeklyUsed, 
            limit: weeklyLimit 
          }
        };
      }),
      
      // Achievement summary data
      achievementService.getAchievementSummaryForDashboard(userId),
      
      // Activity summary data - recent content from feed service
      feedService.getFeed({ 
        limit: 5,
        sortBy: 'latest'
      }).then(items => ({ recentItems: items })),
      
      // Market summary data
      marketService.getCurrentStats().then(async (stats: any) => {
        if (!stats) return createDefaultMarketSummary();
        
        const milestoneProgress = await marketService.getMilestoneProgress();
        return {
          currentPrice: stats.price,
          change24h: stats.priceChange24h,
          marketCap: stats.marketCap,
          nextMilestoneProgress: milestoneProgress?.progressPercentage || 0
        };
      }),
      
      // Referral summary data
      referralService.getUserReferralStats(userId).then((stats: any) => {
        // Find or generate referral code
        const referralCode = 'SK-' + userId.substring(0, 6); // Placeholder logic
        
        return {
          referralCode,
          successfulReferrals: stats.referrals.completed + stats.referrals.converted + stats.referrals.rewarded,
          pendingReferrals: stats.referrals.pending
        };
      }),
      
      // Wallet information (used in error handling but not directly in dashboard)
      walletService.getUserWallet(userId)
    ]);

    // 3. Process results, handling potential failures gracefully
    const pointsData = results[0].status === 'fulfilled' ? results[0].value : createDefaultPointsSummary();
    if (results[0].status === 'rejected') {
      logger.error({ userId, service: 'points', error: results[0].reason }, 'Dashboard: Failed to fetch points summary');
    }

    const achievementsData = results[1].status === 'fulfilled' ? results[1].value : createDefaultAchievementsSummary();
    if (results[1].status === 'rejected') {
      logger.error({ userId, service: 'achievements', error: results[1].reason }, 'Dashboard: Failed to fetch achievements summary');
    }

    const activityData = results[2].status === 'fulfilled' ? results[2].value : createDefaultActivitySummary();
    if (results[2].status === 'rejected') {
      logger.error({ userId, service: 'activity/feed', error: results[2].reason }, 'Dashboard: Failed to fetch activity summary');
    }

    const marketData = results[3].status === 'fulfilled' ? results[3].value : createDefaultMarketSummary();
    if (results[3].status === 'rejected') {
      logger.error({ service: 'market', error: results[3].reason }, 'Dashboard: Failed to fetch market summary');
    }

    const referralData = results[4].status === 'fulfilled' ? results[4].value : createDefaultReferralSummary();
    if (results[4].status === 'rejected') {
      logger.error({ userId, service: 'referral', error: results[4].reason }, 'Dashboard: Failed to fetch referral summary');
    }

    // Wallet information is used for additional context but not included in the dashboard directly
    const walletData = results[5].status === 'fulfilled' ? results[5].value : null;
    if (results[5].status === 'rejected') {
      logger.error({ userId, service: 'wallet', error: results[5].reason }, 'Dashboard: Failed to fetch wallet info');
    }

    // 4. Aggregate data
    const dashboardData: DashboardData = {
      points: pointsData as PointsSummary,
      achievements: achievementsData as AchievementsSummary,
      activity: activityData as ActivitySummary,
      market: marketData as MarketSummary,
      referral: referralData as ReferralSummary,
    };

    // 5. Store in cache with TTL
    try {
      await cacheService.set(cacheKey, dashboardData, { ttl: CACHE_TTL_SECONDS });
      logger.info({ userId }, 'Dashboard data stored in cache');
    } catch (cacheError) {
      logger.error({ userId, error: cacheError }, 'Failed to store dashboard data in cache');
      // Proceed without cache, but log the error
    }

    // 6. Calculate response time
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    // 7. Send response
    reply.send({
      data: dashboardData,
      meta: {
        timestamp: new Date().toISOString(),
        fromCache: false,
        duration: `${duration.toFixed(2)}ms`,
        services: {
          points: results[0].status,
          achievements: results[1].status,
          activity: results[2].status,
          market: results[3].status,
          referral: results[4].status,
          wallet: results[5].status
        }
      }
    });

  } catch (error) {
    // Log the error that occurred *before* sending the response
    logger.error({ err: error, userId }, 'Error processing dashboard request');
    
    // Use handleApiError or rethrow AppError
    if (error instanceof AppError) {
      reply.code(error.statusCode); // Set status code before throwing
      throw error; // Let the global error handler format the response
    }
    
    // Throw a generic error if it's not an AppError
    throw new AppError('Failed to fetch dashboard data', ErrorCode.SERVER_ERROR, 500);
  }
}
