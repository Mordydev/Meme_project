import { build } from './app';
import { initializeWebSockets } from './websockets';

// Build the Fastify app
const { app, server } = await build({
  logger: {
    transport: {
      target: 'pino-pretty',
    },
  },
});

// Initialize WebSocket server
const webSocketService = initializeWebSockets(server, app);

// Connect notification service to WebSocket service
app.services.notificationService.setWebSocketService(webSocketService);

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    
    console.log(`Server is running on http://${host}:${port}`);
    console.log(`WebSocket server is running on ws://${host}:${port}/ws`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
