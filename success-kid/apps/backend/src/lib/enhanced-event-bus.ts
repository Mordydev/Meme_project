/**
 * Enhanced Event Bus using Redis Streams
 * 
 * Implements a more reliable and scalable event distribution system
 * using Redis Streams instead of traditional pub/sub
 */
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { EventType } from './event-bus';

/**
 * Event interface for standardized event structure
 */
export interface Event {
  id: string;
  type: string;
  data: any;
  metadata?: {
    userId?: string;
    requestId?: string;
    source?: string;
    [key: string]: any;
  };
  timestamp: string;
}

/**
 * Event delivery options
 */
export interface EventOptions {
  /**
   * Dedicated streams for specific event types
   * If true, creates a separate stream for this event type
   */
  dedicatedStream?: boolean;
  
  /**
   * Event priority (higher number = higher priority)
   * Default: 0
   */
  priority?: number;
  
  /**
   * Additional event metadata
   */
  metadata?: Record<string, any>;
  
  /**
   * If true, guarantees at-least-once delivery with acknowledgment
   * Default: false (at-most-once delivery)
   */
  guaranteed?: boolean;
  
  /**
   * Maximum length of the stream
   * Default: 1000 events
   */
  maxStreamLength?: number;
}

/**
 * Consumer group configuration
 */
export interface ConsumerGroupConfig {
  /**
   * Name of the consumer group
   */
  name: string;
  
  /**
   * ID to start consuming from
   * Default: '0' (beginning of stream)
   */
  startId?: string;
  
  /**
   * Name of this consumer instance
   * Default: generated UUID
   */
  consumerName?: string;
  
  /**
   * Block timeout in milliseconds
   * Default: 1000ms
   */
  blockMs?: number;
  
  /**
   * Count of events to fetch per read
   * Default: 10
   */
  count?: number;
  
  /**
   * Auto-acknowledge events
   * Default: true
   */
  autoAck?: boolean;
}

/**
 * Event subscription options
 */
export interface SubscriptionOptions {
  /**
   * Batch size for processing
   * Default: 1
   */
  batchSize?: number;
  
  /**
   * Filter function to determine if an event should be processed
   */
  filter?: (event: Event) => boolean;
  
  /**
   * Consumer group configuration
   * If provided, uses consumer groups for reliable delivery
   */
  consumerGroup?: ConsumerGroupConfig;
}

/**
 * Enhanced EventBus for publishing and subscribing to events
 * Uses Redis Streams for reliable event delivery
 */
export class EnhancedEventBus {
  /**
   * Default stream name for general events
   */
  private readonly DEFAULT_STREAM = 'events:all';
  
  /**
   * Stream prefix for dedicated event streams
   */
  private readonly STREAM_PREFIX = 'events:';
  
  /**
   * Main Redis client for publishing
   */
  private redis: Redis;
  
  /**
   * Subscriber Redis client for reading/consuming
   */
  private subscriberRedis: Redis;
  
  /**
   * Local event subscribers
   */
  private subscribers: Map<string, Array<{
    callback: (data: any) => void | Promise<void>;
    options: SubscriptionOptions;
  }>> = new Map();
  
  /**
   * Consumer groups being processed
   */
  private consumerGroups: Set<string> = new Set();
  
  /**
   * Service identifier for this instance
   */
  private serviceId: string;
  
  /**
   * Create a new EnhancedEventBus instance
   * @param redis Redis client for publishing
   * @param serviceId Unique identifier for this service instance
   */
  constructor(redis: Redis, serviceId?: string) {
    this.redis = redis;
    // Create a duplicate connection for subscribing to prevent blocking
    this.subscriberRedis = redis.duplicate();
    this.serviceId = serviceId || `service-${uuidv4().slice(0, 8)}`;
    
    // Log service info
    logger.info(`Enhanced EventBus initialized with service ID: ${this.serviceId}`);
    
    // Setup health check interval
    setInterval(this.checkStreamHealth.bind(this), 60000); // Every minute
  }
  
  /**
   * Publish an event to the stream
   * @param eventType Type of event
   * @param data Event data
   * @param options Publishing options
   * @returns Event ID
   */
  async publish(
    eventType: EventType | string,
    data: any,
    options: EventOptions = {}
  ): Promise<string> {
    try {
      // Create standardized event
      const eventId = uuidv4();
      const event: Event = {
        id: eventId,
        type: eventType,
        data,
        metadata: {
          ...(options.metadata || {}),
          serviceId: this.serviceId,
          priority: options.priority || 0,
        },
        timestamp: new Date().toISOString()
      };
      
      // Determine which stream to use
      const streamName = options.dedicatedStream
        ? `${this.STREAM_PREFIX}${eventType}`
        : this.DEFAULT_STREAM;
      
      // Convert event to Redis hash format
      const eventFields = [
        'id', eventId,
        'type', event.type,
        'data', JSON.stringify(event.data),
        'metadata', JSON.stringify(event.metadata || {}),
        'timestamp', event.timestamp
      ];
      
      // Add to Redis Stream
      const result = await this.redis.xadd(
        streamName,
        'MAXLEN', '~', options.maxStreamLength || 1000,
        '*', // Auto-generate ID
        ...eventFields
      );
      
      // Call local subscribers directly for immediate processing
      this.notifyLocalSubscribers(eventType, data, event);
      
      logger.debug(`Event published: ${eventType}`, { 
        streamName,
        eventId,
        streamEntryId: result
      });
      
      return eventId;
    } catch (error) {
      logger.error(`Failed to publish event: ${eventType}`, { error, data });
      throw error;
    }
  }
  
  /**
   * Subscribe to an event type
   * @param eventType Type of event to subscribe to
   * @param callback Function to call when event occurs
   * @param options Subscription options
   * @returns Unsubscribe function
   */
  subscribe(
    eventType: EventType | string,
    callback: (data: any, event?: Event) => void | Promise<void>,
    options: SubscriptionOptions = {}
  ): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    // Add to local subscribers
    const subscribers = this.subscribers.get(eventType)!;
    subscribers.push({ callback, options });
    
    // If using consumer groups, set up the group
    if (options.consumerGroup) {
      this.setupConsumerGroup(eventType, options.consumerGroup);
    }
    
    logger.debug(`Subscribed to event type: ${eventType}`, {
      subscriberCount: subscribers.length,
      usingConsumerGroup: !!options.consumerGroup
    });
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        const index = callbacks.findIndex(sub => sub.callback === callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
          logger.debug(`Unsubscribed from event type: ${eventType}`);
        }
      }
    };
  }
  
  /**
   * Set up a consumer group for a stream
   * @param eventType Event type
   * @param config Consumer group configuration
   */
  private async setupConsumerGroup(
    eventType: EventType | string,
    config: ConsumerGroupConfig
  ): Promise<void> {
    try {
      // Determine stream name
      const streamName = `${this.STREAM_PREFIX}${eventType}`;
      const groupKey = `${streamName}:${config.name}`;
      
      // Skip if we're already processing this group
      if (this.consumerGroups.has(groupKey)) {
        return;
      }
      
      // Create the stream if it doesn't exist
      try {
        await this.redis.xgroup('CREATE', streamName, config.name, config.startId || '0', 'MKSTREAM');
        logger.info(`Created consumer group ${config.name} for stream ${streamName}`);
      } catch (err: any) {
        // Ignore "BUSYGROUP Consumer Group name already exists" error
        if (!err.message.includes('BUSYGROUP')) {
          throw err;
        }
      }
      
      // Mark this consumer group as being processed
      this.consumerGroups.add(groupKey);
      
      // Start consuming
      this.startConsuming(eventType, config);
      
      logger.info(`Set up consumer group for ${eventType}`, { 
        stream: streamName,
        group: config.name,
        consumer: config.consumerName || `consumer-${this.serviceId}`
      });
    } catch (error) {
      logger.error(`Failed to set up consumer group for ${eventType}`, { error, config });
      throw error;
    }
  }
  
  /**
   * Start consuming events from a stream with a consumer group
   * @param eventType Event type
   * @param config Consumer group configuration
   */
  private startConsuming(
    eventType: EventType | string,
    config: ConsumerGroupConfig
  ): void {
    const streamName = `${this.STREAM_PREFIX}${eventType}`;
    const groupKey = `${streamName}:${config.name}`;
    const consumerName = config.consumerName || `consumer-${this.serviceId}`;
    const blockMs = config.blockMs || 1000;
    const count = config.count || 10;
    
    // Start the consumption loop
    const consumeLoop = async () => {
      // Skip if we've unsubscribed
      if (!this.consumerGroups.has(groupKey)) {
        return;
      }
      
      try {
        // Read from the stream with XREADGROUP
        const streams = await this.subscriberRedis.xreadgroup(
          'GROUP', config.name, consumerName,
          'COUNT', count,
          'BLOCK', blockMs,
          'STREAMS', streamName, '>'  // > means only new messages
        );
        
        if (streams && streams.length > 0) {
          const [streamData] = streams;
          const [_, messages] = streamData;
          
          // Process messages
          for (const message of messages) {
            const [messageId, fields] = message;
            
            // Convert fields array to object
            const data: Record<string, string> = {};
            for (let i = 0; i < fields.length; i += 2) {
              data[fields[i]] = fields[i + 1];
            }
            
            // Parse the event
            const event: Event = {
              id: data.id,
              type: data.type,
              data: JSON.parse(data.data),
              metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
              timestamp: data.timestamp
            };
            
            // Get subscribers for this event type
            const subscribers = this.subscribers.get(eventType) || [];
            for (const { callback, options } of subscribers) {
              if (options.consumerGroup?.name === config.name) {
                try {
                  // Apply filter if any
                  if (options.filter && !options.filter(event)) {
                    continue;
                  }
                  
                  // Call the callback
                  await Promise.resolve(callback(event.data, event));
                  
                  // Acknowledge the message if autoAck is true
                  if (config.autoAck !== false) {
                    await this.subscriberRedis.xack(streamName, config.name, messageId);
                  }
                } catch (callbackError) {
                  logger.error(`Error in event subscriber for ${eventType}`, { 
                    error: callbackError,
                    messageId,
                    eventType
                  });
                }
              }
            }
          }
        }
        
        // Continue the loop
        setImmediate(consumeLoop);
      } catch (error) {
        logger.error(`Error consuming events for ${eventType}`, { error });
        
        // Continue the loop after a short delay
        setTimeout(consumeLoop, 1000);
      }
    };
    
    // Start the consumption loop
    consumeLoop();
  }
  
  /**
   * Notify local subscribers of an event
   * @param eventType Type of event
   * @param data Event data
   * @param event Full event object
   */
  private notifyLocalSubscribers(
    eventType: string, 
    data: any,
    event: Event
  ): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      for (const { callback, options } of subscribers) {
        // Skip consumer group subscribers (they'll get it via streams)
        if (options.consumerGroup) {
          continue;
        }
        
        // Apply filter if any
        if (options.filter && !options.filter(event)) {
          continue;
        }
        
        // Call the callback
        try {
          Promise.resolve(callback(data, event)).catch(error => {
            logger.error(`Error in event subscriber for ${eventType}`, { error });
          });
        } catch (error) {
          logger.error(`Error in event subscriber for ${eventType}`, { error });
        }
      }
    }
  }
  
  /**
   * Check stream health and perform maintenance
   */
  private async checkStreamHealth(): Promise<void> {
    try {
      // Get all event streams
      const keys = await this.redis.keys(`${this.STREAM_PREFIX}*`);
      
      for (const streamName of keys) {
        // Get stream info
        const info = await this.redis.xinfo('STREAM', streamName);
        
        // Log stream health
        const length = info.find((item: any, index: number) => 
          item === 'length' && index % 2 === 0
        );
        
        if (length && typeof length === 'string') {
          const lengthIndex = info.indexOf(length);
          const streamLength = parseInt(info[lengthIndex + 1] as string, 10);
          
          // Log if stream is getting too long
          if (streamLength > 10000) {
            logger.warn(`Stream ${streamName} is getting long: ${streamLength} messages`);
          }
        }
        
        // Check for stuck consumers
        const groups = await this.redis.xinfo('GROUPS', streamName);
        if (groups && groups.length) {
          for (let i = 0; i < groups.length; i++) {
            const groupInfo = groups[i];
            if (Array.isArray(groupInfo)) {
              const pendingIndex = groupInfo.indexOf('pending');
              if (pendingIndex >= 0 && pendingIndex + 1 < groupInfo.length) {
                const pending = parseInt(groupInfo[pendingIndex + 1] as string, 10);
                
                // Log if too many pending messages
                if (pending > 100) {
                  const nameIndex = groupInfo.indexOf('name');
                  const groupName = nameIndex >= 0 && nameIndex + 1 < groupInfo.length 
                    ? groupInfo[nameIndex + 1] 
                    : 'unknown';
                    
                  logger.warn(`Consumer group ${groupName} on stream ${streamName} has ${pending} pending messages`);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to check stream health', { error });
    }
  }
  
  /**
   * Get the list of active subscriptions
   * @returns Array of event types with active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscribers.keys());
  }
  
  /**
   * Get subscriber counts for each event type
   * @returns Map of event types to subscriber counts
   */
  getSubscriberCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    this.subscribers.forEach((subscribers, eventType) => {
      counts[eventType] = subscribers.length;
    });
    
    return counts;
  }
  
  /**
   * Get consumer group statistics
   * @returns Consumer group statistics
   */
  async getConsumerGroupStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    
    try {
      for (const groupKey of this.consumerGroups) {
        const [streamName, groupName] = groupKey.split(':');
        
        // Get group info
        const groupInfo = await this.redis.xinfo('GROUPS', streamName);
        if (groupInfo && groupInfo.length) {
          for (let i = 0; i < groupInfo.length; i++) {
            const group = groupInfo[i];
            if (Array.isArray(group)) {
              const nameIndex = group.indexOf('name');
              const name = nameIndex >= 0 && nameIndex + 1 < group.length 
                ? group[nameIndex + 1] 
                : null;
                
              if (name === groupName) {
                const pendingIndex = group.indexOf('pending');
                const consumersIndex = group.indexOf('consumers');
                
                stats[groupKey] = {
                  pending: pendingIndex >= 0 && pendingIndex + 1 < group.length 
                    ? parseInt(group[pendingIndex + 1] as string, 10) 
                    : 0,
                  consumers: consumersIndex >= 0 && consumersIndex + 1 < group.length 
                    ? parseInt(group[consumersIndex + 1] as string, 10) 
                    : 0
                };
                
                break;
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to get consumer group stats', { error });
    }
    
    return stats;
  }
  
  /**
   * Cleanup and prepare for shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down EnhancedEventBus...');
    
    try {
      // Clear consumer groups
      this.consumerGroups.clear();
      
      // Clear subscribers
      this.subscribers.clear();
      
      // Close Redis connections
      await this.subscriberRedis.quit();
      // Don't close the main Redis connection as it might be shared
      
      logger.info('EnhancedEventBus shutdown complete');
    } catch (error) {
      logger.error('Error during EnhancedEventBus shutdown', { error });
    }
  }
}

// Re-export event types for convenience
export { EventType } from './event-bus';
