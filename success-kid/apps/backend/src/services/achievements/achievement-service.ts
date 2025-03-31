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

// Define the structure returned by getAchievementsForApi
// This should match the structure expected/mapped in the handler
interface AchievementListItem {
    id: string;
    name: string;
    description: string;
    category?: string | null; // Make optional or nullable based on schema/logic
    iconUrl: string | null;
    pointsAwarded: number;
    criteriaType: string;
    criteriaThreshold: number;
    isSecret: boolean; // Added based on handler mapping
    userProgress: {
        current: number;
        percent: number;
        isUnlocked: boolean;
        unlockedAt: Date | null;
        status: 'locked' | 'in-progress' | 'unlocked';
    } | null;
}

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
     * Get all achievements, potentially including user progress, with pagination and filtering.
     */
    async getAchievementsForApi(
        userId: string | null,
        options: {
            limit?: number;
            offset?: number;
            category?: string;
            status?: 'locked' | 'unlocked' | 'in-progress'; // Keep status filter
        }
    ): Promise<{ data: AchievementListItem[]; total: number }> { // Update return type
         logger.debug('getAchievementsForApi called', { userId, options });
         const { limit = 50, offset = 0, category, status } = options;

         // 1. Get all enabled achievement definitions (potentially filtered by category later if needed)
         // TODO: Consider filtering definitions by category in the repository if performance becomes an issue
         const definitions = await this.repository.findEnabledAchievements();
         let userAchievementsMap: Map<string, UserAchievement> = new Map();

         // 2. If userId is provided, get user's progress (we'll fetch paginated/filtered later if needed)
         if (userId) {
             // Fetch all progress for the user initially to build the map
             const { data: allUserProgressData } = await this.repository.findUserAchievements(userId, {}); // Fetch all initially
             allUserProgressData.forEach(ua => userAchievementsMap.set(ua.achievementId, ua));
         }

         // 3. Combine, format, and filter
         const combinedData = definitions
            .filter(def => !category || def.category === category) // Filter by category
            .map((def): AchievementListItem | null => { // Add return type hint
                // Explicitly handle undefined from map lookup, default to null
                const userProgress = userId ? (userAchievementsMap.get(def.id) ?? null) : null;
                // Pass userProgress (now UserAchievement | null), getCurrentProgress handles null
                const currentProgressValue = getCurrentProgress(userProgress);
                const threshold = def.criteriaThreshold ?? 1;
                const progressPercent = threshold > 0 ? Math.min(100, Math.floor((currentProgressValue / threshold) * 100)) : (userProgress?.isUnlocked ? 100 : 0);
                 const calculatedStatus = userProgress?.isUnlocked ? 'unlocked' : (currentProgressValue > 0 ? 'in-progress' : 'locked');

                 // Filter by status only if userId is null (otherwise repo handles it)
                 if (!userId && status && calculatedStatus !== status) {
                     return null;
                 }

                 return {
                    id: def.id, // Ensure this matches AchievementListItem
                    name: def.name, // Ensure this matches AchievementListItem
                    description: def.description, // Ensure this matches AchievementListItem
                    category: def.category, // Ensure this matches AchievementListItem
                    iconUrl: def.iconUrl, // Ensure this matches AchievementListItem
                    pointsAwarded: def.pointsAwarded, // Ensure this matches AchievementListItem
                    criteriaType: def.criteriaType, // Ensure this matches AchievementListItem
                    criteriaThreshold: threshold, // Ensure this matches AchievementListItem
                    isSecret: def.isSecret, // Add isSecret based on handler mapping
                    userProgress: userId ? {
                        current: currentProgressValue,
                        percent: progressPercent,
                        isUnlocked: userProgress?.isUnlocked ?? false,
                        unlockedAt: userProgress?.unlockedAt ?? null,
                        status: calculatedStatus
                    } : null
                };
            })
            .filter((item): item is AchievementListItem => item !== null); // Filter out nulls and assert type

         // 4. Apply pagination (if userId is null, otherwise repo handles it)
         let finalData = combinedData;
         let total = combinedData.length;

         if (userId) {
            // If userId is provided, pagination and total count should come from the repository call
            // Re-fetch with pagination/filtering applied at the repo level
            const { data: paginatedUserProgress, total: userTotal } = await this.repository.findUserAchievements(userId, { status, limit, offset });
            const paginatedUserAchievementsMap = new Map(paginatedUserProgress.map(ua => [ua.achievementId, ua]));
            total = userTotal; // Use total count from repository

            // Map definitions based on the paginated user progress
            finalData = definitions
                .filter(def => !category || def.category === category) // Keep category filter
                .map((def): AchievementListItem | null => {
                    const userProgress = paginatedUserAchievementsMap.get(def.id) ?? null;
                    // If filtering by status, only include achievements that match the user's status
                    if (status && !userProgress) return null; // Exclude if no user progress for this status

                    const currentProgressValue = getCurrentProgress(userProgress);
                    const threshold = def.criteriaThreshold ?? 1;
                    const progressPercent = threshold > 0 ? Math.min(100, Math.floor((currentProgressValue / threshold) * 100)) : (userProgress?.isUnlocked ? 100 : 0);
                    const calculatedStatus = userProgress?.isUnlocked ? 'unlocked' : (currentProgressValue > 0 ? 'in-progress' : 'locked');

                    // Status filter already applied in repo query if userId is present
                    // if (status && calculatedStatus !== status) {
                    //     return null;
                    // }

                    return {
                        id: def.id,
                        name: def.name,
                        description: def.description,
                        category: def.category,
                        iconUrl: def.iconUrl,
                        pointsAwarded: def.pointsAwarded,
                        criteriaType: def.criteriaType,
                        criteriaThreshold: threshold,
                        isSecret: def.isSecret,
                        userProgress: userProgress ? { // Only include userProgress if it exists
                            current: currentProgressValue,
                            percent: progressPercent,
                            isUnlocked: userProgress.isUnlocked,
                            unlockedAt: userProgress.unlockedAt,
                            status: calculatedStatus
                        } : null
                    };
                })
                .filter((item): item is AchievementListItem => item !== null);

         } else {
             // Apply pagination manually if userId is null
             finalData = combinedData.slice(offset, offset + limit);
         }


         // 5. Return paginated data and total count
         return { data: finalData, total };
    } // <-- Corrected closing brace placement

    /**
     * Get specific achievements for a user based on status.
     */
    async getUserAchievementsForApi(userId: string, status: 'unlocked' | 'in-progress'): Promise<any[]> {
         logger.debug('getUserAchievementsForApi called', { userId, status });
         // 1. Get user achievement records based on status using the correct parameter
         // The repository method expects 'status', not 'unlocked'
         const { data: userProgressList, total } = await this.repository.findUserAchievements(userId, { status: status }); // Pass status correctly

         // Filtering is done in the repository. Use the returned data directly.
         const filteredUserProgress = userProgressList; // userProgressList is already the data array

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
}

// Export a singleton instance (or handle instantiation in services/index.ts)
// export const achievementService = new AchievementService(achievementRepository, eventBus, pointsService);
