import { FastifyRequest, FastifyReply } from 'fastify';

interface GetContentQuery {
  type?: string;
  tags?: string;
  creatorId?: string;
  battleId?: string;
  cursor?: string;
  limit?: string;
  sort?: 'recent' | 'popular' | 'trending';
}

export async function getContentHandler(
  request: FastifyRequest<{ Querystring: GetContentQuery }>,
  reply: FastifyReply
) {
  try {
    // Parse query parameters
    const { 
      type, 
      tags, 
      creatorId, 
      battleId, 
      cursor, 
      limit = '20', 
      sort = 'recent'
    } = request.query;

    // Prepare filter object
    const filter: any = {};
    
    // Add type filter if provided
    if (type) {
      filter.type = type.split(',');
    }
    
    // Add tags filter if provided
    if (tags) {
      filter.tags = tags.split(',');
    }
    
    // Add creator filter if provided
    if (creatorId) {
      filter.creatorId = creatorId;
    }
    
    // Add battle filter if provided
    if (battleId) {
      filter.battleId = battleId;
    }
    
    // Get authenticated user ID if available
    const userId = request.user?.id;
    
    // Get content service
    const contentService = request.diScope.resolve('contentService');
    
    // Get content feed
    const result = await contentService.getContentFeed({
      limit: parseInt(limit),
      cursor,
      filter,
      sort: sort as 'recent' | 'popular' | 'trending'
    });
    
    return reply.code(200).send({
      data: result.content,
      pagination: {
        nextCursor: result.cursor,
        hasMore: result.hasMore
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching content feed');
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details || [],
        },
      });
    }
    
    // Handle not found errors
    if (error.name === 'NotFoundError') {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    
    // Handle other errors
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching content',
      },
    });
  }
}
