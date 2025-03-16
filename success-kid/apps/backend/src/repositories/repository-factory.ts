/**
 * Repository Factory
 * 
 * Creates repository instances for use in services, API routes, and tests
 */
import { Pool } from 'pg';
import { UserRepository } from './user-repository';
import { ProfileRepository } from './profile-repository';
import { ContentRepository } from './content-repository';
import { CommentRepository } from './comment-repository';
import { UserPointsRepository } from './user-points/user-points-repository';
import { WalletConnectionRepository } from './wallet-connection-repository';
import { AchievementRepository } from './achievement-repository';
import { OrganizationRepository } from './organization-repository';
import { RoleRepository } from './role-repository';

export interface RepositoryFactoryOptions {
  pool: Pool;
}

export class RepositoryFactory {
  private pool: Pool;
  
  // Cached repository instances
  private repositories = {
    user: null as UserRepository | null,
    profile: null as ProfileRepository | null,
    content: null as ContentRepository | null,
    comment: null as CommentRepository | null,
    userPoints: null as UserPointsRepository | null,
    walletConnection: null as WalletConnectionRepository | null,
    achievement: null as AchievementRepository | null,
    organization: null as OrganizationRepository | null,
    role: null as RoleRepository | null
  };
  
  constructor(options: RepositoryFactoryOptions) {
    this.pool = options.pool;
  }
  
  /**
   * Get user repository instance
   */
  getUserRepository(): UserRepository {
    if (!this.repositories.user) {
      this.repositories.user = new UserRepository(this.pool);
    }
    return this.repositories.user;
  }
  
  /**
   * Get profile repository instance
   */
  getProfileRepository(): ProfileRepository {
    if (!this.repositories.profile) {
      this.repositories.profile = new ProfileRepository(this.pool);
    }
    return this.repositories.profile;
  }
  
  /**
   * Get content repository instance
   */
  getContentRepository(): ContentRepository {
    if (!this.repositories.content) {
      this.repositories.content = new ContentRepository(this.pool);
    }
    return this.repositories.content;
  }
  
  /**
   * Get comment repository instance
   */
  getCommentRepository(): CommentRepository {
    if (!this.repositories.comment) {
      this.repositories.comment = new CommentRepository(this.pool);
    }
    return this.repositories.comment;
  }
  
  /**
   * Get user points repository instance
   */
  getUserPointsRepository(): UserPointsRepository {
    if (!this.repositories.userPoints) {
      this.repositories.userPoints = new UserPointsRepository(this.pool);
    }
    return this.repositories.userPoints;
  }
  
  /**
   * Get wallet connection repository instance
   */
  getWalletConnectionRepository(): WalletConnectionRepository {
    if (!this.repositories.walletConnection) {
      this.repositories.walletConnection = new WalletConnectionRepository(this.pool);
    }
    return this.repositories.walletConnection;
  }
  
  /**
   * Get achievement repository instance
   */
  getAchievementRepository(): AchievementRepository {
    if (!this.repositories.achievement) {
      this.repositories.achievement = new AchievementRepository(this.pool);
    }
    return this.repositories.achievement;
  }
  
  /**
   * Get organization repository instance
   */
  getOrganizationRepository(): OrganizationRepository {
    if (!this.repositories.organization) {
      this.repositories.organization = new OrganizationRepository(this.pool);
    }
    return this.repositories.organization;
  }
  
  /**
   * Get role repository instance
   */
  getRoleRepository(): RoleRepository {
    if (!this.repositories.role) {
      this.repositories.role = new RoleRepository(this.pool);
    }
    return this.repositories.role;
  }
  
  /**
   * Clear all cached repository instances
   */
  clearCache(): void {
    this.repositories = {
      user: null,
      profile: null,
      content: null,
      comment: null,
      userPoints: null,
      walletConnection: null,
      achievement: null,
      organization: null,
      role: null
    };
  }
}

// Create singleton instance
let repositoryFactory: RepositoryFactory | null = null;

/**
 * Get repository factory instance
 */
export function getRepositoryFactory(pool: Pool): RepositoryFactory {
  if (!repositoryFactory) {
    repositoryFactory = new RepositoryFactory({ pool });
  }
  return repositoryFactory;
}
