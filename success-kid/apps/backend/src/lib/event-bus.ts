import { Redis } from 'ioredis';
import { logger } from './logger';
import { getRedisClient } from './db-client';

/**
 * Event interface for standardized event structure
 */
export interface Event {
  type: string;
  data: any;
  timestamp: string;
}

/**
 * Standard event types for the platform
 */
export enum EventType {
  // Points events
  POINTS_AWARDED = 'points.awarded',
  POINTS_REDEEMED = 'points.redeemed',
  
  // Redemption events
  REDEMPTION_CREATED = 'redemption.created',
  REDEMPTION_PROCESSING = 'redemption.processing',
  REDEMPTION_COMPLETED = 'redemption.completed',
  REDEMPTION_FAILED = 'redemption.failed',
  REDEMPTION_CANCELLED = 'redemption.cancelled',
  
  // Achievement events
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  
  // Content events
  CONTENT_CREATED = 'content.created',
  CONTENT_COMMENTED = 'content.commented',
  
  // User events
  LEVEL_UP = 'user.levelUp',
  
  // Wallet events
  WALLET_CONNECTED = 'wallet.connected',
  
  // Milestone events
  MILESTONE_REACHED = 'milestone.reached',
  
  // Notification events
  NOTIFICATION_CREATED = 'notification.created',
  NOTIFICATION_DELIVERED = 'notification.delivered',
  NOTIFICATION_READ = 'notification.read',
  NOTIFICATIONS_CLEARED = 'notifications.cleared',
  
  // Activity events
  ACTIVITY_CREATED = 'activity.created',
  FEED_ITEM_CREATED = 'feed.item.created',
  FEED_ITEMS_READ = 'feed.items.read',
  
  // Presence events
  PRESENCE_UPDATED = 'presence.updated',
  PRESENCE_SUBSCRIBED = 'presence.subscribed',
  
  // Referral events
  REFERRAL_CREATED = 'referral.created',
  REFERRAL_STATUS_UPDATED = 'referral.status_updated',
  REFERRAL_CODE_GENERATED = 'referral.code_generated',
  REFERRAL_CODE_DEACTIVATED = 'referral.code_deactivated',
  REFERRAL_LINK_VISITED = 'referral.link_visited',
  REFERRAL_ATTRIBUTED = 'referral.attributed',
  REFERRAL_MILESTONE_REWARDED = 'referral.milestone_rewarded',
  REFERRAL_CAMPAIGN_CREATED = 'referral.campaign_created',
  REFERRAL_CAMPAIGN_UPDATED = 'referral.campaign_updated',
  REFERRAL_CAMPAIGN_ACTIVATED = 'referral.campaign_activated',
  REFERRAL_CAMPAIGN_DEACTIVATED = 'referral.campaign_deactivated',
  REFERRAL_CAMPAIGN_APPLIED = 'referral.campaign_applied'
}

/**
 * EventBus for publishing and subscribing to events
 * Uses Redis for distributed event handling across services
 */
export class EventBus {
  private redis: Redis;
  private subscribers: Map<string, Array<(data: any) => void>> = new Map();
  private subscriberRedis: Redis;
  
  /**
   * Create a new EventBus instance
   * @param redis Redis client for publishing
   */
  constructor(redis: Redis) {
    this.redis = redis;
    // Create a duplicate connection for subscribing to prevent blocking
    this.subscriberRedis = redis.duplicate();
    this.setupRedisSubscription();
  }
  
  /**
   * Publish an event to all subscribers
   * @param eventType Type of event
   * @param data Event data
   */
  async publish(eventType: EventType | string, data: any): Promise<void> {
    const event: Event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Publish to Redis for distributed events
    await this.redis.publish('events', JSON.stringify(event));
    
    // Call local subscribers directly for immediate processing
    this.notifySubscribers(eventType, data);
    
    logger.debug(`Event published: ${eventType}`, { data });
  }
  
  /**
   * Subscribe to an event type
   * @param eventType Type of event to subscribe to
   * @param callback Function to call when event occurs
   * @returns Unsubscribe function
   */
  subscribe(eventType: EventType | string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    this.subscribers.get(eventType)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * Set up Redis subscription for distributed events
   */
  private setupRedisSubscription(): void {
    // Subscribe to the events channel
    this.subscriberRedis.subscribe('events');
    
    // Handle incoming events
    this.subscriberRedis.on('message', (_channel, message) => {
      try {
        const event = JSON.parse(message) as Event;
        this.notifySubscribers(event.type, event.data);
      } catch (error) {
        logger.error('Failed to process event message', { error });
      }
    });

    // Log subscription status
    this.subscriberRedis.on('subscribe', (channel, count) => {
      logger.info(`Subscribed to ${channel}, total subscriptions: ${count}`);
    });

    // Log errors
    this.subscriberRedis.on('error', (error) => {
      logger.error('Redis subscription error', { error });
    });
  }
  
  /**
   * Notify local subscribers of an event
   * @param eventType Type of event
   * @param data Event data
   */
  private notifySubscribers(eventType: string, data: any): void {
    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Error in event subscriber', { eventType, error });
        }
      });
    }
  }
}

// Create and export singleton instance
export const eventBus = new EventBus(getRedisClient());