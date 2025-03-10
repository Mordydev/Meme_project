import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';

// Import route handlers
import getBattles from './get-battles';
import getBattleById from './get-battle-by-id';
import createBattle from './create-battle';
import updateBattleStatus from './update-battle-status';
import getBattleEntries from './get-battle-entries';
import submitBattleEntry from './submit-battle-entry';
import voteForEntry from './vote-for-entry';
import getBattleResults from './get-battle-results';

/**
 * Battle API routes
 */
export default async function (fastify: FastifyInstance) {
  // Register routes
  fastify.register(getBattles);
  fastify.register(getBattleById);
  fastify.register(createBattle);
  fastify.register(updateBattleStatus);
  fastify.register(getBattleEntries);
  fastify.register(submitBattleEntry);
  fastify.register(voteForEntry);
  fastify.register(getBattleResults);
}
