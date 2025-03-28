/**
 * Wallet API Routes
 * 
 * This plugin registers all wallet-related routes with the Fastify application.
 */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { registerWalletRoutes } from '../../wallet/routes';

/**
 * Register wallet API
 * 
 * @param fastify Fastify instance
 * @param options Plugin options
 */
export default async function walletRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Register all wallet routes
  await registerWalletRoutes(fastify, options);
}
