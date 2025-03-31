import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDashboardData } from './handler';
import { GetDashboardResponseSchema } from './schema';

export default async function dashboardRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Register authentication middleware if not already applied globally
  // fastify.register(authMiddleware);

  fastify.route({
    method: 'GET',
    url: '/dashboard',
    schema: {
      tags: ['Dashboard'],
      summary: 'Get user dashboard data',
      description: 'Retrieves aggregated data for the user dashboard including points, achievements, activity, market, and referral information.',
      response: {
        200: GetDashboardResponseSchema,
        401: { 
          description: 'Unauthorized - User not authenticated',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'User not authenticated' },
            code: { type: 'string', example: 'UNAUTHORIZED' },
            statusCode: { type: 'number', example: 401 }
          }
        },
        500: { 
          description: 'Server Error',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Failed to fetch dashboard data' },
            code: { type: 'string', example: 'SERVER_ERROR' },
            statusCode: { type: 'number', example: 500 }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    onRequest: [
      // Apply authentication check
      async (request, reply) => {
        if (!request.user?.id) {
          reply.code(401).send({
            error: 'User not authenticated',
            code: 'UNAUTHORIZED',
            statusCode: 401
          });
          return reply;
        }
      }
    ],
    handler: getDashboardData
  });
}
