/**
 * Gamification Analytics API Routes
 */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getSystemMetrics } from './get-system-metrics';
import { getAchievementAnalytics } from './get-achievement-analytics';
import { getChallengeAnalytics } from './get-challenge-analytics';
import { getLevelProgressionAnalytics } from './get-level-progression-analytics';
import { getUserEngagementMetrics } from './get-user-engagement-metrics';
import { getEngagementReport } from './get-engagement-report';
import { getRetentionCorrelation } from './get-retention-correlation';

export default async function gamificationAnalyticsRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Admin-only routes
  const adminRoutes = [
    { path: '/analytics/gamification/system-metrics', handler: getSystemMetrics },
    { path: '/analytics/gamification/achievement-analytics', handler: getAchievementAnalytics },
    { path: '/analytics/gamification/challenge-analytics', handler: getChallengeAnalytics },
    { path: '/analytics/gamification/level-progression-analytics', handler: getLevelProgressionAnalytics },
    { path: '/analytics/gamification/engagement-report', handler: getEngagementReport },
    { path: '/analytics/gamification/retention-correlation', handler: getRetentionCorrelation }
  ];
  
  // Register admin-only routes
  adminRoutes.forEach(route => {
    fastify.get(route.path, {
      onRequest: [fastify.authenticate, fastify.authorizeAdmin],
      handler: route.handler
    });
  });
  
  // User engagement metrics - authenticated but not admin-only
  fastify.get('/analytics/gamification/users/:userId/engagement-metrics', {
    onRequest: [fastify.authenticate],
    handler: getUserEngagementMetrics
  });
}
