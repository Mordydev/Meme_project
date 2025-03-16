import { FastifyPluginAsync } from 'fastify';
import { initialize } from './initialize';
import { verify } from './verify';
import { getWalletData } from './getWalletData';
import { getTransactions } from './getTransactions';
import { disconnect } from './disconnect';
import { mobileSession } from './mobileSession';
import { getMobileSessionStatus } from './getMobileSessionStatus';
import { connectionRoutes } from './connection';

const wallet: FastifyPluginAsync = async (fastify) => {
  // Register wallet routes
  fastify.post('/initialize', initialize);
  fastify.post('/verify', verify);
  fastify.get('/', getWalletData);
  fastify.get('/transactions', getTransactions);
  fastify.delete('/', disconnect);
  
  // Mobile-specific endpoints
  fastify.post('/mobile/session', mobileSession);
  fastify.get('/mobile/session/:sessionId', getMobileSessionStatus);
  
  // New wallet connection endpoints
  fastify.register(connectionRoutes, { prefix: '/connection' });
};

export default wallet;
