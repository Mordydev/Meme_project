import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus'; // Removed EventHandler
import { achievementRepository, AchievementRepository } from '../../repositories/achievement-repository';
import { pointsService, EnhancedPointsService } from '../points'; // Assuming pointsService is the enhanced one
import { Achievement, UserAchievement } from '../../database/schema/achievements';

// Define the structure for achievement criteria checks
interface AchievementCriteriaChecker {
    type: string; // e.g., 'count', 'streak', 'milestone'
    check(eventData: any, userAchievement: UserAchievement | null, achievementDef: Achievement): Promise<{ progressIncrement: number; isComplete: boolean }>;
}

// Placeholder for event data types
interface PointsAwardedEvent { userId: string; source: string; amount: number; total: number; transactionId: string; }
interface ContentCreatedEvent { userId: string; contentId: string; contentType: string; }
// Add other relevant event types...

export class AchievementService {
    private achievementDefinitions: Map<string, Achievement> = new Map();
    private criteriaCheckers: Map<string, AchievementCriteriaChecker> = new Map(); // Map criteriaType to checker logic

    constructor(
        private repository: AchievementRepository,
        private eventBus: EventBus,
        private pointsService: EnhancedPointsService // Inject points service for awarding points
    ) {
        this.loadAchievementDefinitions();
        this.registerCriteriaCheckers();
        this.subscribeToEvents();
    }

    private async loadAchievementDefinitions(): Promise<void> {
        try {
            const enabledAchievements = await this.repository.findEnabledAchievements();
            this.achievementDefinitions.clear();
            enabledAchievements.forEach(ach => this.achievementDefinitions.set(ach.id, ach));
            logger.info(`Loaded ${this.achievementDefinitions.size} achievement definitions.`);
        } catch (error) {
            logger.error('Failed to load achievement definitions', { error });
            // Handle error appropriately - maybe retry or run in degraded mode?
        }
    }

    private registerCriteriaCheckers(): void {
        // TODO: Implement actual checker logic for each criteria type
        this.criteriaCheckers.set('count', { 
            type: 'count', 
            check: async (eventData, userAchievement, achievementDef) => { 
                logger.debug('Checking count achievement', { achievementId: achievementDef.id, eventData });
                // Example: Increment progress by 1 if event matches criteria
                const currentProgress = userAchievement?.progress ?? 0;
                const progressIncrement = 1; // Assume event matches
                const newProgress = currentProgress + progressIncrement;
                const isComplete = newProgress >= (achievementDef.criteriaThreshold ?? Infinity);
                return { progressIncrement, isComplete }; 
            } 
        });
        this.criteriaCheckers.set('streak', { type: 'streak', check: async () => ({ progressIncrement: 0, isComplete: false }) }); // Placeholder
        this.criteriaCheckers.set('milestone', { type: 'milestone', check: async () => ({ progressIncrement: 0, isComplete: false }) }); // Placeholder
        this.criteriaCheckers.set('collection', { type: 'collection', check: async () => ({ progressIncrement: 0, isComplete: false }) }); // Placeholder
        this.criteriaCheckers.set('one-time', { type: 'one-time', check: async () => ({ progressIncrement: 1, isComplete: true }) }); // Placeholder
        
        logger.info('Registered achievement criteria checkers.');
    }

    private subscribeToEvents(): void {
        // Subscribe to relevant events that can trigger achievement progress
        this.eventBus.subscribe(EventType.POINTS_AWARDED, this.handlePointsAwardedEvent.bind(this));
        this.eventBus.subscribe(EventType.CONTENT_CREATED, this.handleContentCreatedEvent.bind(this));
        // Add subscriptions for other events like USER_LOGIN, COMMENT_ADDED, REACTION_ADDED, etc.
        
        logger.info('Subscribed achievement service to relevant events.');
    }

    // --- Event Handlers ---

    private async handlePointsAwardedEvent(event: PointsAwardedEvent): Promise<void> {
        logger.debug('Handling PointsAwardedEvent for achievements', { userId: event.userId, source: event.source });
        await this.processEventForAchievements(event.userId, 'points_source', event);
        await this.processEventForAchievements(event.userId, 'points_total', event); // For milestone achievements based on total points
    }
    
    private async handleContentCreatedEvent(event: ContentCreatedEvent): Promise<void> {
         logger.debug('Handling ContentCreatedEvent for achievements', { userId: event.userId, contentType: event.contentType });
         await this.processEventForAchievements(event.userId, 'content_creation', event);
    }
    
    // Add handlers for other subscribed events...

    // --- Core Processing Logic ---

    private async processEventForAchievements(userId: string, eventTrigger: string, eventData: any): Promise<void> {
        for (const achievement of this.achievementDefinitions.values()) {
            // TODO: Add logic to determine if this achievement *cares* about this eventTrigger
            // This might involve checking achievement.criteriaType or a dedicated trigger field
            
            const checker = this.criteriaCheckers.get(achievement.criteriaType);
            if (!checker) {
                logger.warn(`No checker found for achievement criteria type: ${achievement.criteriaType}`, { achievementId: achievement.id });
                continue;
            }

            try {
                const userAchievement = await this.repository.findUserAchievement(userId, achievement.id);
                
                // Skip if already unlocked
                if (userAchievement?.isUnlocked) {
                    continue; 
                }

                const { progressIncrement, isComplete } = await checker.check(eventData, userAchievement, achievement);

                if (progressIncrement > 0 || isComplete) {
                    const updatedUserAchievement = await this.repository.upsertUserAchievementProgress(
                        userId, 
                        achievement.id, 
                        progressIncrement, 
                        isComplete,
                        isComplete ? new Date() : null // Set unlocked timestamp only if completing now
                    );

                    // Check if it was just unlocked
                    if (isComplete && !userAchievement?.isUnlocked) { // Ensure it wasn't already unlocked before this update
                        await this.handleAchievementUnlock(userId, achievement, updatedUserAchievement);
                    }
                }
            } catch (error) {
                logger.error('Error processing achievement progress', { userId, achievementId: achievement.id, eventTrigger, error });
            }
        }
    }

    private async handleAchievementUnlock(userId: string, achievement: Achievement, userAchievement: UserAchievement): Promise<void> {
        logger.info(`User ${userId} unlocked achievement: ${achievement.name}`, { achievementId: achievement.id });

        // 1. Award points (if any)
        if (achievement.pointsAwarded > 0) {
            try {
                await this.pointsService.awardPoints({
                    userId,
                    amount: achievement.pointsAwarded,
                    source: 'achievement',
                    referenceId: achievement.id,
                    description: `Unlocked achievement: ${achievement.name}`
                });
            } catch (error) {
                logger.error('Failed to award points for achievement unlock', { userId, achievementId: achievement.id, error });
                // Decide how to handle this - potentially retry or log for manual intervention
            }
        }

        // 2. Publish event
        await this.eventBus.publish(EventType.ACHIEVEMENT_UNLOCKED, {
            userId,
            achievementId: achievement.id,
            achievementName: achievement.name,
            pointsAwarded: achievement.pointsAwarded,
            timestamp: userAchievement.unlockedAt ?? new Date() // Use the actual unlock timestamp
        });

        // TODO: Mark notification status in userAchievements table if needed
    }

    // --- API Support Methods ---

    // TODO: Implement methods to support API endpoints
    
    async getAchievementsForApi(userId: string | null, filters: { category?: string; status?: 'locked' | 'unlocked' | 'in-progress' }): Promise<any[]> {
         logger.debug('getAchievementsForApi called', { userId, filters });
         // 1. Get all enabled achievement definitions
         // 2. If userId is provided, get all user achievement progress/status for that user
         // 3. Combine the data, calculate progress %, filter based on status
         // 4. Return formatted data
         return []; // Placeholder
    }

    async getUserAchievementsForApi(userId: string, status: 'unlocked' | 'in-progress'): Promise<any[]> {
         logger.debug('getUserAchievementsForApi called', { userId, status });
         // 1. Get user achievement records based on status
         // 2. Get corresponding achievement definitions
         // 3. Combine and format data
         return []; // Placeholder
    }
    
    async getRecentUnlocksForApi(userId: string, limit: number = 3): Promise<any[]> {
         logger.debug('getRecentUnlocksForApi called', { userId, limit });
         // 1. Get recent unlocks from repository
         // 2. Get corresponding achievement definitions
         // 3. Combine and format data
         return []; // Placeholder
    }
    
    async getAchievementSummaryForDashboard(userId: string): Promise<{ recentUnlocks: any[], topInProgress: any[] }> {
        logger.debug('getAchievementSummaryForDashboard called', { userId });
        // Placeholder - combine calls to repo/other methods
        const recentUnlocks = await this.getRecentUnlocksForApi(userId, 3); 
        const topInProgress: any[] = []; // TODO: Implement logic for top in-progress and add specific type
        return { recentUnlocks, topInProgress };
    }
}

// Export a singleton instance (or handle instantiation in services/index.ts)
// export const achievementService = new AchievementService(achievementRepository, eventBus, pointsService);
