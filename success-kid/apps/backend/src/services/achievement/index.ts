/**
 * Achievement Services Index
 * 
 * Exports all achievement-related services and initializes them with dependencies.
 */
import { Pool } from 'pg';
import { EventBus } from '../../lib/event-bus';
import { 
  createAchievementRepositories, 
  AchievementRepository,
  LevelRepository,
  StreakRepository,
  BadgeRepository,
  ChallengeRepository,
  LeaderboardRepository
} from '../../repositories/achievement';
import { EnhancedPointsService } from '../points/points-service-enhanced';
import { AchievementService } from './achievement-service';
import { LevelService } from './level-service';
import { StreakService } from './streak-service';
import { BadgeService } from './badge-service';
import { ChallengeService } from './challenge-service';
import { LeaderboardService } from './leaderboard-service';

// Services export interface
export interface AchievementServices {
  achievementService: AchievementService;
  levelService: LevelService;
  streakService: StreakService;
  badgeService: BadgeService;
  challengeService: ChallengeService;
  leaderboardService: LeaderboardService;
}

/**
 * Initialize achievement services with dependencies
 * 
 * @param db Database connection
 * @param eventBus Event bus for event handling
 * @param pointsService Points service for rewards
 * @returns Object containing all achievement services
 */
export function initializeAchievementServices(
  db: Pool,
  eventBus: EventBus,
  pointsService: EnhancedPointsService
): AchievementServices {
  // Initialize repositories
  const repositories = createAchievementRepositories(db);
  
  // Initialize services with dependencies
  const achievementService = new AchievementService(
    repositories.achievementRepository,
    pointsService,
    eventBus
  );
  
  const levelService = new LevelService(
    repositories.levelRepository,
    pointsService,
    eventBus
  );
  
  const streakService = new StreakService(
    repositories.streakRepository,
    pointsService,
    eventBus
  );
  
  const badgeService = new BadgeService(
    repositories.badgeRepository,
    pointsService,
    eventBus
  );
  
  const leaderboardService = new LeaderboardService(
    repositories.leaderboardRepository,
    eventBus
  );
  
  // Challenge service depends on other services
  const challengeService = new ChallengeService(
    repositories.challengeRepository,
    pointsService,
    badgeService,
    levelService,
    eventBus
  );
  
  return {
    achievementService,
    levelService,
    streakService,
    badgeService,
    challengeService,
    leaderboardService
  };
}

// Re-export service classes
export {
  AchievementService,
  LevelService,
  StreakService,
  BadgeService,
  ChallengeService,
  LeaderboardService
};
