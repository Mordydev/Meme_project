import { FastifyInstance } from 'fastify';
import { connectWallet } from './wallet/connectWallet';
import { verifyWallet } from './wallet/verifyWallet';
import { disconnectWallet } from './wallet/disconnectWallet';
import { getWalletData } from './wallet/getWalletData';
import { getWalletTransactions } from './wallet/getTransactions';
import { redeemPoints } from './points/redemption/redeemPoints';
import { getRedemptionHistory } from './points/redemption/getRedemptionHistory';
import { getWeeklyTotal } from './points/redemption/getWeeklyTotal';
import { getMilestones } from './market/milestones/getMilestones';
import { getTransactions } from './market/transactions/getTransactions';
import { getMarketOverview } from './market/overview/getMarketOverview';
import { authenticated } from '../middleware/authenticated';
import { transactionVerification } from '../middleware/transaction-verification';

/**
 * Register all API routes
 */
export async function registerRoutes(app: FastifyInstance) {
  // Apply transaction verification middleware to all routes
  app.addHook('preHandler', transactionVerification);

  // Wallet routes
  app.post('/api/v1/wallet/connect', { preHandler: authenticated }, connectWallet);
  app.post('/api/v1/wallet/verify', { preHandler: authenticated }, verifyWallet);
  app.post('/api/v1/wallet/disconnect', { preHandler: authenticated }, disconnectWallet);
  app.get('/api/v1/wallet', { preHandler: authenticated }, getWalletData);
  app.get('/api/v1/wallet/transactions', { preHandler: authenticated }, getWalletTransactions);

  // Points redemption routes
  app.post('/api/v1/points/redemption', { preHandler: authenticated }, redeemPoints);
  app.get('/api/v1/points/redemption/history', { preHandler: authenticated }, getRedemptionHistory);
  app.get('/api/v1/points/redemption/weekly-total', { preHandler: authenticated }, getWeeklyTotal);

  // Market data routes (public)
  app.get('/api/v1/market/overview', getMarketOverview);
  app.get('/api/v1/market/milestones', getMilestones);
  app.get('/api/v1/market/transactions', getTransactions);
}
