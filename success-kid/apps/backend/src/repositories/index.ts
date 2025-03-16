/**
 * Repositories Index
 * 
 * This file exports all repository implementations.
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { UserRepository } from './user-repository';
import { ProfileRepository } from './profile-repository';
import { PointsRepository } from './points-repository';
import { AchievementRepository } from './achievement-repository';

// Re-export repository classes
export * from './base-repository';
export * from './user-repository';
export * from './profile-repository';
export * from './points-repository';
export * from './achievement-repository';

/**
 * Repository factory - creates and provides all repositories
 */
export class Repositories {
  private readonly userRepository: UserRepository;
  private readonly profileRepository: ProfileRepository;
  private readonly pointsRepository: PointsRepository;
  private readonly achievementRepository: AchievementRepository;
  
  /**
   * Create repository factory
   * 
   * @param db Database connection pool
   */
  constructor(private readonly db: Pool) {
    this.userRepository = new UserRepository(db);
    this.profileRepository = new ProfileRepository(db);
    this.pointsRepository = new PointsRepository(db);
    this.achievementRepository = new AchievementRepository(db);
  }
  
  /**
   * Get user repository
   */
  get users(): UserRepository {
    return this.userRepository;
  }
  
  /**
   * Get profile repository
   */
  get profiles(): ProfileRepository {
    return this.profileRepository;
  }
  
  /**
   * Get points repository
   */
  get points(): PointsRepository {
    return this.pointsRepository;
  }
  
  /**
   * Get achievement repository
   */
  get achievements(): AchievementRepository {
    return this.achievementRepository;
  }
  
  /**
   * Create a custom repository for a specific entity
   * 
   * @param repositoryClass Repository class to instantiate
   * @returns Repository instance
   */
  create<T, R extends BaseRepository<T>>(repositoryClass: new (db: Pool) => R): R {
    return new repositoryClass(this.db);
  }
}

/**
 * Create the repositories factory
 * 
 * @param db Database connection pool
 * @returns Repositories factory
 */
export function createRepositories(db: Pool): Repositories {
  return new Repositories(db);
}

export default createRepositories;
