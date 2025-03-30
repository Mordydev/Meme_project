import { EventBus, EventType } from '../../../lib/event-bus';
import { logger } from '../../../lib/logger';
import { AchievementService } from '../achievement-service';

/**
 * Subscribes to user-related events and triggers achievement checks.
 */
export class UserSubscriber {
    constructor(
        private eventBus: EventBus,
        private achievementService: AchievementService
    ) {}

    /**
     * Initialize subscriptions.
     */
    subscribe() {
        this.eventBus.subscribe(EventType.USER_LEVEL_UP, this.handleUserLevelUp.bind(this));
        this.eventBus.subscribe(EventType.WALLET_CONNECTED, this.handleWalletConnected.bind(this));
        this.eventBus.subscribe(EventType.PROFILE_COMPLETED, this.handleProfileCompleted.bind(this)); // Assuming PROFILE_COMPLETED event exists
        // Add subscriptions to other user-related events if needed (e.g., USER_REGISTERED, USER_TITLE_CHANGED)
        logger.info('UserSubscriber subscribed to events');
    }

    /**
     * Handle the USER_LEVEL_UP event.
     * @param event Event data for user level up.
     */
    private async handleUserLevelUp(event: any): Promise<void> {
        // TODO: Define a proper type for the event payload
        const { userId, newLevel } = event;

        if (!userId || !newLevel) {
            logger.warn('Received USER_LEVEL_UP event with missing data', { event });
            return;
        }

        logger.debug('UserSubscriber handling USER_LEVEL_UP', { userId, newLevel });

        try {
            // Trigger achievement processing based on reaching a certain level
            await this.achievementService['processEventForAchievements'](userId, 'user_level', event);
        } catch (error) {
            logger.error('Error processing USER_LEVEL_UP event for achievements', { userId, newLevel, error });
        }
    }

    /**
     * Handle the WALLET_CONNECTED event.
     * @param event Event data for wallet connection.
     */
    private async handleWalletConnected(event: any): Promise<void> {
        // TODO: Define a proper type for the event payload
        const { userId, walletAddress } = event;

        if (!userId) {
            logger.warn('Received WALLET_CONNECTED event with missing userId', { event });
            return;
        }

        logger.debug('UserSubscriber handling WALLET_CONNECTED', { userId });

        try {
            // Trigger one-time achievement for connecting wallet
            await this.achievementService['processEventForAchievements'](userId, 'wallet_connected', event);
        } catch (error) {
            logger.error('Error processing WALLET_CONNECTED event for achievements', { userId, error });
        }
    }
    
    /**
     * Handle the PROFILE_COMPLETED event (Placeholder).
     * @param event Event data for profile completion.
     */
    private async handleProfileCompleted(event: any): Promise<void> {
        // TODO: Define a proper type for the event payload
        const { userId } = event;

        if (!userId) {
            logger.warn('Received PROFILE_COMPLETED event with missing userId', { event });
            return;
        }

        logger.debug('UserSubscriber handling PROFILE_COMPLETED', { userId });

        try {
            // Trigger one-time achievement for completing profile
            await this.achievementService['processEventForAchievements'](userId, 'profile_completed', event);
        } catch (error) {
            logger.error('Error processing PROFILE_COMPLETED event for achievements', { userId, error });
        }
    }

    // Add handlers for other user-related events if necessary
}

// Usage: Instantiate and call subscribe() where services are initialized
// const userSubscriber = new UserSubscriber(eventBusInstance, achievementServiceInstance);
// userSubscriber.subscribe();
