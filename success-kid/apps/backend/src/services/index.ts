/**
 * Services Module
 * 
 * Export and initialize all application services
 */
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { AuthService } from './auth-service';
import { ProfileService } from './profile-service';
import { SessionService } from './session-service';
import { UserService } from './user-service';
import { PointsService } from './points/points-service';
import { TokenTransferService } from './blockchain/token-transfer-service';
import { BlockchainProviderFactory } from './blockchain/providers/blockchain-provider-factory';
import { AuditService } from './audit/audit-service';

// Import real-time and notification services
import { NotificationService, NotificationTemplateService, NotificationPreferencesService, EmailNotificationService, PushNotificationService } from './notifications';
import { ActivityService } from './activity';
import { PresenceService } from './presence';
import { WebSocketService } from '../websockets/websocket-service';

// Import content services
import { ContentService } from './content/content-service';
import { ForumService } from './content/forum-service';
import { SearchService } from './content/search-service';

// Import leaderboard service
import { LeaderboardService } from './leaderboards/leaderboard-service';

// Import repositories
import { RepositoryFactory } from '../repositories/repository-factory';
import { FeedRepository } from '../repositories/feed-repository';
import { eventBus } from '../lib/event-bus';

export interface ServiceContainer {
  authService: AuthService;
  profileService: ProfileService;
  sessionService: SessionService;
  userService: UserService;
  pointsService: PointsService;
  blockchainService: TokenTransferService;
  auditService: AuditService;
  
  // Real-time and notification services
  notificationService: NotificationService;
  notificationTemplateService: NotificationTemplateService;
  notificationPreferencesService: NotificationPreferencesService;
  activityService: ActivityService;
  presenceService: PresenceService;
  webSocketService: WebSocketService;
  
  // Content services
  contentService: ContentService;
  forumService: ForumService;
  searchService: SearchService;
  
  // Leaderboard service
  leaderboardService: LeaderboardService;
}

/**
 * Create and initialize all application services
 * 
 * @param db - PostgreSQL database connection pool
 * @param redis - Redis connection
 * @returns Container with all initialized services
 */
export function createServiceContainer(
  db: Pool,
  redis: Redis,
  repoFactory: RepositoryFactory
): ServiceContainer {
  // Initialize repositories
  const userRepository = repoFactory.getUserRepository();
  const profileRepository = repoFactory.getProfileRepository();
  const userPointsRepository = repoFactory.getUserPointsRepository();
  const walletConnectionRepository = repoFactory.getWalletConnectionRepository();
  const redemptionRepository = repoFactory.getRedemptionRepository();
  
  // Initialize repositories for real-time and notification services
  const notificationRepository = repoFactory.getNotificationRepository();
  const notificationTemplateRepository = repoFactory.getNotificationTemplateRepository();
  const notificationPreferencesRepository = repoFactory.getNotificationPreferencesRepository();
  const activityRepository = repoFactory.getActivityRepository();
  const presenceRepository = repoFactory.getPresenceRepository();
  
  // Initialize repositories for content services
  const contentRepository = repoFactory.getContentRepository();
  const commentRepository = repoFactory.getCommentRepository();
  const categoryRepository = repoFactory.getCategoryRepository();
  const tagRepository = repoFactory.getTagRepository();
  const contentReportRepository = repoFactory.getContentReportRepository();
  const leaderboardRepository = repoFactory.getLeaderboardRepository();
  
  // Initialize blockchain services
  const providerFactory = new BlockchainProviderFactory(
    process.env.BLOCKCHAIN_PROVIDER_URLS?.split(',') || [],
    process.env.TOKEN_ADDRESS || '',
    process.env.TREASURY_PRIVATE_KEY || ''
  );
  
  const blockchainService = new TokenTransferService(
    providerFactory,
    {
      treasuryAddress: process.env.TREASURY_ADDRESS || '',
      tokenAddress: process.env.TOKEN_ADDRESS || '',
      tokenDecimals: parseInt(process.env.TOKEN_DECIMALS || '9', 10),
      minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || '1', 10),
      gasMultiplier: parseFloat(process.env.GAS_MULTIPLIER || '1.1'),
      providerUrls: process.env.BLOCKCHAIN_PROVIDER_URLS?.split(',') || [],
      blockExplorerUrl: process.env.BLOCK_EXPLORER_URL || '',
      waitTimeoutMs: parseInt(process.env.TRANSACTION_WAIT_TIMEOUT || '60000', 10)
    }
  );
  
  // Initialize services
  const authService = new AuthService(userRepository, redis);
  const profileService = new ProfileService(profileRepository);
  const sessionService = new SessionService(redis);
  const userService = new UserService(userRepository, profileRepository);
  
  const pointsService = new PointsService(
    userPointsRepository,
    walletConnectionRepository,
    redemptionRepository,
    {
      dailyLimits: {
        content_creation: parseInt(process.env.POINTS_LIMIT_CONTENT_CREATION || '200', 10),
        comment: parseInt(process.env.POINTS_LIMIT_COMMENT || '150', 10),
        upvote_received: parseInt(process.env.POINTS_LIMIT_UPVOTE || '100', 10),
        daily_login: parseInt(process.env.POINTS_LIMIT_LOGIN || '20', 10),
        achievement: parseInt(process.env.POINTS_LIMIT_ACHIEVEMENT || '1000', 10),
        referral: parseInt(process.env.POINTS_LIMIT_REFERRAL || '500', 10),
        profile_completion: parseInt(process.env.POINTS_LIMIT_PROFILE || '100', 10),
        wallet_connection: parseInt(process.env.POINTS_LIMIT_WALLET || '50', 10),
        streak_bonus: parseInt(process.env.POINTS_LIMIT_STREAK || '100', 10),
        transfer_in: 0,
        transfer_out: 0,
        redemption: 0,
        special_event: parseInt(process.env.POINTS_LIMIT_EVENT || '500', 10),
        admin_adjustment: 0
      },
      defaultDailyLimit: parseInt(process.env.POINTS_DEFAULT_LIMIT || '100', 10),
      weeklyRedemptionCap: parseInt(process.env.WEEKLY_REDEMPTION_CAP || '10000', 10),
      minimumRedemptionAmount: parseInt(process.env.MIN_REDEMPTION_AMOUNT || '1000', 10),
      conversionRate: parseInt(process.env.POINTS_TO_TOKEN_RATE || '100', 10)
    }
  );
  
  // Initialize audit service
  const auditService = new AuditService(
    db,
    redemptionRepository,
    userPointsRepository,
    blockchainService
  );
  
  // Initialize WebSocket service
  const webSocketService = new WebSocketService(db, eventBus);
  
  // Initialize real-time and notification services
  const notificationTemplateService = new NotificationTemplateService(notificationTemplateRepository);
  
  const emailNotificationService = new EmailNotificationService({
    apiKey: process.env.EMAIL_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM_ADDRESS || 'notifications@successkid.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Success Kid',
    replyToEmail: process.env.EMAIL_REPLY_TO || 'no-reply@successkid.com'
  });
  
  const pushNotificationService = new PushNotificationService({
    apiKey: process.env.PUSH_API_KEY || '',
    appId: process.env.PUSH_APP_ID || '',
    vapidKey: process.env.PUSH_VAPID_KEY
  });
  
  const notificationPreferencesService = new NotificationPreferencesService(
    notificationPreferencesRepository
  );
  
  const notificationService = new NotificationService(
    notificationRepository,
    notificationPreferencesRepository,
    notificationTemplateService,
    emailNotificationService,
    pushNotificationService,
    webSocketService,
    userRepository
  );
  
  const activityService = new ActivityService(activityRepository);
  
  const presenceService = new PresenceService(presenceRepository, webSocketService);
  
  // Initialize content services
  const contentService = new ContentService(
    contentRepository,
    commentRepository,
    categoryRepository,
    tagRepository,
    contentReportRepository,
    pointsService
  );
  
  // Create feed repository
  const feedRepository = new FeedRepository(db);
  
  // Initialize forum service
  const forumService = new ForumService(
    categoryRepository,
    contentRepository,
    commentRepository,
    feedRepository,
    pointsService
  );
  
  // Initialize search service
  const searchService = new SearchService(
    db,
    contentRepository,
    userRepository,
    categoryRepository,
    tagRepository,
    commentRepository
  );
  
  // Initialize leaderboard service
  const leaderboardService = new LeaderboardService(
    leaderboardRepository,
    userRepository,
    userPointsRepository,
    contentRepository,
    commentRepository
  );
  
  return {
    authService,
    profileService,
    sessionService,
    userService,
    pointsService,
    blockchainService,
    auditService,
    
    // Real-time and notification services
    notificationService,
    notificationTemplateService,
    notificationPreferencesService,
    activityService,
    presenceService,
    webSocketService,
    
    // Content services
    contentService,
    forumService,
    searchService,
    
    // Leaderboard service
    leaderboardService
  };
}
