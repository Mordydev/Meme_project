import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDashboardData } from './handler';
import { GetDashboardResponseSchema } from './schema';
// Import authentication middleware if needed
// import { authenticate } from '../../middleware/auth'; // Example

export default async function dashboardRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  fastify.route({
    method: 'GET',
    url: '/v1/dashboard', // Using /v1 prefix as per plan
    // Add preHandler for authentication if required
    // preHandler: [authenticate], // Example: Apply authentication middleware
    schema: {
      tags: ['Dashboard'],
      description: 'Retrieves aggregated data for the user dashboard.',
      response: {
        200: GetDashboardResponseSchema, // Use the Zod schema directly for response validation/serialization
        // Add other response codes as needed (e.g., 401, 500)
        401: { $ref: 'ErrorResponseSchema#/properties/Unauthorized' }, // Example reference
        500: { $ref: 'ErrorResponseSchema#/properties/InternalServerError' }, // Example reference
      },
      // Add request schema if needed (e.g., for query params)
      // querystring: GetDashboardRequestSchema,
    },
    handler: getDashboardData,
  });
}
