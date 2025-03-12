import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

/**
 * WebSocket handler for real-time updates
 */
export default fp(async function websocketPlugin(fastify: FastifyInstance) {
  // Register WebSocket plugin - this would use @fastify/websocket in a full implementation
  // fastify.register(require('@fastify/websocket'));
  
  // Connection registry for tracking active WebSocket connections
  class ConnectionRegistry {
    private connections: Map<string, Set<any>> = new Map();
    
    add(userId: string, socket: any): void {
      if (!this.connections.has(userId)) {
        this.connections.set(userId, new Set());
      }
      this.connections.get(userId)?.add(socket);
    }
    
    remove(userId: string, socket: any): void {
      const userConnections = this.connections.get(userId);
      if (userConnections) {
        userConnections.delete(socket);
        if (userConnections.size === 0) {
          this.connections.delete(userId);
        }
      }
    }
    
    sendToUser(userId: string, message: any): void {
      const userConnections = this.connections.get(userId);
      if (userConnections) {
        const messageString = JSON.stringify(message);
        userConnections.forEach(socket => {
          if (socket.readyState === 1) { // OPEN
            socket.send(messageString);
          }
        });
      }
    }
    
    sendToAll(message: any): void {
      const messageString = JSON.stringify(message);
      this.connections.forEach(sockets => {
        sockets.forEach(socket => {
          if (socket.readyState === 1) { // OPEN
            socket.send(messageString);
          }
        });
      });
    }
  }
  
  // Create connection registry
  const connectionRegistry = new ConnectionRegistry();
  
  // Expose registry for use in other parts of the application
  fastify.decorate('websockets', {
    connectionRegistry,
    sendToUser: (userId: string, message: any) => connectionRegistry.sendToUser(userId, message),
    sendToAll: (message: any) => connectionRegistry.sendToAll(message),
  });
  
  // Set up WebSocket route - this is a placeholder for a real implementation
  fastify.get('/ws', { websocket: true }, (connection, request) => {
    // This would be a real implementation using the @fastify/websocket plugin
    fastify.log.info('WebSocket connection established');
    
    // In a real implementation, we'd authenticate the user here
    // const userId = authenticateWebsocketConnection(request);
    const userId = '1'; // Placeholder
    
    // Add to connection registry
    connectionRegistry.add(userId, connection.socket);
    
    // Handle connection close
    connection.socket.on('close', () => {
      connectionRegistry.remove(userId, connection.socket);
      fastify.log.info('WebSocket connection closed');
    });
    
    // Handle messages
    connection.socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        fastify.log.info(`WebSocket message received: ${JSON.stringify(data)}`);
        
        // Here we would process different message types
        // This is a placeholder implementation
        if (data.type === 'ping') {
          connection.socket.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        fastify.log.error('Error processing WebSocket message', error);
      }
    });
  });
});