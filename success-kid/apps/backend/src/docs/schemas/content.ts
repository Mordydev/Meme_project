/**
 * Content Schema Definitions
 * 
 * Defines content-related schemas for OpenAPI documentation.
 */

const contentSchemas = {
  Content: {
    type: 'object',
    required: ['id', 'userId', 'type', 'createdAt', 'status'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique content identifier'
      },
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'User ID of the content creator'
      },
      type: {
        type: 'string',
        enum: ['text', 'image', 'link', 'poll'],
        description: 'Type of content'
      },
      title: {
        type: 'string',
        description: 'Content title (optional for some types)'
      },
      contentText: {
        type: 'string',
        description: 'Text content'
      },
      mediaUrls: {
        type: 'array',
        items: {
          type: 'string',
          format: 'uri'
        },
        description: 'Media URLs for image or video content'
      },
      linkUrl: {
        type: 'string',
        format: 'uri',
        description: 'URL for link-type content'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Content creation timestamp'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Content last update timestamp'
      },
      status: {
        type: 'string',
        enum: ['active', 'deleted', 'flagged'],
        description: 'Content status'
      },
      categories: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Content categories or tags'
      }
    }
  },

  Comment: {
    type: 'object',
    required: ['id', 'contentId', 'userId', 'commentText', 'createdAt'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique comment identifier'
      },
      contentId: {
        type: 'string',
        format: 'uuid',
        description: 'ID of the content being commented on'
      },
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'User ID of the commenter'
      },
      commentText: {
        type: 'string',
        description: 'Comment text content'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Comment creation timestamp'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Comment last update timestamp'
      },
      parentId: {
        type: 'string',
        format: 'uuid',
        description: 'Parent comment ID for replies (null for top-level comments)'
      },
      status: {
        type: 'string',
        enum: ['active', 'deleted', 'flagged'],
        description: 'Comment status'
      }
    }
  },

  Reaction: {
    type: 'object',
    required: ['userId', 'targetId', 'targetType', 'reactionType', 'createdAt'],
    properties: {
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'User ID of the reaction creator'
      },
      targetId: {
        type: 'string',
        format: 'uuid',
        description: 'ID of the target content or comment'
      },
      targetType: {
        type: 'string',
        enum: ['content', 'comment'],
        description: 'Type of the reaction target'
      },
      reactionType: {
        type: 'string',
        enum: ['upvote', 'downvote', 'like', 'love', 'laugh', 'wow', 'sad', 'angry'],
        description: 'Type of reaction'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Reaction creation timestamp'
      }
    }
  },

  ContentCreateRequest: {
    type: 'object',
    required: ['type'],
    properties: {
      type: {
        type: 'string',
        enum: ['text', 'image', 'link', 'poll'],
        description: 'Type of content'
      },
      title: {
        type: 'string',
        maxLength: 200,
        description: 'Content title'
      },
      contentText: {
        type: 'string',
        maxLength: 10000,
        description: 'Text content'
      },
      mediaFiles: {
        type: 'array',
        items: {
          type: 'string',
          format: 'binary'
        },
        description: 'Media files for image or video content'
      },
      linkUrl: {
        type: 'string',
        format: 'uri',
        description: 'URL for link-type content'
      },
      categories: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Content categories or tags'
      },
      pollOptions: {
        type: 'array',
        items: {
          type: 'string'
        },
        minItems: 2,
        maxItems: 10,
        description: 'Options for poll-type content'
      },
      pollDuration: {
        type: 'integer',
        minimum: 1,
        maximum: 30,
        description: 'Poll duration in days'
      }
    }
  },

  CommentCreateRequest: {
    type: 'object',
    required: ['commentText'],
    properties: {
      commentText: {
        type: 'string',
        minLength: 1,
        maxLength: 2000,
        description: 'Comment text content'
      },
      parentId: {
        type: 'string',
        format: 'uuid',
        description: 'Parent comment ID for replies'
      }
    }
  },

  ReactionCreateRequest: {
    type: 'object',
    required: ['targetId', 'targetType', 'reactionType'],
    properties: {
      targetId: {
        type: 'string',
        format: 'uuid',
        description: 'ID of the target content or comment'
      },
      targetType: {
        type: 'string',
        enum: ['content', 'comment'],
        description: 'Type of the reaction target'
      },
      reactionType: {
        type: 'string',
        enum: ['upvote', 'downvote', 'like', 'love', 'laugh', 'wow', 'sad', 'angry'],
        description: 'Type of reaction'
      }
    }
  },

  ContentWithDetails: {
    allOf: [
      { $ref: '#/components/schemas/Content' },
      {
        type: 'object',
        properties: {
          author: {
            $ref: '#/components/schemas/User',
            description: 'Content author details'
          },
          stats: {
            type: 'object',
            properties: {
              viewCount: {
                type: 'integer',
                description: 'Number of views'
              },
              commentCount: {
                type: 'integer',
                description: 'Number of comments'
              },
              reactionCounts: {
                type: 'object',
                additionalProperties: {
                  type: 'integer'
                },
                description: 'Counts of different reaction types'
              }
            }
          },
          userReaction: {
            type: 'string',
            enum: ['upvote', 'downvote', 'like', 'love', 'laugh', 'wow', 'sad', 'angry', null],
            description: 'Requesting user\'s reaction to this content (if any)'
          }
        }
      }
    ]
  }
};

export default contentSchemas;
