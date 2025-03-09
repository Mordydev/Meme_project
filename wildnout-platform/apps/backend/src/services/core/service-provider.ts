import { FastifyInstance } from 'fastify';
import { EventEmitter } from '../../lib/events';
import { TransactionManager } from '../../lib/transaction';
import { createRepositories, RepositoryContainer } from '../../repositories/repository-provider';
import { ProfileService } from '../profile-service';
import { UserService } from '../user-service';
import { AchievementService } from '../achievement-service';
import { BattleService } from '../battle-service';
import { ContentService } from '../content-service';
import { TokenService } from '../token-service';
import { NotificationService } from '../notification-service';
import { TagService } from '../tag-service';
import { MediaService } from '../media-service';
import { AIModerationService } from '../ai-moderation-service';
import { ModerationService } from '../moderation-service';
import { BlockchainService } from '../blockchain-service';
import { WalletService } from '../wallet-service';
import { PointsService } from '../points-service';
import { LeaderboardService } from '../leaderboard-service';
import { ContentValidator } from '../../validators/content-validator';
import { ModerationRepository } from '../../repositories/moderation-repository';
import { SocialRepository } from '../../repositories/social-repository';
import { FeedRepository } from '../../repositories/feed-repository';
import { InterestRepository } from '../../repositories/interest-repository';
import { SocialService } from '../social-service';
import { CommentService } from '../comment-service';
import { FeedService } from '../feed-service';
import { CacheService } from './cache-service';
import { AuditService } from './audit-service';
import { DataProtectionService } from './data-protection-service';
import { MetricsService } from './metrics-service';

/**
 * Container for all application services
 */
export interface ServiceContainer {
  // Core infrastructure
  repositories: RepositoryContainer;
  eventEmitter: EventEmitter;
  transactionManager: TransactionManager;
  cacheService: CacheService;
  auditService: AuditService;
  dataProtectionService: DataProtectionService;
  metricsService: MetricsService;
  
  // Validators
  contentValidator: ContentValidator;
  
  // Business services
  profileService: ProfileService;
  userService: UserService;
  achievementService: AchievementService;
  battleService: BattleService;
  contentService: ContentService;
  tokenService: TokenService;
  walletService: WalletService;
  blockchainService: BlockchainService;
  notificationService: NotificationService;
  tagService: TagService;
  mediaService: MediaService;
  aiModerationService: AIModerationService;
  moderationService: ModerationService;
  
  // Blockchain services
  blockchainService: BlockchainService;
  walletService: WalletService;
  
  // Social services
  socialService: SocialService;
  commentService: CommentService;
  feedService: FeedService;

  // Gamification services
  pointsService: PointsService;
  leaderboardService: LeaderboardService;
}

/**
 * Create all application services and inject dependencies
 */
export function createServices(fastify: FastifyInstance): ServiceContainer {
  // Create repositories
  const repositories = createRepositories(fastify);
  const eventEmitter = new EventEmitter();
  const transactionManager = new TransactionManager(fastify);
  
  // Create validators
  const contentValidator = new ContentValidator();
  
  // Create optional repositories that might not be in the main container
  const moderationRepository = new ModerationRepository(fastify);
  const socialRepository = new SocialRepository(fastify);
  const feedRepository = new FeedRepository(fastify);
  const interestRepository = new InterestRepository(fastify);
  
  // Create cache service
  const cacheService = new CacheService(fastify);
  
  // Create audit service
  const auditService = new AuditService(fastify, fastify.log);
  
  // Create data protection service
  const dataProtectionService = new DataProtectionService(fastify);
  
  // Create metrics service
  const metricsService = new MetricsService({ fastify, logger: fastify.log });
  
  // Decorate fastify instance with metrics service
  fastify.decorate('metrics', metricsService);
  
  // Create utility services
  const tagService = new TagService(fastify);
  const mediaService = new MediaService(fastify);
  const aiModerationService = new AIModerationService(fastify);
  
  // Create user service
  const userService = new UserService(
    repositories.profileRepository,
    eventEmitter,
    fastify.clerk,
    cacheService
  );
  
  // Create profile service
  const profileService = new ProfileService(
    repositories.profileRepository,
    repositories.achievementRepository,
    eventEmitter
  );
  
  const achievementService = new AchievementService(
    repositories.achievementRepository,
    eventEmitter,
    transactionManager
  );
  
  const battleService = new BattleService(
    repositories.battleRepository,
    repositories.entryRepository,
    eventEmitter
  );
  
  const contentService = new ContentService(
    repositories.contentRepository,
    repositories.commentRepository,
    eventEmitter,
    tagService,
    transactionManager,
    contentValidator
  );
  
  // Create blockchain services
  const blockchainService = new BlockchainService(fastify.log);
  
  const tokenService = new TokenService(
    repositories.tokenRepository,
    repositories.walletRepository,
    blockchainService,
    eventEmitter,
    fastify.log
  );
  
  const walletService = new WalletService(
    repositories.walletRepository,
    blockchainService,
    tokenService,
    auditService,
    eventEmitter,
    fastify.log
  );
  
  const notificationService = new NotificationService(
    repositories.notificationRepository,
    eventEmitter
  );
  
  const moderationService = new ModerationService(
    fastify,
    repositories.contentRepository,
    moderationRepository,
    aiModerationService,
    eventEmitter
  );
  
  // Create social services
  const commentService = new CommentService(
    repositories.commentRepository,
    repositories.contentRepository,
    notificationService,
    eventEmitter,
    transactionManager
  );
  
  const socialService = new SocialService(
    socialRepository,
    repositories.contentRepository,
    repositories.commentRepository,
    notificationService,
    eventEmitter,
    transactionManager
  );
  
  const feedService = new FeedService(
    feedRepository,
    interestRepository,
    socialRepository,
    eventEmitter,
    transactionManager,
    cacheService
  );
  
  // Create points service
  const pointsService = new PointsService(
    repositories.pointsRepository,
    eventEmitter,
    transactionManager
  );
  
  // Create leaderboard service
  const leaderboardService = new LeaderboardService(
    repositories.leaderboardRepository,
    cacheService
  );
  
  // Initialize event handlers for cross-service interactions
  initializeEventHandlers({
    userService,
    profileService,
    achievementService,
    battleService,
    contentService,
    tokenService,
    notificationService,
    moderationService,
    socialService,
    commentService,
    feedService,
    pointsService
  });
  
  return {
    // Core infrastructure
    repositories,
    eventEmitter,
    transactionManager,
    cacheService,
    auditService,
    dataProtectionService,
    metricsService,
    
    // Validators
    contentValidator,
    
    // Business services
    profileService,
    userService,
    achievementService,
    battleService,
    contentService,
    tokenService,
    notificationService,
    tagService,
    mediaService,
    aiModerationService,
    moderationService,
    
    // Blockchain services
    blockchainService,
    walletService,
    
    // Social services
    socialService,
    commentService,
    feedService,
    pointsService,
    leaderboardService
  };
}

/**
 * Initialize event handlers for service-to-service communication
 */
function initializeEventHandlers(services: {
  userService: UserService;
  profileService: ProfileService;
  achievementService: AchievementService;
  battleService: BattleService;
  contentService: ContentService;
  tokenService: TokenService;
  notificationService: NotificationService;
  moderationService: ModerationService;
  socialService: SocialService;
  commentService: CommentService;
  feedService: FeedService;
  pointsService: PointsService;
}) {
  // Register user service event handlers
  services.userService.registerEventHandlers();
  
  // Register achievement service event handlers
  services.achievementService.registerEventHandlers();
  
  // Register notification service event handlers
  services.notificationService.registerEventHandlers();
  
  // Register profile service event handlers
  services.profileService.registerEventHandlers();
  
  // Register battle service event handlers
  services.battleService.registerEventHandlers();
  
  // Register content service event handlers
  services.contentService.registerEventHandlers();
  
  // Register social service event handlers
  services.socialService.registerEventHandlers();
  
  // Register comment service event handlers
  services.commentService.registerEventHandlers();
  
  // Register feed service event handlers
  services.feedService.registerEventHandlers();
  
  // Register points service event handlers
  services.pointsService.registerEventHandlers();
}
