import { FastifyRequest, FastifyReply } from 'fastify';
import { DashboardData, GetDashboardRequest } from './types';
import { GetDashboardResponseSchema } from './schema';
import { AppError } from '../../errors/base-error'; // Import base error class
import { cacheService } from '../../lib/cache'; // Assuming cache service exists
import { logger } from '../../lib/logger'; // Assuming logger exists

// Placeholder imports for actual services - replace with real ones
import { pointsService } from '../../services/points'; // Example
// import { achievementService } from '../../services/achievements'; // Example
// import { activityService } from '../../services/activity'; // Example
// import { marketService } from '../../services/market'; // Example
// import { userService } from '../../services/user-service'; // Example

const CACHE_KEY_PREFIX = 'dashboard:';
const CACHE_TTL_SECONDS = 60 * 2; // 2 minutes

export async function getDashboardData(
  request: FastifyRequest<{ Querystring: GetDashboardRequest }>, // Assuming request type if needed
  reply: FastifyReply
): Promise<void> {
  // Assuming auth middleware adds userId to request or session
  const userId = request.user?.id; // Adjust based on actual auth implementation
  if (!userId) {
    // Use AppError with appropriate code and status
    throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;

  try {
    // 1. Check cache first
    const cachedData = await cacheService.get<DashboardData>(cacheKey);
    if (cachedData) {
      logger.info({ userId, cacheHit: true }, 'Dashboard data served from cache');
      const response = { data: cachedData };
      // Validate response against schema before sending (optional but good practice)
      // GetDashboardResponseSchema.parse(response);
      return reply.send(response);
    }

    logger.info({ userId, cacheHit: false }, 'Fetching fresh dashboard data');

    // 2. Fetch data concurrently if not cached
    // Replace placeholders with actual service calls
    const [
      pointsData,
      achievementsData,
      activityData,
      marketData,
      referralData,
    ] = await Promise.all([
      // --- Points ---
      Promise.resolve({ /* Placeholder */
        currentBalance: 1000,
        lifetimeEarned: 5000,
        redeemedTotal: 500,
        dailyEarned: 50,
        recentTransactions: [{ id: 'tx1', amount: 10, source: 'post', createdAt: new Date() }],
        dailyCapStatus: { used: 50, limit: 100 },
        weeklyCapStatus: { used: 200, limit: 500 },
      }), // pointsService.getSummary(userId),
      // --- Achievements ---
      Promise.resolve({ /* Placeholder */
        recentUnlocks: [{ id: 'ach1', name: 'First Post', unlockedAt: new Date() }],
        topInProgress: [{ id: 'ach2', name: 'Engager', progress: 50 }],
      }), // achievementService.getSummary(userId),
      // --- Activity ---
      Promise.resolve({ /* Placeholder */
        recentItems: [{ id: 'act1', type: 'comment', timestamp: new Date() }],
      }), // activityService.getRecent(userId, 5),
      // --- Market ---
      Promise.resolve({ /* Placeholder */
        currentPrice: 0.001,
        change24h: 5.2,
        marketCap: 1000000,
        nextMilestoneProgress: 75,
      }), // marketService.getSummary(),
      // --- Referral ---
      Promise.resolve({ /* Placeholder */
        referralCode: 'REF123',
        successfulReferrals: 5,
      }), // userService.getReferralInfo(userId),
    ]);

    // 3. Aggregate data
    const dashboardData: DashboardData = {
      points: pointsData,
      achievements: achievementsData,
      activity: activityData,
      market: marketData,
      referral: referralData,
    };

    // 4. Store in cache
    await cacheService.set(cacheKey, dashboardData, { ttl: CACHE_TTL_SECONDS }); // Pass TTL in options object

    // 5. Format and send response
    const response = { data: dashboardData };
    // Validate response against schema before sending
    // GetDashboardResponseSchema.parse(response);
    reply.send(response);

  } catch (error) {
    logger.error({ err: error, userId }, 'Error fetching dashboard data');
    if (error instanceof AppError) { // Check for AppError
      throw error;
    }
    // Consider specific error handling for service failures
    // Use AppError with appropriate code and status
    throw new AppError('Failed to fetch dashboard data', 'DASHBOARD_FETCH_FAILED', 500);
  }
}
