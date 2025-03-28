import 'dotenv/config'; // Load environment variables
import Redis, { RedisOptions } from 'ioredis';
import { Logger } from 'pino';

// Placeholder for logger import (adjust path as needed)
let logger: Logger;
try {
  const loggerModule = require('../logger.js'); // Using require for CommonJS, assuming logger is in ../lib
  logger = loggerModule.logger;
} catch (e) {
  console.warn("Logger module not found at '../logger.js', using console.", e);
  logger = console as any;
}

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  logger.error('REDIS_URL environment variable is not set.');
  // Decide if this is critical - maybe allow fallback to a mock/disabled client?
  // For now, we'll throw an error.
  throw new Error('REDIS_URL environment variable is required.');
}

// Connection options based on the plan
const connectionOptions: RedisOptions = {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number): number | null {
    // Exponential backoff with a cap
    const delay = Math.min(times * 100, 3000); // 100ms, 200ms, ..., 3000ms max
    logger.warn(`Redis connection retry attempt ${times}, delaying for ${delay}ms`);
    return delay;
  },
  enableReadyCheck: true, // Ensures commands are only sent when ready
  // keepAlive: 10000, // keepAlive is often managed by TCP stack, ioredis might not need explicit setting
  connectionName: 'success-kid-app', // Helps identify connections in Redis monitoring
  // Add TLS options if connecting to a cloud provider that requires it
  // tls: {},
  // Enable lazyConnect to avoid immediate connection attempt if Redis might not be ready
  lazyConnect: true,
};

/**
 * Encapsulates the ioredis client for better management and abstraction.
 * Provides main client, subscription client, health checks, and connection status.
 */
export class RedisClient {
  private client: Redis;
  private subscriptionClient: Redis | null = null;
  private isReady = false;
  private isConnecting = false; // Track connection attempts

  constructor() {
    logger.info('Initializing RedisClient...');
    // Add non-null assertion '!' as redisUrl is checked above
    this.client = new Redis(redisUrl!, connectionOptions);
    this.setupEventHandlers(this.client, 'main');
    this.connectClient(); // Initiate connection explicitly due to lazyConnect
  }

  /**
   * Initiates the connection attempt for the main client.
   */
  private async connectClient(): Promise<void> {
      if (this.isReady || this.isConnecting) {
          return;
      }
      this.isConnecting = true;
      logger.info('Attempting to connect main Redis client...');
      try {
          await this.client.connect();
          // Ready event will set isReady and isConnecting
      } catch (error) {
          logger.error('Initial Redis connection failed', { error });
          this.isConnecting = false; // Allow retry later if needed
      }
  }

  /**
   * Sets up standard event handlers for a Redis client instance.
   * @param clientInstance The ioredis client instance.
   * @param clientName A name for logging purposes ('main' or 'subscription').
   */
  private setupEventHandlers(clientInstance: Redis, clientName: string) {
    clientInstance.on('connect', () => {
      logger.info(`Redis client (${clientName}) connected.`);
      // Note: 'connect' doesn't mean ready for commands yet.
    });

    clientInstance.on('ready', () => {
      logger.info(`Redis client (${clientName}) ready.`);
      if (clientName === 'main') {
          this.isReady = true;
          this.isConnecting = false;
      }
      // Handle subscription client readiness if needed
    });

    clientInstance.on('error', (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Redis client (${clientName}) error: ${errorMessage}`, { error: err });
      // If main client errors significantly, might set isReady to false
      if (clientName === 'main') {
          this.isReady = false;
          this.isConnecting = false;
      }
    });

    clientInstance.on('close', () => {
      logger.warn(`Redis client (${clientName}) connection closed.`);
      if (clientName === 'main') {
          this.isReady = false;
          this.isConnecting = false; // Reset connecting flag
      }
    });

    // Add type annotation for delay parameter
    clientInstance.on('reconnecting', (delay: number) => {
      logger.info(`Redis client (${clientName}) reconnecting in ${delay}ms...`);
       if (clientName === 'main') {
          this.isConnecting = true; // Mark as connecting during reconnect
      }
    });

    clientInstance.on('end', () => {
        logger.warn(`Redis client (${clientName}) connection ended. No more reconnections.`);
         if (clientName === 'main') {
            this.isReady = false;
            this.isConnecting = false;
        }
    });
  }

  /**
   * Gets the main Redis client instance for commands.
   * Ensures connection is attempted if not already connected/connecting.
   * @returns The ioredis client instance.
   */
  getClient(): Redis {
    if (!this.isReady && !this.isConnecting) {
        this.connectClient(); // Attempt connection if needed
    }
    return this.client;
  }

  /**
   * Gets a dedicated Redis client instance for Pub/Sub operations.
   * Creates a duplicate connection if one doesn't exist.
   * @returns The ioredis client instance for subscriptions.
   */
  getSubscriptionClient(): Redis {
    if (!this.subscriptionClient) {
      logger.info('Creating dedicated Redis subscription client...');
      this.subscriptionClient = this.client.duplicate();
      this.setupEventHandlers(this.subscriptionClient, 'subscription');
      // Subscription client connects automatically when subscribe/psubscribe is called
    }
    return this.subscriptionClient;
  }

  /**
   * Checks if the main Redis client is connected and ready for commands.
   * @returns True if the client is ready, false otherwise.
   */
  isConnected(): boolean {
    // Use client.status for a more accurate check
    return this.client.status === 'ready';
    // return this.isReady; // Previous implementation
  }

  /**
   * Gracefully closes all Redis connections (main and subscription).
   */
  async close(): Promise<void> {
    logger.info('Closing Redis connections...');
    let subClosed = false;
    let mainClosed = false;

    if (this.subscriptionClient) {
      try {
        await this.subscriptionClient.quit();
        logger.info('Subscription Redis client closed.');
        subClosed = true;
      } catch (error) {
         logger.error('Error closing subscription Redis client', { error });
      } finally {
          this.subscriptionClient = null;
      }
    } else {
        subClosed = true; // No subscription client to close
    }

    if (this.client) {
       try {
        await this.client.quit();
        logger.info('Main Redis client closed.');
        mainClosed = true;
       } catch (error) {
           logger.error('Error closing main Redis client', { error });
       }
    } else {
        mainClosed = true; // No main client to close
    }

    this.isReady = false;
    this.isConnecting = false;
    logger.info(`Redis connections closed (Main: ${mainClosed}, Sub: ${subClosed})`);
  }

  /**
   * Performs a health check by pinging the Redis server.
   * @returns True if the ping is successful ('PONG'), false otherwise.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const pingResponse = await this.client.ping();
      const success = pingResponse === 'PONG';
      if (!success) {
          logger.warn('Redis health check failed: Unexpected PING response.', { response: pingResponse });
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Redis health check failed with error.', { error: errorMessage });
      return false;
    }
  }
}

// Export a singleton instance for easy use across the application
export const redisClient = new RedisClient();
