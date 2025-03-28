import Redis from 'ioredis';
import { redisConfig } from '../config/redis';
import { logger } from './logger';

/**
 * Redis client for caching, session management, and pub/sub
 */
class RedisClient {
  private _client: Redis | null = null;
  private _subscriber: Redis | null = null;

  /**
   * Get the Redis client instance
   */
  get client(): Redis {
    if (!this._client) {
      this.connect();
    }
    return this._client as Redis;
  }

  /**
   * Get the Redis subscriber instance for PubSub
   */
  get subscriber(): Redis {
    if (!this._subscriber) {
      this._subscriber = new Redis(redisConfig.url, redisConfig.options);
      
      this._subscriber.on('error', (error) => {
        logger.error('Redis subscriber error', { error });
      });
    }
    return this._subscriber;
  }

  /**
   * Connect to Redis
   */
  private connect(): void {
    if (this._client) return;

    this._client = new Redis(redisConfig.url, redisConfig.options);

    this._client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this._client.on('error', (error) => {
      logger.error('Redis client error', { error });
    });

    this._client.on('close', () => {
      logger.warn('Redis client connection closed');
    });
  }

  /**
   * Disconnect Redis client
   */
  async disconnect(): Promise<void> {
    if (this._client) {
      await this._client.quit();
      this._client = null;
    }

    if (this._subscriber) {
      await this._subscriber.quit();
      this._subscriber = null;
    }
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(`${redisConfig.keyPrefix}${key}`);
    } catch (error) {
      logger.error('Redis get error', { error, key });
      return null;
    }
  }

  /**
   * Set a value in Redis with optional expiration
   */
  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    try {
      const prefixedKey = `${redisConfig.keyPrefix}${key}`;
      
      if (expireSeconds) {
        await this.client.set(prefixedKey, value, 'EX', expireSeconds);
      } else {
        await this.client.set(prefixedKey, value);
      }
    } catch (error) {
      logger.error('Redis set error', { error, key });
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(`${redisConfig.keyPrefix}${key}`);
    } catch (error) {
      logger.error('Redis del error', { error, key });
    }
  }

  /**
   * Check if a key exists in Redis
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(`${redisConfig.keyPrefix}${key}`);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error', { error, key });
      return false;
    }
  }

  /**
   * Add a value to a Redis set
   */
  async sadd(key: string, ...members: string[]): Promise<void> {
    try {
      await this.client.sadd(`${redisConfig.keyPrefix}${key}`, ...members);
    } catch (error) {
      logger.error('Redis sadd error', { error, key });
    }
  }

  /**
   * Remove a value from a Redis set
   */
  async srem(key: string, ...members: string[]): Promise<void> {
    try {
      await this.client.srem(`${redisConfig.keyPrefix}${key}`, ...members);
    } catch (error) {
      logger.error('Redis srem error', { error, key });
    }
  }

  /**
   * Get all members of a Redis set
   */
  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(`${redisConfig.keyPrefix}${key}`);
    } catch (error) {
      logger.error('Redis smembers error', { error, key });
      return [];
    }
  }

  /**
   * Publish a message to a Redis channel
   */
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(`${redisConfig.keyPrefix}${channel}`, message);
    } catch (error) {
      logger.error('Redis publish error', { error, channel });
    }
  }

  /**
   * Subscribe to a Redis channel
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(`${redisConfig.keyPrefix}${channel}`);
      
      this.subscriber.on('message', (chan, message) => {
        if (chan === `${redisConfig.keyPrefix}${channel}`) {
          callback(message);
        }
      });
    } catch (error) {
      logger.error('Redis subscribe error', { error, channel });
    }
  }

  /**
   * Unsubscribe from a Redis channel
   */
  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(`${redisConfig.keyPrefix}${channel}`);
    } catch (error) {
      logger.error('Redis unsubscribe error', { error, channel });
    }
  }
}

// Export a singleton instance
export const redisClient = new RedisClient();
