import { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify'; // Added FastifyError
import { pointsRepository } from '../../repositories/points-repository'; // Import the singleton instance
// import { handleApiError } from '../../lib/errors'; // Assuming a standard error handler exists - Removed for now
import { z } from 'zod'; // For input validation

// Define Zod schema for URL parameters
const ParamsSchema = z.object({
  userId: z.string(), // Assuming user ID is a string (like from Clerk/UUID)
});

// Define Zod schema for query parameters
const QuerySchema = z.object({
  limit: z.preprocess(
    (val: any) => (val ? parseInt(String(val), 10) : undefined), // Add type 'any' to val
    z.number().int().positive().max(100).optional().default(20) // Default limit 20, max 100
  ),
  offset: z.preprocess(
    (val: any) => (val ? parseInt(String(val), 10) : undefined), // Add type 'any' to val
    z.number().int().nonnegative().optional().default(0) // Default offset 0
  ),
});

// Define the expected structure for the authenticated user on the request object
// Adjust based on your actual authentication middleware (e.g., Clerk adds 'auth')
interface AuthenticatedRequest extends FastifyRequest {
    auth?: { // Example structure if using Clerk's request decoration
        userId?: string | null;
        // Add other auth properties if needed (e.g., roles)
    };
    // Or maybe just: user?: { id: string; /* other props */ };
}

/**
 * Route handler for fetching user points history and total.
 * @param fastify Fastify instance
 */
export default async function userRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/v1/users/:userId/points
  fastify.get(
    '/:userId/points',
    {
      // Add schema validation for request parameters and query string
      schema: {
        params: ParamsSchema,
        querystring: QuerySchema,
        // Add response schema if desired for documentation/validation
        // response: {
        //   200: { ... }
        // }
      },
      // Add preHandler hook for authentication/authorization if not handled globally
      // preHandler: [fastify.authenticate] // Example if using fastify-jwt or similar
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const { userId: requestedUserId } = request.params as z.infer<typeof ParamsSchema>;
      const { limit, offset } = request.query as z.infer<typeof QuerySchema>;

      try {
        // --- Authentication & Authorization ---
        // Assuming auth middleware adds user info to request.auth or request.user
        const currentUserId = request.auth?.userId; // Adjust based on your auth middleware

        if (!currentUserId) {
          return reply.code(401).send({ error: 'Unauthorized: User not authenticated.' });
        }

        // Basic authorization: Users can only fetch their own points
        if (currentUserId !== requestedUserId) {
          return reply.code(403).send({ error: 'Forbidden: You can only access your own points data.' });
        }

        // --- Fetch Data using Repository ---
        request.log.info(`Fetching points data for user ${requestedUserId}`);
        const [totalPoints, history] = await Promise.all([
          pointsRepository.getUserPointsTotal(requestedUserId),
          pointsRepository.getPointsHistory(requestedUserId, limit, offset)
        ]);

        // --- Send Response ---
        return reply.code(200).send({
          data: {
            total: totalPoints,
            history: history,
          },
          meta: {
            limit: limit,
            offset: offset,
            // You might want to add total count for pagination here
          }
        });

      } catch (error) {
        // Basic error handling - replace with centralized handler if available
        request.log.error('Error fetching user points:', error);
        const fastifyError = error as FastifyError; // Cast to FastifyError if needed
        return reply.code(fastifyError.statusCode || 500).send({
             error: fastifyError.message || 'Internal Server Error: Could not fetch user points.'
        });
      }
    }
  );

  // Add other user-related routes here (e.g., GET /:userId/profile)
}
