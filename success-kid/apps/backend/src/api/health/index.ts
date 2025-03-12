/**
 * Health Check Routes
 * 
 * Routes for checking the health of the system, including database connections.
 */
import { FastifyPluginAsync } from 'fastify';
import { checkDatabaseHealth } from '../../lib/db-client';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * @openapi
   * /api/v1/health:
   *   get:
   *     summary: Check system health
   *     description: Check the health of the API, database, and Redis connections
   *     tags: [System]
   *     responses:
   *       200:
   *         description: System health information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [healthy, degraded]
   *                   example: healthy
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: 2023-01-01T00:00:00.000Z
   *                 checks:
   *                   type: object
   *                   properties:
   *                     postgres:
   *                       type: string
   *                       enum: [connected, disconnected]
   *                       example: connected
   *                     redis:
   *                       type: string
   *                       enum: [connected, disconnected]
   *                       example: connected
   */
  fastify.get('/', async () => {
    const dbHealth = await checkDatabaseHealth();
    
    const status = dbHealth.postgres && dbHealth.redis ? 'healthy' : 'degraded';
    
    return { 
      status,
      timestamp: new Date().toISOString(),
      checks: {
        postgres: dbHealth.postgres ? 'connected' : 'disconnected',
        redis: dbHealth.redis ? 'connected' : 'disconnected'
      }
    };
  });
};

export default healthRoutes;