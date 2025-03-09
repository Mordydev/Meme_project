import { FastifyInstance } from 'fastify';
import { ProfileRepository } from './profile-repository';
import { AchievementRepository } from './achievement-repository';
import { BattleRepository } from './battle-repository';
import { EntryRepository } from './entry-repository';
import { ContentRepository } from './content-repository';
import { CommentRepository } from './comment-repository';
import { TokenRepository } from './token-repository';
import { NotificationRepository } from './notification-repository';
import { WalletRepository } from './wallet-repository';
import { AuditRepository } from './audit-repository';

/**
 * Container for all repositories
 */
export interface RepositoryContainer {
  profileRepository: ProfileRepository;
  achievementRepository: AchievementRepository;
  battleRepository: BattleRepository;
  entryRepository: EntryRepository;
  contentRepository: ContentRepository;
  commentRepository: CommentRepository;
  tokenRepository: TokenRepository;
  notificationRepository: NotificationRepository;
  walletRepository: WalletRepository;
  auditRepository: AuditRepository;
}

/**
 * Create all repositories with database connection
 */
export function createRepositories(fastify: FastifyInstance): RepositoryContainer {
  return {
    profileRepository: new ProfileRepository(fastify),
    achievementRepository: new AchievementRepository(fastify),
    battleRepository: new BattleRepository(fastify),
    entryRepository: new EntryRepository(fastify),
    contentRepository: new ContentRepository(fastify),
    commentRepository: new CommentRepository(fastify),
    tokenRepository: new TokenRepository(fastify),
    notificationRepository: new NotificationRepository(fastify),
    walletRepository: new WalletRepository(fastify),
    auditRepository: new AuditRepository(fastify),
  };
}
