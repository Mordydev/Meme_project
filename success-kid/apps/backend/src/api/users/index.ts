import { FastifyInstance } from 'fastify';

export default async function users(fastify: FastifyInstance): Promise<void> {
  // Get list of users
  fastify.get('/', async () => {
    return { message: 'Users list endpoint' };
  });

  // Get user by ID
  fastify.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return { message: `Get user endpoint for ID: ${id}` };
  });

  // Update user
  fastify.put('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return { message: `Update user endpoint for ID: ${id}` };
  });
}