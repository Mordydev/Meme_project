import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { parse as parseUrl } from 'url';
import { parse as parseQuery } from 'querystring';
import { ConnectionRegistry } from './connection-registry';
import { logger } from '../lib/logger';
import { setupMarketDataHandler, handleMarketSubscription } from './handlers/marketDataHandler';
import { setupWalletHandler, handleWalletSubscription } from './handlers/walletHandler';
import { verifyAuthToken } from '../auth/token-verification';

// Create connection registry
const connectionRegistry = new ConnectionRegistry();

/**
 * Initialize WebSocket server
 */
export function setupWebSocketServer(app: FastifyInstance) {
  // Register WebSocket plugin
  app.register(require('@fastify/websocket'), {
    options: {
      // 1MB max message size
      maxPayload: 1024 * 1024,
      // 60 seconds ping interval
      pingInterval: 60000,
      // 30 seconds ping timeout
      pingTimeout: 30000
    }
  });

  // Setup message handlers
  setupMarketDataHandler(connectionRegistry);
  setupWalletHandler(connectionRegistry);

  // WebSocket route handler
  app.get('/api/ws', { websocket: true }, (connection, req) => {
    const socket = connection.socket;
    let userId: string | null = null;
    let authenticated = false;
    
    // Parse query parameters for initial auth token
    const url = req.url;
    const parsedUrl = parseUrl(url);
    const query = parseQuery(parsedUrl.query || '');
    const token = query.token as string;

    logger.debug('WebSocket connection established');

    // Attempt authentication with token from query
    if (token) {
      try {
        const decoded = verifyAuthToken(token);
        if (decoded && decoded.sub) {
          userId = decoded.sub;
          authenticated = true;
          
          // Register user connection
          connectionRegistry.registerUser(socket, userId);
          
          logger.debug('WebSocket authenticated via query token', { userId });
        }
      } catch (error) {
        logger.debug('Invalid token in WebSocket connection', { error });
      }
    }

    // Handle connection close
    socket.on('close', () => {
      logger.debug('WebSocket connection closed', { userId });
      
      // Remove socket from registry
      connectionRegistry.removeSocket(socket);
    });

    // Handle incoming messages
    socket.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle ping messages
        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          return;
        }
        
        // Handle authentication
        if (data.authenticate && data.token) {
          try {
            const decoded = verifyAuthToken(data.token);
            if (decoded && decoded.sub) {
              userId = decoded.sub;
              authenticated = true;
              
              // Register user connection
              connectionRegistry.registerUser(socket, userId);
              
              // Send authentication success
              socket.send(JSON.stringify({
                type: 'auth:success',
                data: { userId }
              }));
              
              logger.debug('WebSocket authenticated via message', { userId });
            }
          } catch (error) {
            logger.debug('Invalid token in authentication message', { error });
            
            // Send authentication failure
            socket.send(JSON.stringify({
              type: 'auth:error',
              data: { message: 'Invalid authentication token' }
            }));
          }
          
          return;
        }
        
        // Handle subscription requests
        if (data.subscribe && data.channels) {
          // Handle market data subscriptions
          if (data.channels.some((channel: string) => 
            ['market', 'transactions'].includes(channel)
          )) {
            handleMarketSubscription(socket, userId, data, connectionRegistry);
          }
          
          // Handle wallet subscriptions
          if (data.channels.some((channel: string) => 
            ['wallet', 'redemptions'].includes(channel)
          )) {
            handleWalletSubscription(socket, userId, data, connectionRegistry);
          }
        }
      } catch (error) {
        logger.error('Error processing WebSocket message', { error });
      }
    });

    // Send welcome message
    socket.send(JSON.stringify({
      type: 'welcome',
      data: {
        authenticated,
        userId: authenticated ? userId : null,
        timestamp: Date.now(),
        message: 'Welcome to Success Kid WebSocket API'
      }
    }));
  });

  logger.info('WebSocket server initialized');
  
  return {
    connectionRegistry
  };
}
