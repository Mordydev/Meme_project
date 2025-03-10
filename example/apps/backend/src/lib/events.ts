import { EventEmitter as NodeEventEmitter } from 'events';
import { Logger } from 'pino';
import Redis from 'ioredis';
import { config } from '../config';

/**
 * Event types supported by the system
 * This provides type-safety for event emission and handlers
 */
export enum EventType {
  // User events
  USER_REGISTERED = 'user.registered',
  USER_UPDATED = 'user.updated',
  USER_FOLLOWED = 'user.followed',
  USER_UNFOLLOWED = 'user.unfollowed',
  
  // WebSocket events
  WEBSOCKET_CONNECTED = 'websocket.connected',
  WEBSOCKET_DISCONNECTED = 'websocket.disconnected',
  WEBSOCKET_MESSAGE = 'websocket.message',
  WEBSOCKET_CHANNEL_JOINED = 'websocket.channel.joined',
  WEBSOCKET_CHANNEL_LEFT = 'websocket.channel.left',
  
  // Achievement events
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  ACHIEVEMENT_PROGRESS = 'achievement.progress',
  
  // Battle events
  BATTLE_CREATED = 'battle.created',
  BATTLE_UPDATED = 'battle.updated',
  BATTLE_ENTRY_SUBMITTED = 'battle.entry.submitted',
  BATTLE_VOTING_STARTED = 'battle.voting.started',
  BATTLE_COMPLETED = 'battle.completed',
  
  // Content events
  CONTENT_CREATED = 'content.created',
  CONTENT_UPDATED = 'content.updated',
  CONTENT_DELETED = 'content.deleted',
  CONTENT_COMMENT_ADDED = 'content.comment.added',
  CONTENT_REACTION_ADDED = 'content.reaction.added',
  CONTENT_REACTION_REMOVED = 'content.reaction.removed',
  
  // Moderation events
  CONTENT_MODERATED = 'content.moderated',
  CONTENT_MODERATION_APPEALED = 'content.moderation.appealed',
  CONTENT_REPORTED = 'content.reported',
  
  // Media events
  MEDIA_UPLOADED = 'media.uploaded',
  MEDIA_PROCESSED = 'media.processed',
  
  // Token events
  TOKEN_PRICE_UPDATED = 'token.price.updated',
  TOKEN_MILESTONE_REACHED = 'token.milestone.reached',
  TOKEN_TRANSACTION_PROCESSED = 'token.transaction.processed',
  WALLET_CONNECTED = 'wallet.connected',
  USER_BENEFITS_UPDATED = 'user.benefits.updated',
  
  // Notification events
  NOTIFICATION_CREATED = 'notification.created',
  NOTIFICATION_READ = 'notification.read',
  NOTIFICATION_DELETED = 'notification.deleted'
}

// Type-safe event handler
export type EventHandler<T = any> = (data: T) => Promise<void> | void;

/**
 * Event payload types mapped to event types
 */
export interface EventPayloadMap {
  [EventType.WEBSOCKET_CONNECTED]: {
    connectionId: string;
    userId: string;
    timestamp: string;
  };
  [EventType.WEBSOCKET_DISCONNECTED]: {
    connectionId: string;
    userId: string;
    timestamp: string;
  };
  [EventType.WEBSOCKET_MESSAGE]: {
    connectionId: string;
    userId: string;
    message: any;
    timestamp: string;
  };
  [EventType.WEBSOCKET_CHANNEL_JOINED]: {
    connectionId: string;
    userId: string;
    channel: string;
    timestamp: string;
  };
  [EventType.WEBSOCKET_CHANNEL_LEFT]: {
    connectionId: string;
    userId: string;
    channel: string;
    timestamp: string;
  };
  [EventType.USER_REGISTERED]: {
    userId: string;
    username: string;
    timestamp: string;
  };
  [EventType.USER_UPDATED]: {
    userId: string;
    updatedFields: string[];
    timestamp: string;
  };
  [EventType.USER_FOLLOWED]: {
    followerId: string;
    followedId: string;
    timestamp: string;
  };
  [EventType.USER_UNFOLLOWED]: {
    followerId: string;
    followedId: string;
    timestamp: string;
  };
  [EventType.ACHIEVEMENT_UNLOCKED]: {
    userId: string;
    achievementId: string;
    achievementTitle: string;
    timestamp: string;
  };
  [EventType.ACHIEVEMENT_PROGRESS]: {
    userId: string;
    achievementId: string;
    progress: number;
    timestamp: string;
  };
  [EventType.BATTLE_CREATED]: {
    battleId: string;
    creatorId: string;
    battleType: string;
    timestamp: string;
  };
  [EventType.BATTLE_UPDATED]: {
    battleId: string;
    updatedFields: string[];
    timestamp: string;
  };
  [EventType.BATTLE_ENTRY_SUBMITTED]: {
    battleId: string;
    entryId: string;
    userId: string;
    timestamp: string;
  };
  [EventType.BATTLE_VOTING_STARTED]: {
    battleId: string;
    timestamp: string;
  };
  [EventType.BATTLE_COMPLETED]: {
    battleId: string;
    winnerId?: string;
    timestamp: string;
  };
  [EventType.CONTENT_CREATED]: {
    contentId: string;
    creatorId: string;
    contentType: string;
    timestamp: string;
  };
  [EventType.CONTENT_UPDATED]: {
    contentId: string;
    creatorId: string;
    updatedFields: string[];
    timestamp: string;
  };
  [EventType.CONTENT_DELETED]: {
    contentId: string;
    creatorId: string;
    timestamp: string;
  };
  [EventType.CONTENT_COMMENT_ADDED]: {
    contentId: string;
    commentId: string;
    userId: string;
    timestamp: string;
  };
  [EventType.CONTENT_REACTION_ADDED]: {
    contentId: string;
    userId: string;
    reactionType: string;
    timestamp: string;
  };
  [EventType.CONTENT_REACTION_REMOVED]: {
    contentId: string;
    userId: string;
    reactionType: string;
    timestamp: string;
  };
  [EventType.CONTENT_MODERATED]: {
    contentId: string;
    moderatorId: string;
    decision: string;
    timestamp: string;
  };
  [EventType.CONTENT_MODERATION_APPEALED]: {
    contentId: string;
    userId: string;
    reason: string;
    timestamp: string;
  };
  [EventType.CONTENT_REPORTED]: {
    contentId: string;
    reporterId: string;
    reason: string;
    timestamp: string;
  };
  [EventType.MEDIA_UPLOADED]: {
    userId: string;
    mediaId: string;
    mediaType: string;
    timestamp: string;
  };
  [EventType.MEDIA_PROCESSED]: {
    mediaId: string;
    success: boolean;
    timestamp: string;
  };
  [EventType.TOKEN_PRICE_UPDATED]: {
    price: number;
    change: number;
    timestamp: string;
  };
  [EventType.TOKEN_MILESTONE_REACHED]: {
    milestone: string;
    marketCap: number;
    timestamp: string;
  };
  [EventType.TOKEN_TRANSACTION_PROCESSED]: {
    transactionId: string;
    timestamp: string;
  };
  [EventType.WALLET_CONNECTED]: {
    userId: string;
    walletAddress: string;
    timestamp: string;
  };
  [EventType.USER_BENEFITS_UPDATED]: {
    userId: string;
    tier: string;
    holdings: number;
    timestamp: string;
  };
  [EventType.NOTIFICATION_CREATED]: {
    notificationId: string;
    userId: string;
    type: string;
    timestamp: string;
  };
  [EventType.NOTIFICATION_READ]: {
    notificationId: string;
    userId: string;
    timestamp: string;
  };
  [EventType.NOTIFICATION_DELETED]: {
    notificationId: string;
    userId: string;
    timestamp: string;
  };
}

/**
 * Enhanced event emitter that provides type safety for events
 * Supports both local event emission and Redis pub/sub for distributed events
 */
export class EventEmitter {
  private readonly localEmitter: NodeEventEmitter;
  private readonly redisPublisher?: Redis;
  private readonly redisSubscriber?: Redis;
  private readonly handlers: Map<EventType, Array<EventHandler>> = new Map();
  private readonly logger?: Logger;

  constructor(options?: {
    redisUrl?: string;
    redisPassword?: string;
    logger?: Logger;
  }) {
    this.localEmitter = new NodeEventEmitter();
    this.logger = options?.logger;
    
    // Set up Redis if URL is provided
    if (options?.redisUrl) {
      const redisOptions = {
        password: options.redisPassword,
        maxRetriesPerRequest: null,
      };
      
      this.redisPublisher = new Redis(options.redisUrl, redisOptions);
      this.redisSubscriber = new Redis(options.redisUrl, redisOptions);
      
      // Initialize Redis subscription
      this.initRedisSubscriptions();
    }
  }

  /**
   * Initialize Redis subscriptions for all event types
   */
  private initRedisSubscriptions() {
    if (!this.redisSubscriber) return;
    
    // Subscribe to all event channels (with namespace)
    const eventValues = Object.values(EventType);
    const eventChannels = eventValues.map(event => `events:${event}`);
    
    this.redisSubscriber.subscribe(...eventChannels, (err) => {
      if (err) {
        this.logger?.error({ err }, 'Failed to subscribe to Redis channels');
        return;
      }
      
      this.logger?.info({ channels: eventChannels.length }, 'Subscribed to Redis event channels');
    });
    
    // Handle incoming messages
    this.redisSubscriber.on('message', (channel, message) => {
      try {
        const event = channel.replace('events:', '') as EventType;
        const payload = JSON.parse(message);
        
        // Process the event locally (don't re-publish to Redis)
        this.processLocalEvent(event, payload);
      } catch (error) {
        this.logger?.error({ error, channel, message }, 'Error processing Redis event');
      }
    });
  }

  /**
   * Register a handler for a specific event type
   * Returns an unsubscribe function
   */
  on<T extends EventType>(event: T, handler: EventHandler<EventPayloadMap[T]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    
    this.handlers.get(event)!.push(handler as EventHandler);
    
    // Add to local event emitter
    this.localEmitter.on(event, handler);
    
    // Return unsubscribe function
    return () => this.off(event, handler as EventHandler<any>);
  }

  /**
   * Remove a handler for a specific event type
   */
  off<T extends EventType>(event: T, handler: EventHandler<EventPayloadMap[T]>): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    
    const index = handlers.indexOf(handler as EventHandler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.localEmitter.off(event, handler);
    }
  }

  /**
   * Emit an event with typed payload
   * Emits the event locally and publishes to Redis if available
   */
  async emit<T extends EventType>(event: T, data: EventPayloadMap[T]): Promise<void> {
    this.logger?.debug({ event, data }, 'Emitting event');
    
    // Add timestamp if not present
    const payload = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    };
    
    // Emit locally
    this.processLocalEvent(event, payload);
    
    // Publish to Redis if available
    if (this.redisPublisher) {
      try {
        await this.redisPublisher.publish(
          `events:${event}`,
          JSON.stringify(payload)
        );
      } catch (error) {
        this.logger?.error({ error, event, payload }, 'Failed to publish event to Redis');
        // Continue execution - local event processing already happened
      }
    }
  }

  /**
   * Process an event locally through the NodeEventEmitter
   */
  private processLocalEvent<T extends EventType>(event: T, data: EventPayloadMap[T]): void {
    try {
      this.localEmitter.emit(event, data);
    } catch (error) {
      this.logger?.error({ error, event, data }, 'Error in event handler');
    }
  }
}

// Create default event emitter with Redis connection
export function createEventEmitter(logger?: Logger): EventEmitter {
  return new EventEmitter({
    redisUrl: config.redis.url,
    redisPassword: config.redis.password,
    logger,
  });
}
