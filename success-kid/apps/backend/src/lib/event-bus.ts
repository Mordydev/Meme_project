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
  POINTS_AWARDED = 'points.awarded',
  POINTS_REDEEMED = 'points.redeemed',
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  CONTENT_CREATED = 'content.created',
  CONTENT_COMMENTED = 'content.commented',
  LEVEL_UP = 'user.levelUp',
  WALLET_CONNECTED = 'wallet.connected',
  MILESTONE_REACHED = 'milestone.reached'
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