/**
 * Feature Flag API Routes
 * 
 * API endpoints for managing feature flags.
 */
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { featureFlagService } from '../../services/feature-flag-service';
import { handleApiError } from '../../errors/handlers';

// Route parameter schemas
const featureFlagSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
  },
  required: ['name'],
};

// Request body schemas
const setFeatureFlagSchema = {
  type: 'object',
  properties: {
    enabled: { type: 'boolean' },
  },
  required: ['enabled'],
};

const setUserFeatureFlagSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string' },
    enabled: { type: 'boolean' },
  },
  required: ['userId', 'enabled'],
};

/**
 * Feature Flag Routes Plugin
 */
export default async function(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  // List all feature flags
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const flags = await featureFlagService.listFeatureFlags();
      
      return reply.send({
        data: flags,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  });
  
  // Get feature flag status
  fastify.get('/:name', {
    schema: {
      params: featureFlagSchema,
    },
  }, async (request: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
    try {
      const { name } = request.params;
      const isEnabled = await featureFlagService.isEnabled(name);
      
      return reply.send({
        data: {
          name,
          enabled: isEnabled,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  });
  
  // Set feature flag
  fastify.put('/:name', {
    schema: {
      params: featureFlagSchema,
      body: setFeatureFlagSchema,
    },
  }, async (request: FastifyRequest<{ 
    Params: { name: string },
    Body: { enabled: boolean }
  }>, reply: FastifyReply) => {
    try {
      const { name } = request.params;
      const { enabled } = request.body;
      
      await featureFlagService.setFeatureFlag(name, enabled);
      
      return reply.send({
        data: {
          name,
          enabled,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  });
  
  // Set user-specific feature flag
  fastify.put('/:name/user', {
    schema: {
      params: featureFlagSchema,
      body: setUserFeatureFlagSchema,
    },
  }, async (request: FastifyRequest<{
    Params: { name: string },
    Body: { userId: string, enabled: boolean }
  }>, reply: FastifyReply) => {
    try {
      const { name } = request.params;
      const { userId, enabled } = request.body;
      
      await featureFlagService.setUserFeatureFlag(name, userId, enabled);
      
      return reply.send({
        data: {
          name,
          userId,
          enabled,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  });
  
  // Remove user-specific feature flag
  fastify.delete('/:name/user/:userId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          userId: { type: 'string' },
        },
        required: ['name', 'userId'],
      },
    },
  }, async (request: FastifyRequest<{
    Params: { name: string, userId: string }
  }>, reply: FastifyReply) => {
    try {
      const { name, userId } = request.params;
      
      await featureFlagService.removeUserFeatureFlag(name, userId);
      
      return reply.send({
        data: {
          name,
          userId,
          removed: true,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  });
}
