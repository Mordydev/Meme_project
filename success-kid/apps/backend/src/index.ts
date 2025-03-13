import { buildApp } from './app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    const app = await buildApp();
    
    // Start the server
    await app.listen({ port: Number(PORT), host: HOST });
    
    const addr = app.server.address();
    const port = typeof addr === 'string' ? addr : addr?.port;
    
    app.log.info(`Server listening on http://${HOST}:${port}`);
    app.log.info(`API Documentation available at http://${HOST}:${port}/documentation`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Start the application
start();
