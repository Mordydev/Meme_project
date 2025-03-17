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
  // Points-related events
  POINTS_AWARDED = 'points.awarded',
  POINTS_REDEEMED = 'points.redeemed',
  
  // Achievement-related events
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  LEVEL_UP = 'user.levelUp',
  
  // Content-related events
  CONTENT_CREATED = 'content.created',
  CONTENT_COMMENTED = 'content.commented',
  COMMENT_CREATED = 'comment.created',
  CONTENT_REPORTED = 'content.reported',
  
  // Wallet-related events
  WALLET_CONNECTED = 'wallet.connected',
  
  // Milestone-related events
  MILESTONE_REACHED = 'milestone.reached',
  
  // Market data events
  PRICE_UPDATED = 'price.updated',
  MARKET_CAP_UPDATED = 'marketcap.updated',
  TRANSACTION_DETECTED = 'transaction.detected',
  MARKET_MILESTONE_REACHED = 'market.milestone.reached',
  
  // Audit events
  AUDIT_DISCREPANCIES_FOUND = 'audit.discrepancies.found',
  AUDIT_DISCREPANCY_RESOLVED = 'audit.discrepancy.resolved',
  AUDIT_SYSTEM_AUDIT_COMPLETE = 'audit.system.audit.complete',
  AUDIT_RECONCILIATION_COMPLETE = 'audit.reconciliation.complete',
  
  // Notification events
  NOTIFICATION_CREATED = 'notification.created',
  NOTIFICATION_READ = 'notification.read',
  NOTIFICATION_ALL_READ = 'notification.all.read',
  
  // Presence events
  PRESENCE_UPDATED = 'presence.updated',
  
  // Activity events
  ACTIVITY_CREATED = 'activity.created',
  FEED_UPDATED = 'feed.updated',
  
  // Connection events
  CONNECTION_ESTABLISHED = 'connection.established',
  CONNECTION_CLOSED = 'connection.closed'
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
  
  /**
   * Get all active subscription types
   * @returns Array of event types with active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscribers.keys());
  }
  
  /**
   * Get count of subscribers for each event type
   * @returns Map of event types to subscriber counts
   */
  getSubscriberCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.subscribers.forEach((callbacks, eventType) => {
      counts[eventType] = callbacks.length;
    });
    return counts;
  }
}

// Create and export singleton instance
export const eventBus = new EventBus(getRedisClient());