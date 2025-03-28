/**
 * Achievement Repositories Index
 * 
 * Exports all achievement-related repositories
 */
import { Pool } from 'pg';
import { AchievementRepository } from './achievement-repository';
import { LevelRepository } from './level-repository';
import { StreakRepository } from './streak-repository';
import { BadgeRepository } from './badge-repository';
import { ChallengeRepository } from './challenge-repository';
import { LeaderboardRepository } from './leaderboard-repository';

/**
 * Create and export all achievement repositories
 * 
 * @param db Database connection pool
 * @returns Object containing all achievement repositories
 */
export function createAchievementRepositories(db: Pool) {
  return {
    achievementRepository: new AchievementRepository(db),
    levelRepository: new LevelRepository(db),
    streakRepository: new StreakRepository(db),
    badgeRepository: new BadgeRepository(db),
    challengeRepository: new ChallengeRepository(db),
    leaderboardRepository: new LeaderboardRepository(db)
  };
}

// Re-export repository classes
export { 
  AchievementRepository,
  LevelRepository,
  StreakRepository,
  BadgeRepository,
  ChallengeRepository,
  LeaderboardRepository
};
