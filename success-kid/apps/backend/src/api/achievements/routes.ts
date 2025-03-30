/**
 * Route definitions for the Achievements API module
 * Consolidates routes related to achievements, levels, badges, etc.
 */
import { FastifyInstance } from 'fastify';
import {
  getAchievementsSchema,
  getAchievementByIdSchema,
  getUserAchievementsSchema,
  getUserAchievementsByIdSchema,
  getAchievementProgressSchema, // Keep one
  unlockAchievementSchema, // Keep one
  // Badge Schemas
  getBadgesSchema,
  getBadgeByIdSchema,
  getUserBadgesSchema,
  getUserBadgesByIdSchema,
  getEquippedBadgesSchema,
  getRecommendedBadgesSchema,
  equipBadgeSchema,
  createBadgeSchema,
  updateBadgeSchema,
  deleteBadgeSchema,
  awardBadgeSchema,
  // Challenge Schemas
  getChallengesSchema,
  getActiveChallengesSchema,
  getChallengeByIdSchema,
  getUserChallengesSchema,
  getUserChallengesByIdSchema,
  joinChallengeSchema,
  getChallengeProgressSchema_Challenge, // Renamed in schema.ts
  updateChallengeProgressSchema,
  abandonChallengeSchema,
  createChallengeSchema,
  updateChallengeSchema,
  deleteChallengeSchema, // Keep one
  completeChallengeSchema, // Keep one
  // Leaderboard Schemas
  getLeaderboardCategoriesSchema,
  getLeaderboardPeriodsSchema,
  getLeaderboardSchema,
  getUserRankSchema,
  getUserRankByIdSchema,
  getUserLeaderboardSummarySchema,
  getLeaderboardHistorySchema,
  getUserRankHistorySchema,
  refreshLeaderboardSchema,
  createLeaderboardSnapshotSchema,
  // Level Schemas
  getAllLevelDefinitionsSchema,
  getLevelDefinitionSchema,
  getUserLevelSchema,
  getUserLevelByIdSchema,
  getXpTransactionsSchema,
  getXpValuesSchema,
  awardXpSchema,
  adminAwardXpSchema,
  // Streak Schemas
  getAllStreakDefinitionsSchema,
  getStreakDefinitionSchema,
  getUserStreaksSchema,
  getUserStreaksByIdSchema,
  getStreakStatusSchema,
  recordStreakActivitySchema,
  resetStreaksSchema,
  adminRecordStreakActivitySchema,
  // TODO: Import schemas from other route files as they are consolidated
} from './schema';
import {
  getAchievementsHandler,
  getAchievementByIdHandler,
  getUserAchievementsHandler,
  getUserAchievementsByIdHandler,
  getAchievementProgressHandler,
  unlockAchievementHandler,
  // Badge Handlers
  getBadgesHandler,
  getBadgeByIdHandler,
  getUserBadgesHandler,
  getUserBadgesByIdHandler,
  getEquippedBadgesHandler,
  getRecommendedBadgesHandler,
  equipBadgeHandler,
  createBadgeHandler,
  updateBadgeHandler,
  deleteBadgeHandler,
  awardBadgeHandler,
  // Challenge Handlers
  getChallengesHandler,
  getActiveChallengesHandler,
  getChallengeByIdHandler,
  getUserChallengesHandler_Challenge, // Renamed in handler.ts
  getUserChallengesByIdHandler_Challenge, // Renamed in handler.ts
  joinChallengeHandler,
  getChallengeProgressHandler, // Note: This conflicts with achievement progress handler name
  updateChallengeProgressHandler,
  abandonChallengeHandler,
  createChallengeHandler,
  updateChallengeHandler,
  deleteChallengeHandler,
  completeChallengeHandler,
  // Leaderboard Handlers
  getLeaderboardCategoriesHandler,
  getLeaderboardPeriodsHandler,
  getLeaderboardHandler,
  getUserRankHandler,
  getUserRankByIdHandler,
  getUserLeaderboardSummaryHandler,
  getLeaderboardHistoryHandler,
  getUserRankHistoryHandler,
  refreshLeaderboardHandler,
  createLeaderboardSnapshotHandler,
  // Level Handlers
  getAllLevelDefinitionsHandler,
  getLevelDefinitionHandler,
  getUserLevelHandler,
  getUserLevelByIdHandler,
  getXpTransactionsHandler,
  getXpValuesHandler,
  awardXpHandler,
  adminAwardXpHandler,
  // Streak Handlers
  getAllStreakDefinitionsHandler,
  getStreakDefinitionHandler,
  getUserStreaksHandler,
  getUserStreaksByIdHandler,
  getStreakStatusHandler,
  recordStreakActivityHandler,
  resetStreaksHandler,
  adminRecordStreakActivityHandler,
  // TODO: Import handlers from other route files as they are consolidated
} from './handler';

/**
 * Registers the achievement-related API routes
 * @param fastify - The Fastify instance
 */
export default async function achievementRoutes(fastify: FastifyInstance): Promise<void> {

  // --- Achievement Routes (from achievement-routes.ts) ---

  fastify.get('/', {
    schema: getAchievementsSchema // Use imported schema
    // Note: OpenAPI definition is in schema.ts, not directly here
  }, getAchievementsHandler); // Use imported handler

  fastify.get('/:id', {
    schema: getAchievementByIdSchema
  }, getAchievementByIdHandler);

  fastify.get('/user', {
    schema: getUserAchievementsSchema, // Schema might be minimal or just auth check
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, getUserAchievementsHandler);

  fastify.get('/user/:userId', {
    schema: getUserAchievementsByIdSchema
    // Add onRequest auth if needed for viewing others' achievements
  }, getUserAchievementsByIdHandler);

  fastify.get('/:id/progress', {
    schema: getAchievementProgressSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, getAchievementProgressHandler);

  // Admin route
  fastify.post('/:id/unlock', {
    schema: unlockAchievementSchema
    // Add admin auth check via onRequest hook
  }, unlockAchievementHandler);


  // --- Badge Routes (from badge-routes.ts) ---
  fastify.register(async function (badgeInstance) {
    badgeInstance.get('/', { schema: getBadgesSchema }, getBadgesHandler);
    badgeInstance.get('/:id', { schema: getBadgeByIdSchema }, getBadgeByIdHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    badgeInstance.get('/user', { schema: getUserBadgesSchema, onRequest: [fastify.authenticate] }, getUserBadgesHandler);
    badgeInstance.get('/user/:userId', { schema: getUserBadgesByIdSchema }, getUserBadgesByIdHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    badgeInstance.get('/user/equipped', { schema: getEquippedBadgesSchema, onRequest: [fastify.authenticate] }, getEquippedBadgesHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    badgeInstance.get('/recommended', { schema: getRecommendedBadgesSchema, onRequest: [fastify.authenticate] }, getRecommendedBadgesHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    badgeInstance.post('/:id/equip', { schema: equipBadgeSchema, onRequest: [fastify.authenticate] }, equipBadgeHandler);

    // Admin routes for badges
    badgeInstance.post('/', { schema: createBadgeSchema /* Add admin auth */ }, createBadgeHandler);
    badgeInstance.put('/:id', { schema: updateBadgeSchema /* Add admin auth */ }, updateBadgeHandler);
    badgeInstance.delete('/:id', { schema: deleteBadgeSchema /* Add admin auth */ }, deleteBadgeHandler);
    badgeInstance.post('/award', { schema: awardBadgeSchema /* Add admin auth */ }, awardBadgeHandler);

  }, { prefix: '/badges' });


  // --- Challenge Routes (from challenge-routes.ts) ---
  fastify.register(async function (challengeInstance) {
    challengeInstance.get('/', { schema: getChallengesSchema }, getChallengesHandler);
    challengeInstance.get('/active', { schema: getActiveChallengesSchema }, getActiveChallengesHandler);
    challengeInstance.get('/:id', { schema: getChallengeByIdSchema }, getChallengeByIdHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    challengeInstance.get('/user', { schema: getUserChallengesSchema, onRequest: [fastify.authenticate] }, getUserChallengesHandler_Challenge);
    challengeInstance.get('/user/:userId', { schema: getUserChallengesByIdSchema }, getUserChallengesByIdHandler_Challenge);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    challengeInstance.post('/:id/join', { schema: joinChallengeSchema, onRequest: [fastify.authenticate] }, joinChallengeHandler);
    // Note: Renamed schema getChallengeProgressSchema_Challenge to avoid conflict
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    challengeInstance.get('/:id/progress', { schema: getChallengeProgressSchema_Challenge, onRequest: [fastify.authenticate] }, getChallengeProgressHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    challengeInstance.post('/activity', { schema: updateChallengeProgressSchema, onRequest: [fastify.authenticate] }, updateChallengeProgressHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    challengeInstance.post('/:id/abandon', { schema: abandonChallengeSchema, onRequest: [fastify.authenticate] }, abandonChallengeHandler);

    // Admin routes for challenges
    challengeInstance.post('/', { schema: createChallengeSchema /* Add admin auth */ }, createChallengeHandler);
    challengeInstance.put('/:id', { schema: updateChallengeSchema /* Add admin auth */ }, updateChallengeHandler);
    challengeInstance.delete('/:id', { schema: deleteChallengeSchema /* Add admin auth */ }, deleteChallengeHandler);
    challengeInstance.post('/admin/complete', { schema: completeChallengeSchema /* Add admin auth */ }, completeChallengeHandler);

  }, { prefix: '/challenges' });


  // --- Leaderboard Routes (from leaderboard-routes.ts) ---
  fastify.register(async function (leaderboardInstance) {
    leaderboardInstance.get('/categories', { schema: getLeaderboardCategoriesSchema }, getLeaderboardCategoriesHandler);
    leaderboardInstance.get('/periods', { schema: getLeaderboardPeriodsSchema }, getLeaderboardPeriodsHandler);
    leaderboardInstance.get('/:category/:period', { schema: getLeaderboardSchema }, getLeaderboardHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    leaderboardInstance.get('/:category/:period/user', { schema: getUserRankSchema, onRequest: [fastify.authenticate] }, getUserRankHandler);
    leaderboardInstance.get('/:category/:period/user/:userId', { schema: getUserRankByIdSchema }, getUserRankByIdHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    leaderboardInstance.get('/user/summary', { schema: getUserLeaderboardSummarySchema, onRequest: [fastify.authenticate] }, getUserLeaderboardSummaryHandler);
    leaderboardInstance.get('/:category/:period/history', { schema: getLeaderboardHistorySchema }, getLeaderboardHistoryHandler);
    leaderboardInstance.get('/user/:userId/history', { schema: getUserRankHistorySchema }, getUserRankHistoryHandler);

    // Admin routes for leaderboards
    leaderboardInstance.post('/refresh', { schema: refreshLeaderboardSchema /* Add admin auth */ }, refreshLeaderboardHandler);
    leaderboardInstance.post('/snapshot', { schema: createLeaderboardSnapshotSchema /* Add admin auth */ }, createLeaderboardSnapshotHandler);

  }, { prefix: '/leaderboards' });


  // --- Level Routes (from level-routes.ts) ---
  fastify.register(async function (levelInstance) {
    levelInstance.get('/', { schema: getAllLevelDefinitionsSchema }, getAllLevelDefinitionsHandler);
    levelInstance.get('/:level', { schema: getLevelDefinitionSchema }, getLevelDefinitionHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    levelInstance.get('/user', { schema: getUserLevelSchema, onRequest: [fastify.authenticate] }, getUserLevelHandler);
    levelInstance.get('/user/:userId', { schema: getUserLevelByIdSchema }, getUserLevelByIdHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    levelInstance.get('/xp', { schema: getXpTransactionsSchema, onRequest: [fastify.authenticate] }, getXpTransactionsHandler);
    levelInstance.get('/xp/values', { schema: getXpValuesSchema }, getXpValuesHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    levelInstance.post('/xp', { schema: awardXpSchema, onRequest: [fastify.authenticate] }, awardXpHandler);

    // Admin routes for levels
    levelInstance.post('/admin/award', { schema: adminAwardXpSchema /* Add admin auth */ }, adminAwardXpHandler);

  }, { prefix: '/levels' });


  // --- Streak Routes (from streak-routes.ts) ---
  fastify.register(async function (streakInstance) {
    streakInstance.get('/', { schema: getAllStreakDefinitionsSchema }, getAllStreakDefinitionsHandler);
    streakInstance.get('/:id', { schema: getStreakDefinitionSchema }, getStreakDefinitionHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    streakInstance.get('/user', { schema: getUserStreaksSchema, onRequest: [fastify.authenticate] }, getUserStreaksHandler);
    streakInstance.get('/user/:userId', { schema: getUserStreaksByIdSchema }, getUserStreaksByIdHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    streakInstance.get('/:id/status', { schema: getStreakStatusSchema, onRequest: [fastify.authenticate] }, getStreakStatusHandler);
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    streakInstance.post('/record', { schema: recordStreakActivitySchema, onRequest: [fastify.authenticate] }, recordStreakActivityHandler);

    // Admin routes for streaks
    streakInstance.post('/reset', { schema: resetStreaksSchema /* Add admin auth */ }, resetStreaksHandler);
    streakInstance.post('/admin/record', { schema: adminRecordStreakActivitySchema /* Add admin auth */ }, adminRecordStreakActivityHandler);

  }, { prefix: '/streaks' });

}
