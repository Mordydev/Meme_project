/**
 * Test helper for building a Fastify app instance
 */
import Fastify, { FastifyInstance } from 'fastify';
import walletRoutes from '../../api/wallet';

// Create a test instance of Fastify with required plugins and routes
export function build(): FastifyInstance {
  const app = Fastify({
    logger: false,
    pluginTimeout: 2000
  });
  
  // Mock Redis client
  app.decorate('redis', {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    zadd: jest.fn(),
    zrevrange: jest.fn(),
    zremrangebyrank: jest.fn(),
    expire: jest.fn()
  });
  
  // Mock DB and repositories
  app.decorate('db', {
    repositories: {
      walletConnections: {
        findByWalletAddress: jest.fn(),
        findByUserId: jest.fn(),
        createWalletConnection: jest.fn(),
        updateVerificationStatus: jest.fn(),
        deleteById: jest.fn()
      }
    }
  });
  
  // Mock wallet connection service
  app.decorate('walletConnectionService', {
    generateVerificationMessage: jest.fn(),
    verifyWalletSignature: jest.fn(),
    connectWallet: jest.fn(),
    disconnectWallet: jest.fn(),
    getWalletsByUser: jest.fn(),
    getConnectionHistory: jest.fn()
  });
  
  // Register wallet routes
  app.register(walletRoutes, { prefix: '/wallet' });
  
  return app;
}
