import { Server as SocketIoServer, Socket } from 'socket.io';
import { redisClient } from '../lib/redis/client'; // Import Redis client for subscribing
import { logger } from '../lib/logger';
import { EventType } from '../lib/event-bus'; // Assuming EventType enum exists

// Define structure for notification payloads
interface NotificationPayload {
    type: string; // e.g., 'POINTS_EARNED', 'ACHIEVEMENT_UNLOCKED'
    message: string;
    data?: any; // Additional data specific to the notification
    timestamp: string;
}

/**
 * Sets up Redis subscriptions and defines handlers for different domain events.
 * Emits formatted notifications to relevant user rooms via Socket.IO.
 * 
 * @param io Socket.IO server instance
 */
export function setupWebSocketEventHandlers(io: SocketIoServer) {
    logger.info('Setting up WebSocket event handlers and Redis subscriptions...');

    // Create a dedicated Redis client for subscriptions
    const subClient = redisClient.getClient().duplicate();
    subClient.on('error', (err) => logger.error('Redis Subscription Client Error', { error: err }));

    // --- Subscribe to relevant Redis channels ---
    
    // Example: Subscribe to POINTS_AWARDED events
    subClient.subscribe(EventType.POINTS_AWARDED, (message, channel) => {
        let parsedEventData: any; 
        try {
            logger.debug(`Received message on channel ${channel}`, { message });
            // Explicitly check if message is a string before parsing
            if (typeof message === 'string') {
                parsedEventData = JSON.parse(message); 
            } else {
                 logger.warn(`Received non-string message on channel ${channel}`, { message });
                 return; // Exit if message is not a string
            }
            
            // TODO: Validate parsedEventData structure using Zod or similar
            
            const userId = parsedEventData.userId;
            if (!userId) {
                logger.warn('POINTS_AWARDED event missing userId', { eventData: parsedEventData });
                return;
            }

            // Format notification payload
            const notification: NotificationPayload = {
                type: 'POINTS_EARNED',
                message: `You earned ${parsedEventData.amount} points for ${parsedEventData.source}!`,
                data: { 
                    amount: parsedEventData.amount, 
                    source: parsedEventData.source,
                    newBalance: parsedEventData.total 
                },
                timestamp: new Date().toISOString()
            };

            // Emit to the specific user's room
            const room = `user:${userId}`;
            io.to(room).emit('notification', notification);
            logger.info(`Sent 'POINTS_EARNED' notification to ${room}`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Log the error without accessing the potentially problematic 'message' variable here
            logger.error(`Error handling message on channel ${channel}`, { error: errorMessage }); 
        }
    });

    // Example: Subscribe to ACHIEVEMENT_UNLOCKED events
    subClient.subscribe(EventType.ACHIEVEMENT_UNLOCKED, (message, channel) => {
         let parsedEventData: any;
         try {
            logger.debug(`Received message on channel ${channel}`, { message });
            // Explicitly check if message is a string before parsing
            if (typeof message === 'string') {
                 parsedEventData = JSON.parse(message);
            } else {
                 logger.warn(`Received non-string message on channel ${channel}`, { message });
                 return; // Exit if message is not a string
            }
            
            // TODO: Validate parsedEventData structure using Zod or similar
            
            const userId = parsedEventData.userId;
            if (!userId) {
                logger.warn('ACHIEVEMENT_UNLOCKED event missing userId', { eventData: parsedEventData });
                return;
            }

            const notification: NotificationPayload = {
                type: 'ACHIEVEMENT_UNLOCKED',
                message: `Achievement Unlocked: ${parsedEventData.achievementName}! (+${parsedEventData.pointsAwarded} points)`,
                data: { 
                    achievementId: parsedEventData.achievementId,
                    achievementName: parsedEventData.achievementName,
                    pointsAwarded: parsedEventData.pointsAwarded
                },
                timestamp: parsedEventData.timestamp || new Date().toISOString()
            };

            const room = `user:${userId}`;
            io.to(room).emit('notification', notification);
            logger.info(`Sent 'ACHIEVEMENT_UNLOCKED' notification to ${room}`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
             // Log the error without accessing the potentially problematic 'message' variable here
            logger.error(`Error handling message on channel ${channel}`, { error: errorMessage });
        }
    });

    // TODO: Add subscriptions and handlers for other events:
    // - NEW_COMMENT_ON_POST (requires content service to publish event with post author ID)
    // - NEW_REACTION_ON_POST (requires content service to publish event with post author ID)
    // - MARKET_MILESTONE_REACHED (requires market service to publish event)
    // - SIGNIFICANT_PRICE_CHANGE (requires market service to publish event)

    logger.info('WebSocket event handlers subscribed to Redis channels.');

    // Note: This function only sets up subscriptions. The actual socket event handlers 
    // (like socket.on('chat message', ...)) should be registered in websockets/index.ts 
    // or a dedicated file called by it, using the 'registerEventHandlers' placeholder.
}

/**
 * Registers client-side event handlers for a connected socket.
 * This is the function intended to be called from io.on('connection').
 * 
 * @param io Socket.IO server instance
 * @param socket The connected socket instance
 */
export function registerSocketEventHandlers(io: SocketIoServer, socket: Socket): void {
    const userId = socket.data.user?.id || 'unknown';
    logger.debug(`Registering event handlers for socket ${socket.id} (User: ${userId})`);

    // Example: Handle a 'ping' event from the client
    socket.on('client:ping', (callback) => {
        logger.debug(`Received ping from socket ${socket.id}`);
        if (typeof callback === 'function') {
            callback({ timestamp: Date.now() }); // Acknowledge the ping
        }
    });

    // TODO: Add handlers for any events clients might send to the server
    // e.g., socket.on('mark_notification_read', (notificationId) => { ... });
    // e.g., socket.on('join_channel', (channelName) => { socket.join(channelName); });
}
