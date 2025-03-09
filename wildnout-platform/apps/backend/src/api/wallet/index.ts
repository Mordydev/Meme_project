import { FastifyInstance } from 'fastify';
import { generateMessage } from './generate-message';
import { verifyWallet } from './verify-wallet';
import { getWalletStatus } from './status';
import { disconnectWallet } from './disconnect';

/**
 * Wallet API routes
 */
export default async function walletRoutes(fastify: FastifyInstance) {
  // Register sub-routes
  fastify.register(generateMessage);
  fastify.register(verifyWallet);
  fastify.register(getWalletStatus);
  fastify.register(disconnectWallet);
}
