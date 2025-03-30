import { Redis } from 'ioredis';
import { v4 as uuid } from 'uuid';
import { logger } from './logger';
import { getRedisClient } from './db-client';

/**
 * Event interface for standardized event structure
 */
export interface Event {
  id?: string;      // Event unique ID
  type: string;     // Event type
  data: any;        // Event payload
  timestamp: string; // ISO timestamp
  source?: string;  // Source service/component
  version?: string; // Schema version
}

/**
 * Standard event types for the platform
 */
export enum EventType {
  // Points events
  POINTS_AWARDED = 'points.awarded',
  POINTS_DEDUCTED = 'points.deducted',
  POINTS_REDEEMED = 'points.redeemed',
  POINTS_TRANSFERRED = 'points.transferred',

  // Redemption events
  REDEMPTION_REQUESTED = 'redemption.requested',
  REDEMPTION_PROCESSING = 'redemption.processing',
  REDEMPTION_COMPLETED = 'redemption.completed',
  REDEMPTION_FAILED = 'redemption.failed',
  REDEMPTION_CANCELLED = 'redemption.cancelled',

  // Achievement events
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  ACHIEVEMENT_PROGRESS = 'achievement.progress',

  // Content events
  CONTENT_CREATED = 'content.created',
  CONTENT_UPDATED = 'content.updated', // Add this
  CONTENT_DELETED = 'content.deleted', // Add this
  // CONTENT_COMMENTED = 'content.commented', // Keep or remove depending on usage? Using COMMENT_ADDED for now.
  COMMENT_ADDED = 'comment.added', 
  COMMENT_UPDATED = 'comment.updated', // Add this
  COMMENT_DELETED = 'comment.deleted', // Add this
  REACTION_ADDED = 'reaction.added', 
  REACTION_REMOVED = 'reaction.removed', // Add this
  
  // User events
  USER_LEVEL_UP = 'user.levelUp',
  USER_TITLE_CHANGED = 'user.titleChanged',
  PROFILE_COMPLETED = 'user.profileCompleted', // Add this

  // Wallet events
  WALLET_CONNECTED = 'wallet.connected',
  WALLET_DISCONNECTED = 'wallet.disconnected',
  WALLET_VERIFIED = 'wallet.verified',

  // Milestone events
  MILESTONE_REACHED = 'milestone.reached',
  MILESTONE_PROGRESS = 'milestone.progress',

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
  REFERRAL_CAMPAIGN_APPLIED = 'referral.campaign_applied',

  // Security events
  SUSPICIOUS_ACTIVITY_DETECTED = 'security.suspicious_activity_detected',
  ACCOUNT_THROTTLED = 'security.account_throttled',
  ACCOUNT_UNTHROTTLED = 'security.account_unthrottled'
}

/**
 * Event priority levels for processing
 */
export enum EventPriority {
  LOW = 'low',           // Background, non-time-sensitive events
  STANDARD = 'standard', // Default priority
  HIGH = 'high',         // Important events that should be processed quickly
  CRITICAL = 'critical', // Events that need immediate processing
}

/**
 * Publish options for events
 */
export interface PublishOptions {
  priority?: EventPriority;              // Event priority level
  deliveryGuarantee?: 'at-least-once' | 'best-effort'; // Delivery guarantee
  userId?: string;                       // User associated with the event
  idempotencyKey?: string;              // Key for deduplication
  maxStreamLength?: number;             // Max length for stream (trimming)
  source?: string;                      // Source service/component
}

/**
 * Default publish options
 */
const DEFAULT_PUBLISH_OPTIONS: PublishOptions = {
  priority: EventPriority.STANDARD,
  deliveryGuarantee: 'at-least-once',
  maxStreamLength: 10000,
  source: 'event-bus',
};

/**
 * EventBus for publishing and subscribing to events
 * Uses Redis Streams for reliable distributed event handling across services
 */
export class EventBus {
  private redis: Redis;
  private subscribers: Map<string, Array<(data: any) => void>> = new Map();
  private subscriberRedis: Redis;
  private consumerGroupName: string;
  private consumerName: string;
  private eventStreamPrefix = 'events:stream:';
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly defaultMaxStreamLength = 10000;
  private readonly processingBatchSize = 50;
  private readonly processingIntervalMs = 500;

  /**
   * Create a new EventBus instance
   * @param redis Redis client for publishing
   * @param serviceName Service name for consumer group
   */
  constructor(redis: Redis, serviceName: string = 'app-service') {
    this.redis = redis;

    // Create a duplicate connection for subscribing to prevent blocking
    this.subscriberRedis = redis.duplicate();
    this.consumerGroupName = 'event-bus-consumers';
    this.consumerName = `${serviceName}-${uuid().substring(0, 8)}`;

    // Setup Redis Pub/Sub for backward compatibility
    this.setupRedisSubscription();

    // Setup Redis Streams consumer
    this.setupStreamConsumer();
  }

  /**
   * Publish an event to all subscribers
   * @param eventType Type of event
   * @param data Event data
   * @param options Publish options
   * @returns Event ID
   */
  async publish(
    eventType: EventType | string,
    data: any,
    options: PublishOptions = {}
  ): Promise<string> {
    // Merge with default options
    const mergedOptions = { ...DEFAULT_PUBLISH_OPTIONS, ...options };

    // Create standardized event
    const eventId = options.idempotencyKey || uuid();
    const event: Event = {
      id: eventId,
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      source: mergedOptions.source || DEFAULT_PUBLISH_OPTIONS.source,
      version: '1.0',
    };

    try {
      // Stream name based on event type
      const streamName = `${this.eventStreamPrefix}${eventType}`;

      // Add to Redis Stream with automatic ID
      // The '*' parameter tells Redis to generate a unique ID
      const streamFields = [
        'id', eventId,
        'type', eventType,
        'data', JSON.stringify(data),
        'timestamp', event.timestamp,
        'source', event.source || '',
        'version', event.version || '1.0',
        'priority', mergedOptions.priority || EventPriority.STANDARD,
      ];

      if (mergedOptions.userId) {
        streamFields.push('userId', mergedOptions.userId);
      }

      // Add to Redis Stream
      await this.redis.xadd(
        streamName,
        '*',
        ...streamFields
      );

      // Trim stream if needed to control memory usage
      if (mergedOptions.maxStreamLength) {
        await this.redis.xtrim(streamName, 'MAXLEN', '~', mergedOptions.maxStreamLength);
      }

      // For backward compatibility, also publish to Redis Pub/Sub
      await this.redis.publish('events', JSON.stringify(event));

      // Call local subscribers directly for immediate processing
      this.notifySubscribers(eventType, data);

      logger.debug(`Event published: ${eventType}`, {
        eventId,
        priority: mergedOptions.priority
      });

      return eventId;
    } catch (error: unknown) { // Fix: Type error as unknown
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to publish event: ${eventType}`, { error: errorMessage, eventId });

      // For at-least-once delivery, throw error so caller can retry
      if (mergedOptions.deliveryGuarantee === 'at-least-once') {
        // Construct a new error with a clear message
        throw new Error(`Failed to publish event: ${errorMessage}`);
      }

      return eventId;
    }
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
   * Set up Redis Stream consumer group
   */
  private async setupStreamConsumer(): Promise<void> {
    try {
      // Start processing events from streams
      this.processingInterval = setInterval(() => {
        this.processEventStreams().catch(error => { // Catch error here
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error('Error processing event streams interval', { error: errorMessage });
        });
      }, this.processingIntervalMs);

      logger.info('Event stream consumer setup complete', {
        consumerGroup: this.consumerGroupName,
        consumerName: this.consumerName
      });
    } catch (error: unknown) { // Fix: Type error as unknown
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to setup Redis Stream consumer', { error: errorMessage });
    }
  }

  /**
   * Process events from Redis Streams
   */
  private async processEventStreams(): Promise<void> {
    // Skip if already processing
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get all event stream keys
      const streamKeys = await this.redis.keys(`${this.eventStreamPrefix}*`);

      if (streamKeys.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Process each stream
      for (const streamKey of streamKeys) {
        const eventType = streamKey.replace(this.eventStreamPrefix, '');

        // Skip if no subscribers for this event type
        if (!this.subscribers.has(eventType) || this.subscribers.get(eventType)!.length === 0) {
          continue;
        }

        // Check if consumer group exists for this stream
        try {
          // Try to create the consumer group
          // This will fail if the group already exists, which is fine
          await this.redis.xgroup('CREATE', streamKey, this.consumerGroupName, '$', 'MKSTREAM');
          logger.debug(`Created consumer group for stream: ${streamKey}`);
        } catch (error: unknown) { // Fix: Type error as unknown
          // Ignore error if group already exists
          const errorMessage = error instanceof Error ? error.message : String(error);
          // More specific check for ioredis error message
          if (!errorMessage.includes('BUSYGROUP Consumer Group name already exists')) {
            logger.error(`Failed to create/access consumer group for stream: ${streamKey}`, { error: errorMessage });
            // If we can't create/access the group, skip processing this stream for now
            continue;
          }
        }

        // Read events from the stream
        try {
          // Use 'any' for response type and rely on runtime checks
          const response: any = await this.redis.xreadgroup( 
            'GROUP', this.consumerGroupName, this.consumerName,
            'COUNT', this.processingBatchSize,
            'STREAMS', streamKey, '>'
          );

          // Check if the response is null or empty
          if (!response || response.length === 0) {
            continue; // No new messages for this stream
          }

          // Safely access the nested structure
          const streamData = response[0]; // Access the first (and only expected) stream's data
          if (!Array.isArray(streamData) || streamData.length !== 2 || !Array.isArray(streamData[1])) {
              logger.warn('Unexpected structure from xreadgroup (streamData)', { streamKey, response });
              continue;
          }
          const messages = streamData[1]; // Access the messages array ([ [messageId, fields], ... ])

          if (messages.length === 0) {
            continue; // No messages in this batch
          }

          // Process each message
          for (const message of messages) {
              // Ensure message is [messageId, fields] structure
              if (!Array.isArray(message) || message.length !== 2) {
                  logger.warn('Unexpected message structure in stream', { messageId: message?.[0], streamKey });
                  continue; // Skip malformed message
              }
              const [messageId, fields] = message; // Destructure messageId and fields

              // Ensure fields is an array of strings [key1, val1, key2, val2, ...]
              if (!Array.isArray(fields)) {
                  logger.warn('Received non-array fields in message', { messageId, streamKey });
                  continue; // Skip message with malformed fields
              }

              try {
                  // Convert fields array (string[]) to object
                  const fieldsObj: Record<string, string> = {};
                  for (let i = 0; i < fields.length; i += 2) {
                      // Basic check to prevent out-of-bounds access
                      if (i + 1 < fields.length) {
                          fieldsObj[fields[i]] = fields[i + 1];
                      } else {
                           logger.warn('Odd number of elements in message fields array', { messageId, streamKey });
                      }
                  }

                  // Parse event data
                  const eventData = JSON.parse(fieldsObj.data || '{}');

                  // Notify subscribers
                  this.notifySubscribers(eventType, eventData);

                  // Acknowledge the message
                  await this.redis.xack(streamKey, this.consumerGroupName, messageId);
              } catch (error: unknown) { // Fix: Type error as unknown
                  const errorMessage = error instanceof Error ? error.message : String(error);
                  logger.error(`Failed to process event message: ${messageId}`, { error: errorMessage, streamKey });
              }
          }
        } catch (error: unknown) { // Fix: Type error as unknown
           const errorMessage = error instanceof Error ? error.message : String(error);
           logger.error(`Failed to read events from stream: ${streamKey}`, { error: errorMessage });
        }
      }
    } catch (error: unknown) { // Fix: Type error as unknown
       const errorMessage = error instanceof Error ? error.message : String(error);
       logger.error('Failed to process event streams', { error: errorMessage });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Set up Redis subscription for distributed events (backward compatibility)
   */
  private setupRedisSubscription(): void {
    // Subscribe to the events channel
    this.subscriberRedis.subscribe('events');

    // Handle incoming events
    this.subscriberRedis.on('message', (_channel, message) => {
      try {
        const event = JSON.parse(message) as Event;
        this.notifySubscribers(event.type, event.data);
      } catch (error: unknown) { // Fix: Type error as unknown
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to process event message', { error: errorMessage });
      }
    });

    // Log subscription status
    this.subscriberRedis.on('subscribe', (channel, count) => {
      logger.info(`Subscribed to ${channel}, total subscriptions: ${count}`);
    });

    // Log errors
    this.subscriberRedis.on('error', (error: unknown) => { // Fix: Type error as unknown
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Redis subscription error', { error: errorMessage });
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
        } catch (error: unknown) { // Fix: Type error as unknown
          const errorMessage = error instanceof Error ? error.message : String(error);
          // Log the error message, not the unknown object directly
          logger.error('Error in event subscriber', { eventType, error: errorMessage });
        }
      });
    }
  }

  /**
   * Stop event processing
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Create and export singleton instance
export const eventBus = new EventBus(getRedisClient(), process.env.SERVICE_NAME || 'app-service');
