import { FastifyInstance } from 'fastify';
import { auth } from '@clerk/fastify';
import { CommentService } from '../../services/comment-service';

/**
 * Comment API endpoints
 */
export default async function commentRoutes(fastify: FastifyInstance): Promise<void> {
  const commentService = fastify.diContainer.resolve(CommentService);
  
  /**
   * Create a comment
   */
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['contentId', 'body'],
        properties: {
          contentId: { type: 'string' },
          body: { type: 'string', minLength: 1 },
          parentId: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            contentId: { type: 'string' },
            userId: { type: 'string' },
            body: { type: 'string' },
            parentId: { type: ['string', 'null'] },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    preHandler: auth(),
  }, async (request, reply) => {
    const { userId } = request.auth;
    
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const { contentId, body, parentId } = request.body as {
      contentId: string;
      body: string;
      parentId?: string;
    };
    
    const comment = await commentService.addComment(contentId, userId, {
      body,
      parentId
    });
    
    return reply.status(201).send(comment);
  });
  
  /**
   * Get a comment thread
   */
  fastify.get('/:commentId/thread', {
    schema: {
      params: {
        type: 'object',
        required: ['commentId'],
        properties: {
          commentId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 0, default: 0 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            rootComment: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                contentId: { type: 'string' },
                userId: { type: 'string' },
                body: { type: 'string' },
                parentId: { type: ['string', 'null'] },
                status: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    displayName: { type: 'string' },
                    imageUrl: { type: ['string', 'null'] }
                  }
                }
              }
            },
            replies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  contentId: { type: 'string' },
                  userId: { type: 'string' },
                  body: { type: 'string' },
                  parentId: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      username: { type: 'string' },
                      displayName: { type: 'string' },
                      imageUrl: { type: ['string', 'null'] }
                    }
                  }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, async (request) => {
    const { commentId } = request.params as { commentId: string };
    const { page, limit } = request.query as { page: number; limit: number };
    
    const result = await commentService.getCommentThread(commentId, { page, limit });
    
    return result;
  });
  
  /**
   * Update a comment
   */
  fastify.put('/:commentId', {
    schema: {
      params: {
        type: 'object',
        required: ['commentId'],
        properties: {
          commentId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['body'],
        properties: {
          body: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            contentId: { type: 'string' },
            userId: { type: 'string' },
            body: { type: 'string' },
            parentId: { type: ['string', 'null'] },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    preHandler: auth(),
  }, async (request, reply) => {
    const { userId } = request.auth;
    
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const { commentId } = request.params as { commentId: string };
    const { body } = request.body as { body: string };
    
    const comment = await commentService.updateComment(commentId, userId, body);
    
    return comment;
  });
  
  /**
   * Delete a comment
   */
  fastify.delete('/:commentId', {
    schema: {
      params: {
        type: 'object',
        required: ['commentId'],
        properties: {
          commentId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      }
    },
    preHandler: auth(),
  }, async (request, reply) => {
    const { userId } = request.auth;
    const { isAdmin } = request.auth.sessionClaims || {} as any;
    
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const { commentId } = request.params as { commentId: string };
    
    await commentService.deleteComment(commentId, userId, Boolean(isAdmin));
    
    return { success: true };
  });
  
  /**
   * Get comments for content
   */
  fastify.get('/content/:contentId', {
    schema: {
      params: {
        type: 'object',
        required: ['contentId'],
        properties: {
          contentId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          threaded: { type: 'boolean', default: true },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          cursor: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            comments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  contentId: { type: 'string' },
                  userId: { type: 'string' },
                  body: { type: 'string' },
                  parentId: { type: ['string', 'null'] },
                  status: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      username: { type: 'string' },
                      displayName: { type: 'string' },
                      imageUrl: { type: ['string', 'null'] }
                    }
                  }
                }
              }
            },
            totalCount: { type: 'integer' },
            hasMore: { type: 'boolean' },
            cursor: { type: ['string', 'null'] }
          }
        }
      }
    }
  }, async (request) => {
    const { contentId } = request.params as { contentId: string };
    const { threaded, limit, cursor } = request.query as {
      threaded: boolean;
      limit: number;
      cursor?: string;
    };
    
    const result = await commentService.getComments(contentId, {
      threaded,
      limit,
      cursor
    });
    
    return result;
  });
}
