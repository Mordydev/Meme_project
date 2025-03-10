import { FastifyRequest, FastifyReply } from 'fastify';

interface AddCommentParams {
  id: string;
}

interface AddCommentBody {
  text: string;
  parentCommentId?: string;
}

export async function addCommentHandler(
  request: FastifyRequest<{ Params: AddCommentParams; Body: AddCommentBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const { text, parentCommentId } = request.body;
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to comment',
        },
      });
    }
    
    if (!text || text.trim().length === 0) {
      return reply.code(400).send({
        error: {
          code: 'INVALID_COMMENT',
          message: 'Comment text is required',
        },
      });
    }
    
    // TODO: Replace with actual DB insertion once implemented
    // This is mock data for development
    const newComment = {
      id: `comment-${Date.now()}`,
      contentId: id,
      authorId: userId,
      author: {
        id: userId,
        username: request.user?.username || 'Anonymous',
        avatarUrl: request.user?.avatarUrl || null,
      },
      text,
      parentCommentId,
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    
    return reply.code(201).send({
      data: newComment,
    });
  } catch (error) {
    request.log.error(error, `Error adding comment to content ${request.params.id}`);
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while adding comment',
      },
    });
  }
}
