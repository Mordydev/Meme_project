/**
 * Wallet Routes Index
 * 
 * This file exports all wallet route registrations.
 */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { registerWalletConnectionRoutes } from './connection';
import { registerWalletVerificationRoutes } from './verification';
import { registerWalletBalanceRoutes } from './balance';
import { registerWalletTransactionsRoutes } from './transactions';

/**
 * Register all wallet routes
 * 
 * @param fastify Fastify instance
 * @param options Plugin options
 */
export async function registerWalletRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Register connection routes
  fastify.register(async (instance) => {
    await registerWalletConnectionRoutes(instance);
  }, { prefix: '/connection' });
  
  // Register verification routes
  fastify.register(async (instance) => {
    await registerWalletVerificationRoutes(instance);
  }, { prefix: '/verification' });
  
  // Register balance routes
  fastify.register(async (instance) => {
    await registerWalletBalanceRoutes(instance);
  }, { prefix: '/balance' });
  
  // Register transactions routes
  fastify.register(async (instance) => {
    await registerWalletTransactionsRoutes(instance);
  }, { prefix: '/transactions' });
}

export default registerWalletRoutes;
