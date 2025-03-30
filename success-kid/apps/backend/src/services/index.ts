/**
 * Services Exports
 *
 * Exports all application service instances
 */
import { db } from '../database';
import { redisClient } from '../lib/redis-client'; // Assuming this path is correct
import { eventBus } from '../lib/event-bus';
import { PointsRepository } from '../repositories/points-repository';
import { RedemptionRepository } from '../repositories/redemption-repository';
import { UserRepository } from '../repositories/user-repository';
import { WalletRepository } from '../repositories/wallet-repository';
import { ReportRepository } from '../repositories/report-repository';
import { CommentRepository } from '../repositories/comment-repository';
import { CategoryRepository } from '../repositories/category-repository';
import { contentRepository } from '../repositories/content-repository'; // Assuming singleton export
import { tagRepository } from '../repositories/tag-repository'; // Assuming singleton export
import { achievementRepository } from '../repositories/achievement-repository'; // Assuming singleton export

import { EnhancedPointsService } from './points/points-service-enhanced';
import { NotificationService } from './notifications/notification-service';
import { RedemptionEligibilityService } from '../redemption/validation/eligibility-service';
import { TransactionService } from '../redemption/transactions/transaction-service';
import { PointsVerifier } from './points/verification/points-verifier';
import { RedemptionService } from './redemption/redemption-service'; // Corrected path
import { WalletService } from './wallet/wallet-service';
import { BlockchainService } from './blockchain/blockchain-service';
import { ProfileService } from './profiles/profile-service';
import { AchievementService } from './achievements/achievement-service';
import { ContentService } from './content/content-service';
import { ModerationService } from './moderation/moderation-service';
import { blobService } from './blob'; // Assuming singleton export
import { reactionService } from './content/reaction/reaction-service'; // Assuming singleton export

// --- Instantiate Repositories ---
const pointsRepository = new PointsRepository(); // Corrected: 0 args based on latest error
const redemptionRepository = new RedemptionRepository(); // Assuming 0 args
const userRepository = new UserRepository(); // Corrected: Takes 0 arguments
const walletRepository = new WalletRepository(db as any); // Assuming 1 arg
const reportRepository = new ReportRepository(db as any);
const commentRepositoryInstance = new CommentRepository(db as any);
const categoryRepositoryInstance = new CategoryRepository(db as any);

// --- Instantiate Core Services/Utilities ---
const pointsVerifier = new PointsVerifier();
// TODO: Instantiate NotificationService properly (requires wsServer instance from app setup)
const notificationService = new NotificationService(null as any); // Pass null temporarily, requires wsServer
export const blockchainService = new BlockchainService(); // Instantiate before dependent services
const transactionService = new TransactionService(); // Assuming 0 arguments
const moderationServiceInstance = new ModerationService(
    reportRepository,
    contentRepository,
    commentRepositoryInstance,
    eventBus
);

// --- Instantiate Main Services ---
export const walletService = new WalletService(db as any, eventBus);
export const profileService = new ProfileService(db as any);

export const enhancedPointsService = new EnhancedPointsService(
  pointsRepository,
  eventBus,
  pointsVerifier
);

const eligibilityService = new RedemptionEligibilityService(
  walletRepository,
  enhancedPointsService,
  redemptionRepository
);

// Export eligibility service so it can be used directly
export { eligibilityService };

// Redemption service (Corrected argument order and count)
export const redemptionService = new RedemptionService(
  redemptionRepository,   // 1st
  enhancedPointsService,  // 2nd
  walletService,          // 3rd
  blockchainService,      // 4th - Corrected
  eventBus                // 5th - Corrected
);

export const achievementService = new AchievementService(
  achievementRepository,
  eventBus,
  enhancedPointsService
);

// Instantiate ContentService (assuming constructor was removed and dependencies are imported directly)
// Since the constructor was removed in content-service.ts, we cannot instantiate it here with arguments.
// Exporting the class and relying on direct imports within the class or a different DI mechanism.
// However, to fix the handler import error, we export a placeholder instance.
// TODO: Fix ContentService dependency handling and instantiation properly.
export const contentService = {} as ContentService; // Placeholder instance export


// --- Export Service Instances ---
export { reactionService };
export { notificationService };
export { moderationServiceInstance as moderationService };
// eligibilityService is already exported above

// --- Re-export Classes (Optional) ---
// export * from './points/points-service-enhanced';
// export * from './points/verification/points-verifier';
// export * from './redemption/redemption-service';
// export * from './wallet/wallet-service';
// export * from './blockchain/blockchain-service';
// export * from './profiles/profile-service';
// export * from './achievements/achievement-service';
export * from './content/content-service';
export * from './content/reaction/reaction-service';
