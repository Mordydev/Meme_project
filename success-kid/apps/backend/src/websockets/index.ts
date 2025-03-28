import { Server as HttpServer } from 'http'; // Import HttpServer type
import { Server as SocketIoServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient } from '../lib/redis/client'; // Import our RedisClient instance
// import { verifyToken } from '../lib/auth'; // Placeholder for auth token verification
import { Logger } from 'pino';
// import { registerEventHandlers } from './handlers'; // Placeholder for event handlers registration

// --- Placeholder Types/Functions (Replace with actual imports/implementations) ---
interface User {
    id: string;
    // Add other relevant user properties from your auth system
}

// Placeholder for verifyToken function
async function verifyToken(token: string): Promise<User | null> {
    // Replace with your actual token verification logic (e.g., using Clerk, JWT library)
    console.warn("Using placeholder verifyToken function.");
    if (token === 'valid-token-user123') {
        return { id: 'user123' };
    }
    return null;
}

// Placeholder for registerEventHandlers function
function registerEventHandlers(io: SocketIoServer, socket: Socket): void {
    console.warn(`Placeholder registerEventHandlers called for socket ${socket.id}`);
    // Implement actual event handlers (e.g., socket.on('chat message', ...)) in './handlers.ts'
}

// Placeholder for logger import (adjust path as needed)
let logger: Logger;
try {
  const loggerModule = require('../lib/logger.js'); // Using require for CommonJS
  logger = loggerModule.logger;
} catch (e) {
  console.warn("Logger module not found at '../lib/logger.js', using console.", e);
  logger = console as any;
}
// --- End Placeholders ---


/**
 * Sets up and configures the Socket.IO server with Redis adapter for real-time communication.
 * @param httpServer The underlying HTTP server instance.
 * @returns An object containing the Socket.IO server instance and helper methods for emitting events.
 */
export function setupWebSocketServer(httpServer: HttpServer) {
  logger.info('Setting up WebSocket server...');

  // Create dedicated Redis clients for pub/sub using the RedisClient instance
  // These duplicates ensure pub/sub operations don't block regular commands.
  const pubClient = redisClient.getClient().duplicate();
  const subClient = redisClient.getClient().duplicate();

  // Log errors for pub/sub clients specifically
  pubClient.on('error', (err) => logger.error('Redis Pub Client Error', { error: err }));
  subClient.on('error', (err) => logger.error('Redis Sub Client Error', { error: err }));

  // Create Socket.io server instance
  const io = new SocketIoServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*', // Allow requests from specified origin or all
      methods: ['GET', 'POST'],
      credentials: true // Important for passing auth tokens/cookies if needed
    },
    adapter: createAdapter(pubClient, subClient), // Use Redis adapter for horizontal scaling
    transports: ['websocket', 'polling'], // Allow both transports for broader compatibility
    pingInterval: 25000, // How often to send pings
    pingTimeout: 20000, // How long to wait for pong before disconnecting
    // cookie: false // Default is false, explicitly set if needed
  });

  // --- Connection Limiting (Simple IP-based example) ---
  const connectionsByIp = new Map<string, number>();
  const MAX_CONNECTIONS_PER_IP = 10; // Adjust as needed

  // --- Authentication Middleware ---
  io.use(async (socket, next) => {
    const ip = socket.handshake.address; // Get client IP address
    logger.debug('WebSocket connection attempt', { socketId: socket.id, ip: ip });

    try {
      // --- IP Connection Limit Check ---
      const currentConnections = connectionsByIp.get(ip) || 0;
      if (currentConnections >= MAX_CONNECTIONS_PER_IP) {
        logger.warn('WebSocket connection limit exceeded for IP', { ip, limit: MAX_CONNECTIONS_PER_IP });
        return next(new Error('Connection limit exceeded'));
      }

      // --- Token Authentication ---
      // Prefer 'auth.token' (recommended by Socket.IO v3+) over query parameters
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token || typeof token !== 'string') {
        logger.warn('WebSocket authentication failed: No token provided', { socketId: socket.id });
        return next(new Error('Authentication required: No token provided.'));
      }

      // Verify the token using your auth logic
      const user = await verifyToken(token);

      if (!user) {
        logger.warn('WebSocket authentication failed: Invalid token', { socketId: socket.id });
        return next(new Error('Authentication failed: Invalid token.'));
      }

      // --- Success ---
      // Store user data in the socket instance for easy access in event handlers
      socket.data.user = user;
      // Increment IP connection count
      connectionsByIp.set(ip, currentConnections + 1);
      logger.debug('WebSocket authentication successful', { socketId: socket.id, userId: user.id });

      next(); // Proceed with the connection

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('WebSocket authentication middleware error', { error: errorMsg, socketId: socket.id });
      next(new Error('Authentication error')); // Pass a generic error to the client
    }
  });

  // --- Connection Handler ---
  io.on('connection', (socket: Socket) => {
    // User data should be available from the middleware
    const user = socket.data.user as User;
    const ip = socket.handshake.address;

    if (!user) {
        // This shouldn't happen if middleware is correct, but handle defensively
        logger.error('WebSocket connection established but user data missing', { socketId: socket.id });
        socket.disconnect(true); // Force disconnect
        return;
    }

    logger.info('WebSocket client connected', { userId: user.id, socketId: socket.id });

    // --- Room Management ---
    // Join a room specific to the user ID for targeted messaging
    socket.join(`user:${user.id}`);
    logger.debug(`Socket ${socket.id} joined room user:${user.id}`);

    // --- Register Event Handlers ---
    // Pass the io instance and the specific socket to the handler registration function
    registerEventHandlers(io, socket);

    // --- Disconnection Handler ---
    socket.on('disconnect', (reason) => {
      // Decrement IP connection count
      const currentConnections = connectionsByIp.get(ip) || 1;
      if (currentConnections <= 1) {
          connectionsByIp.delete(ip);
      } else {
          connectionsByIp.set(ip, currentConnections - 1);
      }

      logger.info('WebSocket client disconnected', {
        userId: user.id,
        socketId: socket.id,
        reason: reason,
        remainingConnectionsForIp: connectionsByIp.get(ip) || 0
      });
      // Perform any cleanup needed on disconnect (e.g., presence tracking)
    });

    // Optional: Send a welcome message or initial state
    socket.emit('connection:success', { message: 'Successfully connected!', userId: user.id });

  });

  logger.info('WebSocket server setup complete.');

  // --- Return Interface for Server-Side Emitting ---
  // Provides methods for sending events from other parts of the backend
  return {
    io, // The main Socket.IO server instance
    /**
     * Sends an event to a specific user's room.
     * @param userId The ID of the target user.
     * @param event The name of the event.
     * @param data The data payload for the event.
     */
    sendToUser: (userId: string, event: string, data: any) => {
      const room = `user:${userId}`;
      logger.debug(`Sending event '${event}' to room ${room}`, { data });
      io.to(room).emit(event, data);
    },
    /**
     * Sends an event to all connected clients.
     * @param event The name of the event.
     * @param data The data payload for the event.
     */
    sendToAll: (event: string, data: any) => {
      logger.debug(`Sending event '${event}' to all clients`, { data });
      io.emit(event, data);
    },
    /**
     * Broadcasts a system-wide message to all connected clients.
     * @param message The system message content.
     */
    broadcastSystemMessage: (message: string) => {
        const payload = { message, timestamp: new Date().toISOString() };
        logger.info('Broadcasting system message', payload);
        io.emit('system:message', payload);
    }
    // Add more specific emit helpers as needed (e.g., sendToRoom)
  };
}
