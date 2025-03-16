/**
 * Challenge API Routes
 */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getActiveChallenges } from './get-active-challenges';
import { getChallengeById } from './get-challenge-by-id';
import { getUserChallenges } from './get-user-challenges';
import { getRecommendedChallenges } from './get-recommended-challenges';
import { joinChallenge } from './join-challenge';
import { updateChallengeProgress } from './update-challenge-progress';
import { getChallengeCompletion } from './get-challenge-completion';

export default async function challengeRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Get active challenges
  fastify.get('/challenges', getActiveChallenges);
  
  // Get challenge by ID
  fastify.get('/challenges/:id', getChallengeById);
  
  // Get user's challenges
  fastify.get('/users/:userId/challenges', {
    onRequest: [fastify.authenticate],
    handler: getUserChallenges
  });
  
  // Get recommended challenges for user
  fastify.get('/users/:userId/recommended-challenges', {
    onRequest: [fastify.authenticate],
    handler: getRecommendedChallenges
  });
  
  // Join challenge
  fastify.post('/users/:userId/challenges/:challengeId/join', {
    onRequest: [fastify.authenticate],
    handler: joinChallenge
  });
  
  // Manual update challenge progress (admin)
  fastify.post('/users/:userId/challenges/:challengeId/progress', {
    onRequest: [fastify.authenticate, fastify.authorizeAdmin],
    handler: updateChallengeProgress
  });
  
  // Get challenge completion details
  fastify.get('/users/:userId/challenges/:challengeId/completion', {
    onRequest: [fastify.authenticate],
    handler: getChallengeCompletion
  });
}
