import { EventBus, EventType } from '../../../lib/event-bus';
import { logger } from '../../../lib/logger';
import { AchievementService } from '../achievement-service';

/**
 * Subscribes to content-related events and triggers achievement checks.
 */
export class ContentSubscriber {
    constructor(
        private eventBus: EventBus,
        private achievementService: AchievementService
    ) {}

    /**
     * Initialize subscriptions.
     */
    subscribe() {
        this.eventBus.subscribe(EventType.CONTENT_CREATED, this.handleContentCreated.bind(this));
        this.eventBus.subscribe(EventType.COMMENT_ADDED, this.handleCommentAdded.bind(this));
        this.eventBus.subscribe(EventType.REACTION_ADDED, this.handleReactionAdded.bind(this));
        // Add subscriptions to other content-related events if needed (e.g., CONTENT_FEATURED)
        logger.info('ContentSubscriber subscribed to events');
    }

    /**
     * Handle the CONTENT_CREATED event.
     * @param event Event data for content creation.
     */
    private async handleContentCreated(event: any): Promise<void> {
        // TODO: Define a proper type for the event payload
        const { userId, contentId, contentType, category } = event; // Assuming category might be present

        if (!userId || !contentId || !contentType) {
            logger.warn('Received CONTENT_CREATED event with missing data', { event });
            return;
        }

        logger.debug('ContentSubscriber handling CONTENT_CREATED', { userId, contentId, contentType });

        try {
            // Trigger achievement processing based on the content type
            await this.achievementService['processEventForAchievements'](userId, `content_created:${contentType}`, event);
            // Trigger for generic content creation count
            await this.achievementService['processEventForAchievements'](userId, 'content_created', event);
             // Trigger for category-specific achievements if category exists
            if (category) {
                 await this.achievementService['processEventForAchievements'](userId, `content_created_category:${category}`, event);
            }

        } catch (error) {
            logger.error('Error processing CONTENT_CREATED event for achievements', { userId, contentId, error });
        }
    }

    /**
     * Handle the COMMENT_ADDED event.
     * @param event Event data for comment addition.
     */
    private async handleCommentAdded(event: any): Promise<void> {
        // TODO: Define a proper type for the event payload
        const { userId, commentId, contentId } = event;

        if (!userId || !commentId) {
            logger.warn('Received COMMENT_ADDED event with missing data', { event });
            return;
        }

        logger.debug('ContentSubscriber handling COMMENT_ADDED', { userId, commentId });

        try {
            // Trigger achievement processing for commenting activity
            await this.achievementService['processEventForAchievements'](userId, 'comment_added', event);
        } catch (error) {
            logger.error('Error processing COMMENT_ADDED event for achievements', { userId, commentId, error });
        }
    }

     /**
     * Handle the REACTION_ADDED event.
     * Note: This might trigger achievements for the *reactor* or the *content owner*.
     * @param event Event data for reaction addition.
     */
    private async handleReactionAdded(event: any): Promise<void> {
        // TODO: Define a proper type for the event payload
        // Expecting: reactorUserId, contentId, contentOwnerUserId, reactionType
        const { reactorUserId, contentOwnerUserId, contentId, reactionType } = event;

        if (!reactorUserId || !contentId) {
            logger.warn('Received REACTION_ADDED event with missing data', { event });
            return;
        }

        logger.debug('ContentSubscriber handling REACTION_ADDED', { reactorUserId, contentId, reactionType });

        try {
            // Trigger achievements for the user who added the reaction
            await this.achievementService['processEventForAchievements'](reactorUserId, 'reaction_added', event);

            // Trigger achievements for the content owner (if different from reactor)
            if (contentOwnerUserId && contentOwnerUserId !== reactorUserId) {
                 await this.achievementService['processEventForAchievements'](contentOwnerUserId, 'reaction_received', event);
            }

        } catch (error) {
            logger.error('Error processing REACTION_ADDED event for achievements', { reactorUserId, contentId, error });
        }
    }

    // Add handlers for other content-related events if necessary
}

// Usage: Instantiate and call subscribe() where services are initialized
// const contentSubscriber = new ContentSubscriber(eventBusInstance, achievementServiceInstance);
// contentSubscriber.subscribe();
