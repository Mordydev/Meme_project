/**
 * Wallet Connection Routes
 * 
 * Routes for wallet connection functionality
 */
import { FastifyPluginAsync } from 'fastify';
import { 
  initializeWallet, 
  verifyWallet, 
  getUserWallets, 
  disconnectWallet,
  getConnectionHistory
} from './controller';
import { 
  initializeWalletSchema, 
  verifyWalletSchema, 
  getUserWalletsSchema, 
  disconnectWalletSchema,
  connectionHistorySchema
} from './schema';

const connectionRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize wallet connection
  fastify.post(
    '/initialize',
    { schema: initializeWalletSchema },
    initializeWallet
  );
  
  // Verify wallet signature
  fastify.post(
    '/verify',
    { schema: verifyWalletSchema },
    verifyWallet
  );
  
  // Get user wallet connections
  fastify.get(
    '/',
    { schema: getUserWalletsSchema },
    getUserWallets
  );
  
  // Disconnect wallet
  fastify.delete(
    '/',
    { schema: disconnectWalletSchema },
    disconnectWallet
  );
  
  // Get connection history
  fastify.get(
    '/history',
    { schema: connectionHistorySchema },
    getConnectionHistory
  );
};

export default connectionRoutes;
