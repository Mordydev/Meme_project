/**
 * Repository Plugin
 * 
 * Registers repositories as decorations on the Fastify instance
 */
import { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { Pool } from 'pg';
import { logger } from '../lib/logger';
import { db } from '../lib/db';

// Import repositories
import { UserRepository } from '../repositories/user-repository';
import { ProfileRepository } from '../repositories/profile-repository';
import { ContentRepository } from '../repositories/content-repository';
import { CommentRepository } from '../repositories/comment-repository';
import { UserPointsRepository } from '../repositories/user-points/user-points-repository';
import { WalletConnectionRepository } from '../repositories/wallet-connection-repository';
import { AchievementRepository } from '../repositories/achievement-repository';
import { OrganizationRepository } from '../repositories/organization-repository';
import { RoleRepository } from '../repositories/role-repository';
import { CategoryRepository } from '../repositories/category-repository';
import { TagRepository } from '../repositories/tag-repository';
import { ContentReportRepository } from '../repositories/content-report-repository';
import { MediaRepository, MediaPermissionRepository } from '../repositories/media';

// Declare custom types for Fastify instance
declare module 'fastify' {
  interface FastifyInstance {
    db: {
      pool: Pool;
      repositories: {
        users: UserRepository;
        profiles: ProfileRepository;
        content: ContentRepository;
        comments: CommentRepository;
        userPoints: UserPointsRepository;
        walletConnections: WalletConnectionRepository;
        achievements: AchievementRepository;
        organizations: OrganizationRepository;
        roles: RoleRepository;
        categories: CategoryRepository;
        tags: TagRepository;
        contentReports: ContentReportRepository;
        media: MediaRepository;
        mediaPermissions: MediaPermissionRepository;
      };
    };
  }
}

// Repository plugin
const repositoriesPlugin: FastifyPluginAsync = async (fastify) => {
  // Verify database connection
  const connected = await db.checkConnection();
  
  if (!connected) {
    logger.error('Failed to connect to database');
    throw new Error('Database connection failed');
  }
  
  // Initialize media repositories
  const mediaRepository = new MediaRepository(db.pool);
  const mediaPermissionRepository = new MediaPermissionRepository(db.pool);

  // Extend repositories with media repositories
  const allRepositories = {
    ...db.repositories,
    media: mediaRepository,
    mediaPermissions: mediaPermissionRepository
  };

  // Decorate fastify instance with database and repositories
  fastify.decorate('db', {
    pool: db.pool,
    repositories: allRepositories
  });
  
  // Add hook to close database connection on server close
  fastify.addHook('onClose', async () => {
    logger.info('Closing database connections');
    await db.close();
  });
  
  // Register health check route
  fastify.get('/health/db', async () => {
    const isConnected = await db.checkConnection();
    
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    const stats = await db.getPoolStats();
    
    return {
      status: 'ok',
      database: stats
    };
  });
};

export default fastifyPlugin(repositoriesPlugin);
