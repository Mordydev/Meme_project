import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { achievementRepository, AchievementRepository } from '../../repositories/achievement-repository';
import { pointsService, EnhancedPointsService } from '../points';
import { Achievement, UserAchievement } from '../../database/schema/achievements';
import { AchievementCriteriaEvaluator, getCurrentProgress } from './criteria/evaluator'; // Import base interface AND helper
import { CountEvaluator } from './criteria/count-evaluator';
import { StreakEvaluator } from './criteria/streak-evaluator';
import { CollectionEvaluator } from './criteria/collection-evaluator';
import { OneTimeEvaluator } from './criteria/one-time-evaluator';
import { inArray } from 'drizzle-orm'; // Import inArray for repository filtering

// Placeholder for event data types
interface PointsAwardedEvent { userId: string; source: string; amount: number; total: number; transactionId: string; }
interface ContentCreatedEvent { userId: string; contentId: string; contentType: string; category?: string; } // Added optional category
// Add other relevant event types...

export class AchievementService {
    private achievementDefinitions: Map<string, Achievement> = new Map();
    // Use the imported interface and map criteriaType string to the evaluator instance
    private criteriaCheckers: Map<string, AchievementCriteriaEvaluator> = new Map();

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
        // Instantiate and register the imported evaluators
        this.criteriaCheckers.set('count', new CountEvaluator());
        this.criteriaCheckers.set('streak', new StreakEvaluator()); // Placeholder logic inside
        this.criteriaCheckers.set('collection', new CollectionEvaluator()); // Placeholder logic inside
        this.criteriaCheckers.set('one-time', new OneTimeEvaluator());
        // TODO: Add 'milestone' evaluator if needed, or handle milestone achievements differently (e.g., via specific events)

        logger.info(`Registered ${this.criteriaCheckers.size} achievement criteria checkers.`);
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
        // Pass specific trigger strings
        await this.processEventForAchievements(event.userId, `points_awarded:${event.source}`, event); // Use event.userId
        await this.processEventForAchievements(event.userId, 'points_total', event); // Use event.userId
    }

    private async handleContentCreatedEvent(event: ContentCreatedEvent): Promise<void> {
         logger.debug('Handling ContentCreatedEvent for achievements', { userId: event.userId, contentType: event.contentType });
         // Pass specific trigger strings
         await this.processEventForAchievements(event.userId, `content_created:${event.contentType}`, event); // Use event.userId
         await this.processEventForAchievements(event.userId, 'content_created', event); // Use event.userId
         if (event.category) {
            await this.processEventForAchievements(event.userId, `content_created_category:${event.category}`, event); // Use event.userId
         }
    }

    // Add handlers for other subscribed events...

    // --- Core Processing Logic ---

    private async processEventForAchievements(userId: string, eventTrigger: string, eventData: any): Promise<void> {
        logger.debug(`Processing event trigger '${eventTrigger}' for user ${userId}`, { eventData });
        for (const achievement of this.achievementDefinitions.values()) {

            // Basic filtering: Check if the achievement might be relevant for this event trigger
            if (!this.doesAchievementCareAboutEvent(achievement, eventTrigger)) {
                continue; // Skip this achievement if the event is not relevant
            }

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

    /**
     * Basic check to see if an achievement might be relevant for a given event trigger.
     * This is a placeholder and should be replaced with more specific logic based on achievement definitions.
     * @param achievement The achievement definition.
     * @param eventTrigger The trigger string from the event handler.
     * @returns True if the achievement might be relevant, false otherwise.
     */
    private doesAchievementCareAboutEvent(achievement: Achievement, eventTrigger: string): boolean {
        const criteriaType = achievement.criteriaType;
        const achievementNameLower = achievement.name.toLowerCase();

        // Example basic mapping (needs refinement based on achievement definitions/metadata)
        switch (criteriaType) {
            case 'count':
            case 'collection':
                // Count/Collection achievements might care about many event types
                if (eventTrigger.startsWith('content_created') && achievementNameLower.includes('post')) return true;
                if (eventTrigger === 'comment_added' && achievementNameLower.includes('comment')) return true;
                if (eventTrigger === 'reaction_added' && achievementNameLower.includes('reaction')) return true;
                if (eventTrigger.startsWith('points_awarded:') && achievementNameLower.includes('earn')) return true; // e.g., "Earn 1000 points"
                // Add more specific checks based on achievement names or dedicated trigger fields/metadata
                break;
            case 'streak':
                // Streak achievements usually relate to specific actions like logins
                if (eventTrigger === 'user_login') return true; // Assuming a USER_LOGIN event exists
                break;
            case 'one-time':
                // One-time achievements are often tied to specific triggers
                if (eventTrigger === 'wallet_connected' && achievementNameLower.includes('wallet')) return true;
                if (eventTrigger === 'profile_completed' && achievementNameLower.includes('profile')) return true;
                break;
            case 'milestone':
                 // Milestone achievements might relate to total points or other metrics
                 if (eventTrigger === 'points_total') return true;
                 break;
            default:
                logger.warn(`Unhandled criteria type in doesAchievementCareAboutEvent: ${criteriaType}`, { achievementId: achievement.id });
                return false; // Default to not relevant if type is unknown or unhandled
        }

        // If no specific match above, assume not relevant for now.
        // A more robust system would use explicit trigger definitions.
        // logger.debug(`Checking relevance for achievement '${achievement.name}' (type: ${criteriaType}) and trigger '${eventTrigger}' - no specific match found.`);
        return false;
    }

    // --- API Support Methods ---

    /**
     * Get all achievements, potentially including user progress.
     */
    async getAchievementsForApi(userId: string | null, filters: { category?: string; status?: 'locked' | 'unlocked' | 'in-progress' }): Promise<any[]> {
         logger.debug('getAchievementsForApi called', { userId, filters });
         // 1. Get all enabled achievement definitions
         const definitions = await this.repository.findEnabledAchievements();
         let userAchievementsMap: Map<string, UserAchievement> = new Map();

         // 2. If userId is provided, get user's progress
         if (userId) {
             const userProgress = await this.repository.findUserAchievements(userId);
             userProgress.forEach(ua => userAchievementsMap.set(ua.achievementId, ua));
         }

         // 3. Combine and format
         const results = definitions
            .filter(def => !filters.category || def.category === filters.category) // Filter by category
            .map(def => {
                // Explicitly handle undefined from map lookup, default to null
                const userProgress = userId ? (userAchievementsMap.get(def.id) ?? null) : null; 
                // Pass userProgress (now UserAchievement | null), getCurrentProgress handles null
                const currentProgressValue = getCurrentProgress(userProgress); 
                const threshold = def.criteriaThreshold ?? 1;
                const progressPercent = threshold > 0 ? Math.min(100, Math.floor((currentProgressValue / threshold) * 100)) : (userProgress?.isUnlocked ? 100 : 0);
                const status = userProgress?.isUnlocked ? 'unlocked' : (currentProgressValue > 0 ? 'in-progress' : 'locked');

                return {
                    id: def.id,
                    name: def.name,
                    description: def.description,
                    category: def.category,
                    iconUrl: def.iconUrl,
                    pointsAwarded: def.pointsAwarded,
                    criteriaType: def.criteriaType,
                    criteriaThreshold: threshold,
                    userProgress: userId ? {
                        current: currentProgressValue, // Use calculated value
                        percent: progressPercent,
                        isUnlocked: userProgress?.isUnlocked ?? false,
                        unlockedAt: userProgress?.unlockedAt ?? null,
                        status: status
                    } : null
                };
            })
            .filter(ach => !filters.status || ach.userProgress?.status === filters.status); // Filter by status

         return results;
    }

    /**
     * Get specific achievements for a user based on status.
     */
    async getUserAchievementsForApi(userId: string, status: 'unlocked' | 'in-progress'): Promise<any[]> {
         logger.debug('getUserAchievementsForApi called', { userId, status });
         // 1. Get user achievement records based on status
         const userProgressList = await this.repository.findUserAchievements(userId, { unlocked: status === 'unlocked' });

         // Filter further for 'in-progress' (progress > 0 and not unlocked)
         const filteredUserProgress = status === 'in-progress'
            ? userProgressList.filter(ua => !ua.isUnlocked && ua.progress > 0)
            : userProgressList;

         // 2. Get corresponding achievement definitions (can optimize by fetching only needed IDs)
         const achievementIds = filteredUserProgress.map(ua => ua.achievementId);
         if (achievementIds.length === 0) return [];

         // Use the dedicated findByIds method added to the repository
         const definitions = await this.repository.findByIds(achievementIds); 
         const definitionsMap = new Map(definitions.map(def => [def.id, def]));

         // 3. Combine and format data
         return filteredUserProgress.map(ua => {
             const def = definitionsMap.get(ua.achievementId);
             if (!def) return null; // Should not happen if data is consistent

             const threshold = def.criteriaThreshold ?? 1;
             const progressPercent = threshold > 0 ? Math.min(100, Math.floor((ua.progress / threshold) * 100)) : (ua.isUnlocked ? 100 : 0);

             return {
                 id: def.id,
                 name: def.name,
                 description: def.description,
                 category: def.category,
                 iconUrl: def.iconUrl,
                 pointsAwarded: def.pointsAwarded,
                 criteriaType: def.criteriaType,
                 criteriaThreshold: threshold,
                 userProgress: {
                     current: ua.progress,
                     percent: progressPercent,
                     isUnlocked: ua.isUnlocked,
                     unlockedAt: ua.unlockedAt,
                     status: ua.isUnlocked ? 'unlocked' : 'in-progress'
                 }
             };
         }).filter(Boolean); // Remove nulls if any definition was missing
    }

    /**
     * Get recently unlocked achievements for a user.
     */
    async getRecentUnlocksForApi(userId: string, limit: number = 3): Promise<any[]> {
         logger.debug('getRecentUnlocksForApi called', { userId, limit });
         // 1. Get recent unlocks from repository
         const recentUnlocks = await this.repository.findRecentUserUnlocks(userId, limit);

         // 2. Get corresponding achievement definitions
         const achievementIds = recentUnlocks.map(ua => ua.achievementId);
          if (achievementIds.length === 0) return [];

         // Use the dedicated findByIds method added to the repository
         const definitions = await this.repository.findByIds(achievementIds);
         const definitionsMap = new Map(definitions.map(def => [def.id, def]));

         // 3. Combine and format data
         return recentUnlocks.map(ua => {
             const def = definitionsMap.get(ua.achievementId);
             if (!def) return null;
             return {
                 id: def.id,
                 name: def.name,
                 description: def.description, // Maybe shorten description for summary?
                 iconUrl: def.iconUrl,
                 pointsAwarded: def.pointsAwarded,
                 unlockedAt: ua.unlockedAt
             };
         }).filter(Boolean);
    }

    /**
     * Get summary data for the dashboard.
     */
    async getAchievementSummaryForDashboard(userId: string): Promise<{ recentUnlocks: any[], topInProgress: any[] }> {
        logger.debug('getAchievementSummaryForDashboard called', { userId });
        // Combine calls to other API methods
        const recentUnlocks = await this.getRecentUnlocksForApi(userId, 3);
        // Get top 3 in-progress achievements (closest to completion)
        const inProgress = await this.getUserAchievementsForApi(userId, 'in-progress');
        const topInProgress = inProgress
            .sort((a, b) => b.userProgress.percent - a.userProgress.percent) // Sort by percentage desc
            .slice(0, 3) // Take top 3
            .map(ach => ({ // Format for dashboard
                id: ach.id,
                name: ach.name,
                iconUrl: ach.iconUrl,
                progressPercent: ach.userProgress.percent
            }));
        return { recentUnlocks, topInProgress };
    }

    // --- REMOVE DUPLICATE METHODS BELOW ---

    // async getAchievementsForApi(userId: string | null, filters: { category?: string; status?: 'locked' | 'unlocked' | 'in-progress' }): Promise<any[]> {
    //      logger.debug('getAchievementsForApi called', { userId, filters });
    //      // 1. Get all enabled achievement definitions
    //      // 2. If userId is provided, get all user achievement progress/status for that user
    //      // 3. Combine the data, calculate progress %, filter based on status
    //      // 4. Return formatted data
    //      return []; // Placeholder
    // }

    // async getUserAchievementsForApi(userId: string, status: 'unlocked' | 'in-progress'): Promise<any[]> {
    //      logger.debug('getUserAchievementsForApi called', { userId, status });
    //      // 1. Get user achievement records based on status
    //      // 2. Get corresponding achievement definitions
    //      // 3. Combine and format data
    //      return []; // Placeholder
    // }

    // async getRecentUnlocksForApi(userId: string, limit: number = 3): Promise<any[]> {
    //      logger.debug('getRecentUnlocksForApi called', { userId, limit });
    //      // 1. Get recent unlocks from repository
    //      // 2. Get corresponding achievement definitions
    //      // 3. Combine and format data
    //      return []; // Placeholder
    // }

    // async getAchievementSummaryForDashboard(userId: string): Promise<{ recentUnlocks: any[], topInProgress: any[] }> {
    //     logger.debug('getAchievementSummaryForDashboard called', { userId });
    //     // Placeholder - combine calls to repo/other methods
    //     const recentUnlocks = await this.getRecentUnlocksForApi(userId, 3);
    //     const topInProgress: any[] = []; // TODO: Implement logic for top in-progress and add specific type
    //     return { recentUnlocks, topInProgress };
    // }
}

// Export a singleton instance (or handle instantiation in services/index.ts)
// export const achievementService = new AchievementService(achievementRepository, eventBus, pointsService);
