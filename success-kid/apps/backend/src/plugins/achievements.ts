/**
 * Achievement Plugin
 * 
 * This plugin registers all achievement and gamification services for the application.
 */
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { getDatabase } from '../database';
import { EventBus } from '../lib/event-bus';
import { logger } from '../lib/logger';

// Achievement Service
import { AchievementRepository } from '../repositories/achievement/achievement-repository';
import { AchievementService } from '../services/achievement/achievement-service';

// Level Service
import { LevelRepository } from '../repositories/achievement/level-repository';
import { LevelService } from '../services/achievement/level-service';

// Badge Service
import { BadgeRepository } from '../repositories/achievement/badge-repository';
import { BadgeService } from '../services/achievement/badge-service';

// Streak Service
import { StreakRepository } from '../repositories/achievement/streak-repository';
import { StreakService } from '../services/achievement/streak-service';

// Challenge Service
import { ChallengeRepository } from '../repositories/achievement/challenge-repository';
import { ChallengeService } from '../services/achievement/challenge-service';

// Leaderboard Service
import { LeaderboardRepository } from '../repositories/achievement/leaderboard-repository';
import { LeaderboardService } from '../services/achievement/leaderboard-service';

// Points Service for awarding points
import { PointsService } from '../services/points/points-service';

/**
 * Plugin to initialize and register achievement services
 */
export default fp(async (fastify: FastifyInstance) => {
  const db = getDatabase().pool;
  const eventBus = new EventBus();
  
  // Get points service instance
  const pointsService = fastify.points; // Assuming points service is already registered
  if (!pointsService) {
    logger.warn('Points service not available. Achievement rewards may not work correctly.');
  }
  
  // Initialize repositories
  const achievementRepository = new AchievementRepository(db);
  const levelRepository = new LevelRepository(db);
  const badgeRepository = new BadgeRepository(db);
  const streakRepository = new StreakRepository(db);
  const challengeRepository = new ChallengeRepository(db);
  const leaderboardRepository = new LeaderboardRepository(db);
  
  // Initialize services
  const achievementService = new AchievementService(
    achievementRepository,
    pointsService || createFallbackPointsService(db),
    eventBus
  );
  
  const levelService = new LevelService(
    levelRepository,
    pointsService || createFallbackPointsService(db),
    eventBus
  );
  
  const badgeService = new BadgeService(
    badgeRepository,
    pointsService || createFallbackPointsService(db),
    eventBus
  );
  
  const streakService = new StreakService(
    streakRepository,
    pointsService || createFallbackPointsService(db),
    eventBus
  );
  
  const challengeService = new ChallengeService(
    challengeRepository,
    pointsService || createFallbackPointsService(db),
    eventBus
  );
  
  const leaderboardService = new LeaderboardService(
    leaderboardRepository,
    eventBus
  );
  
  // Register services with Fastify instance
  fastify.decorate('achievements', {
    achievementService,
    levelService,
    badgeService,
    streakService,
    challengeService,
    leaderboardService
  });
  
  // Log that services are initialized
  logger.info('Achievement and gamification services initialized');
}, {
  name: 'achievements',
  dependencies: ['database'], // Depend on database plugin
  fastify: '4.x',
});

/**
 * Create a fallback points service if the main one is not available
 * This is used only in development or testing when points service might not be registered
 */
function createFallbackPointsService(db: Pool): PointsService {
  logger.warn('Creating fallback points service for achievements');
  // This is a minimal implementation that won't actually award points
  // but will prevent errors when points service is not available
  return {
    awardPoints: async () => {
      logger.warn('Using fallback points service - no points will be awarded');
      return { success: true, amount: 0, total: 0 };
    }
  } as unknown as PointsService;
}
