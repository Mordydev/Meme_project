import { EventBus, EventType } from '../../../lib/event-bus';
import { logger } from '../../../lib/logger';
import { AchievementService } from '../achievement-service'; // Assuming AchievementService is exported or accessible

/**
 * Subscribes to points-related events and triggers achievement checks.
 */
export class PointsSubscriber {
    constructor(
        private eventBus: EventBus,
        private achievementService: AchievementService // Inject AchievementService instance
    ) {}

    /**
     * Initialize subscriptions.
     */
    subscribe() {
        this.eventBus.subscribe(EventType.POINTS_AWARDED, this.handlePointsAwarded.bind(this));
        // Add subscriptions to other points-related events if needed (e.g., POINTS_REDEEMED for spending achievements)
        logger.info('PointsSubscriber subscribed to events');
    }

    /**
     * Handle the POINTS_AWARDED event.
     * @param event Event data for points awarded.
     */
    private async handlePointsAwarded(event: any): Promise<void> {
        // TODO: Define a proper type for the event payload if not already done in event-bus.ts
        const { userId, source, amount, total, transactionId } = event;

        if (!userId || !source) {
            logger.warn('Received POINTS_AWARDED event with missing data', { event });
            return;
        }

        logger.debug('PointsSubscriber handling POINTS_AWARDED', { userId, source, amount });

        try {
            // Trigger achievement processing based on the specific source
            await this.achievementService['processEventForAchievements'](userId, `points_awarded:${source}`, event);

            // Trigger achievement processing based on the total points (for milestone achievements)
            await this.achievementService['processEventForAchievements'](userId, 'points_total', event);

        } catch (error) {
            logger.error('Error processing POINTS_AWARDED event for achievements', { userId, source, error });
        }
    }

    // Add handlers for other points-related events if necessary
}

// Usage: Instantiate and call subscribe() where services are initialized
// const pointsSubscriber = new PointsSubscriber(eventBusInstance, achievementServiceInstance);
// pointsSubscriber.subscribe();
