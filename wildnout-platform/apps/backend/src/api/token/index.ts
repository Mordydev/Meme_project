import { FastifyInstance } from 'fastify';
import { getTokenPrice } from './price';
import { getTokenMilestones } from './milestones';
import { getTokenStats } from './stats';
import { getTokenTransactions } from './transactions';
import { getUserBenefits } from './benefits';

/**
 * Token API routes
 */
export default async function tokenRoutes(fastify: FastifyInstance) {
  // Register sub-routes
  fastify.register(getTokenPrice);
  fastify.register(getTokenMilestones);
  fastify.register(getTokenStats);
  fastify.register(getTokenTransactions);
  fastify.register(getUserBenefits);
}
