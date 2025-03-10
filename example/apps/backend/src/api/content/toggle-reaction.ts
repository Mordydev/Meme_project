import { FastifyRequest, FastifyReply } from 'fastify';

interface ToggleReactionParams {
  id: string;
}

interface ToggleReactionBody {
  type: 'like' | 'fire' | 'laugh' | 'mind_blown';
  target: 'content' | 'comment';
  targetId: string;
}

export async function toggleReactionHandler(
  request: FastifyRequest<{ Params: ToggleReactionParams; Body: ToggleReactionBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const { type, target, targetId } = request.body;
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to react',
        },
      });
    }
    
    // TODO: Replace with actual DB operation once implemented
    // Typically this would toggle (add if not present, remove if present)
    const reaction = {
      id: `reaction-${Date.now()}`,
      type,
      targetType: target,
      targetId,
      userId,
      createdAt: new Date().toISOString(),
    };
    
    // Mock response for now - in reality would return current state after toggle
    return reply.code(200).send({
      data: {
        reaction,
        // Simulate new state after action
        newState: {
          added: true, // or false if removed
          count: 10, // example count
        },
      },
    });
  } catch (error) {
    request.log.error(error, `Error toggling reaction on content ${request.params.id}`);
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing reaction',
      },
    });
  }
}
