import { db } from '../../database'; // Adjusted path
import { notifications, NewNotification } from '../../database/schema/notifications'; // Adjusted path
import { redisClient } from '../../lib/redis/client'; // Adjusted path
import { Logger } from 'pino';
import { eq, and, desc, SQL } from 'drizzle-orm'; // Import desc and SQL
import { randomUUID } from 'crypto'; // For generating notification IDs

// Placeholder for logger import (adjust path as needed)
let logger: Logger;
try {
  const loggerModule = require('../../lib/logger.js'); // Using require for CommonJS
  logger = loggerModule.logger;
} catch (e) {
  console.warn("Logger module not found at '../../lib/logger.js', using console.", e);
  logger = console as any;
}

// Interface for the payload when creating a notification
export interface NotificationPayload {
  userId: string;
  type: string; // e.g., 'new_comment', 'achievement_unlocked'
  title: string;
  message: string;
  data?: Record<string, any>; // Optional context data
  priority?: 'high' | 'normal' | 'low';
}

// Interface for the item stored in the Redis queue
interface NotificationQueueItem {
    id: string; // Notification ID from the database
    userId: string;
    type: string;
    // Add other relevant fields needed for delivery if necessary
}

/**
 * Service for managing and delivering user notifications using a Redis queue.
 */
export class NotificationService {
  private static readonly QUEUE_KEY = 'notifications:queue'; // Redis sorted set key
  private static readonly PROCESSING_INTERVAL_MS = 5000; // Process queue every 5 seconds
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false; // Flag to prevent concurrent processing runs

  // Assuming wsServer instance (from setupWebSocketServer) is injected or accessible
  // For simplicity, using 'any' type here. In a real app, define a proper interface.
  constructor(private readonly wsServer: any) {
      if (!wsServer || typeof wsServer.sendToUser !== 'function') {
          logger.error("NotificationService requires a valid WebSocket server instance with a 'sendToUser' method.");
          // Handle this error appropriately - maybe disable notifications?
      }
  }

  /**
   * Initializes the notification processor interval.
   */
  initialize(): void {
    if (this.processingInterval) {
      logger.warn('Notification processor already initialized.');
      return;
    }

    logger.info(`Initializing notification processor with interval: ${NotificationService.PROCESSING_INTERVAL_MS}ms`);
    this.processingInterval = setInterval(
      () => this.processNotificationQueue(),
      NotificationService.PROCESSING_INTERVAL_MS
    );
  }

  /**
   * Stops the notification processor interval.
   */
  shutdown(): void {
    if (this.processingInterval) {
      logger.info('Shutting down notification processor.');
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Creates a notification, stores it in the database, and adds it to the Redis processing queue.
   * @param payload Data for the notification.
   * @returns The ID of the newly created notification.
   */
  async createNotification(payload: NotificationPayload): Promise<string> {
    const notificationId = randomUUID(); // Generate ID
    const priority = payload.priority || 'normal';
    logger.info('Creating notification', { userId: payload.userId, type: payload.type, priority: priority });

    try {
      // 1. Add to database for persistence
      const newNotificationData: NewNotification = {
        id: notificationId,
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        status: 'pending', // Initial status
        priority: priority,
        // createdAt will use default value
      };

      const [notification] = await db
        .insert(notifications)
        .values(newNotificationData)
        .returning();

      if (!notification) {
          throw new Error('Failed to insert notification into database.');
      }

      // 2. Add to Redis queue for processing
      const queueItem: NotificationQueueItem = {
        id: notification.id,
        userId: payload.userId,
        type: payload.type,
        // Add other necessary fields here if needed for delivery logic
      };
      await this.addToQueue(queueItem, priority);

      logger.info('Notification created and queued successfully', { notificationId: notification.id });
      return notification.id;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Error creating notification', { error: errorMsg, payload });
      throw new Error(`Failed to create notification: ${errorMsg}`);
    }
  }

  /**
   * Processes notifications from the Redis queue based on priority.
   */
  private async processNotificationQueue(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('Notification processing already in progress, skipping run.');
      return;
    }
    if (!redisClient.isConnected()) {
        logger.warn('Cannot process notification queue: Redis not connected.');
        return;
    }

    this.isProcessing = true;
    logger.debug('Starting notification queue processing cycle.');

    try {
      // Fetch a batch of notifications from the sorted set (queue)
      // ZPOPMIN removes and returns the lowest score (highest priority) items
      const batch = await redisClient.getClient().zpopmin(
        NotificationService.QUEUE_KEY,
        10 // Process up to 10 notifications per cycle
      );

      if (!batch || batch.length === 0) {
        logger.debug('Notification queue is empty.');
        this.isProcessing = false;
        return;
      }

      logger.info(`Processing ${batch.length / 2} notifications from queue.`);

      // Process each notification (batch contains key-score pairs)
      for (let i = 0; i < batch.length; i += 2) {
        const notificationJson = batch[i];
        const score = batch[i+1]; // Score represents priority timestamp

        try {
          const item: NotificationQueueItem = JSON.parse(notificationJson);
          await this.deliverNotification(item);
        } catch (parseError) {
          logger.error('Error parsing notification item from queue', { error: parseError, itemJson: notificationJson });
          // Consider moving failed items to a dead-letter queue
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Error processing notification queue', { error: errorMsg });
    } finally {
      this.isProcessing = false;
      logger.debug('Finished notification queue processing cycle.');
    }
  }

   /**
   * Delivers a single notification to the user via WebSocket and updates its status.
   * @param item The notification item from the queue.
   */
  private async deliverNotification(item: NotificationQueueItem): Promise<void> {
      logger.debug(`Attempting to deliver notification ${item.id} to user ${item.userId}`);
      try {
          // 1. Fetch full notification details from DB (optional, if needed for payload)
          // const notification = await db.select().from(notifications).where(eq(notifications.id, item.id)).limit(1);
          // if (!notification[0]) {
          //    logger.error("Notification details not found in DB for delivery", { notificationId: item.id });
          //    return; // Or mark as failed
          // }
          // const payload = notification[0]; // Use full payload if needed

          // For simplicity, sending basic info based on queue item
          const deliveryPayload = {
              id: item.id,
              type: item.type,
              message: `Notification of type ${item.type}`, // Fetch real message if needed
              timestamp: new Date().toISOString()
          };

          // 2. Send via WebSocket
          this.wsServer.sendToUser(item.userId, 'notification:new', deliveryPayload);
          logger.info(`Sent notification ${item.id} via WebSocket to user ${item.userId}`);

          // 3. Update notification status in DB
          await db.update(notifications)
              .set({ status: 'sent', sentAt: new Date() })
              .where(eq(notifications.id, item.id));

      } catch (deliveryError) {
          const errorMsg = deliveryError instanceof Error ? deliveryError.message : String(deliveryError);
          logger.error(`Failed to deliver notification ${item.id}`, { error: errorMsg });
          // Update status to 'failed' in DB
          try {
              await db.update(notifications)
                  .set({ status: 'failed' })
                  .where(eq(notifications.id, item.id));
          } catch (updateError) {
              logger.error(`Failed to mark notification ${item.id} as failed`, { error: updateError });
          }
      }
  }


  /**
   * Adds a notification item to the Redis processing queue (sorted set).
   * The score determines priority (lower score = higher priority).
   * @param item The notification item to queue.
   * @param priority The priority level ('high', 'normal', 'low').
   */
  private async addToQueue(item: NotificationQueueItem, priority: 'high' | 'normal' | 'low'): Promise<void> {
    try {
       if (!redisClient.isConnected()) {
          logger.error('Cannot add notification to queue: Redis not connected', { item });
          // Handle this case - maybe retry later or log persistently?
          throw new Error("Redis not connected");
       }
      const score = this.getPriorityScore(priority);
      const itemJson = JSON.stringify(item);
      await redisClient.getClient().zadd(
        NotificationService.QUEUE_KEY,
        score,
        itemJson
      );
      logger.debug('Notification added to Redis queue', { notificationId: item.id, score });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Error adding notification to Redis queue', { error: errorMsg, item });
      // Rethrow or handle queueing failure
      throw error;
    }
  }

  /**
   * Calculates a score for the Redis sorted set based on priority.
   * Lower scores are processed first. Uses timestamp to ensure FIFO within the same priority.
   * @param priority The priority level.
   * @returns A numerical score.
   */
  private getPriorityScore(priority: 'high' | 'normal' | 'low'): number {
    const now = Date.now(); // Milliseconds timestamp ensures ordering

    switch (priority) {
      case 'high':
        // High priority items get a score slightly in the past relative to 'normal'
        return now - 100000; // Example offset
      case 'low':
        // Low priority items get a score slightly in the future relative to 'normal'
        return now + 100000; // Example offset
      case 'normal':
      default:
        return now; // Normal priority uses current timestamp
    }
  }

  // --- Add methods for managing notifications (e.g., markAsRead, getNotifications) ---
  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
      logger.debug(`Marking notification as read`, { userId, notificationId });
      try {
          const result = await db.update(notifications)
              .set({ status: 'read', readAt: new Date() })
              .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
          // Check if the result indicates success (might vary by driver, truthy check is basic)
          return !!result;
      } catch (error) {
          logger.error('Failed to mark notification as read', { userId, notificationId, error });
          return false;
      }
  }

  async getNotifications(userId: string, limit: number = 20, offset: number = 0, status?: 'pending' | 'sent' | 'read') {
       logger.debug(`Fetching notifications for user`, { userId, limit, offset, status });
       try {
           const conditions: SQL[] = [eq(notifications.userId, userId)];
           if (status) {
               conditions.push(eq(notifications.status, status));
           }
           const results = await db.select()
               .from(notifications)
               .where(and(...conditions))
               .orderBy(desc(notifications.createdAt))
               .limit(limit)
               .offset(offset);
           return results;
       } catch (error) {
           logger.error('Failed to fetch notifications', { userId, error });
           return [];
       }
  }

}

// Note: Instantiation requires passing the WebSocket server instance.
// This service should likely be instantiated in your main application setup
// after the WebSocket server is initialized.
// Example:
// const wsServer = setupWebSocketServer(httpServer);
// export const notificationService = new NotificationService(wsServer);
