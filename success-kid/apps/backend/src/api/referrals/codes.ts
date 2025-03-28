/**
 * Referral Code Routes
 * 
 * API endpoints for referral code management
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getReferralCodeService, getReferralRateLimiter } from '../../services/referral';
import { handleApiError } from '../../errors';

/**
 * Interface for generating custom code
 */
interface GenerateCodeBody {
  data: {
    customCode?: string;
    expiresAt?: string;
    maxUses?: number;
  };
}

/**
 * Interface for validate code body
 */
interface ValidateCodeBody {
  data: {
    code: string;
  };
}

/**
 * Register referral code routes
 */
export default async function codesRoutes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/referrals/codes/my:
   *   get:
   *     summary: Get user's referral code
   *     description: Retrieves the active referral code for the authenticated user
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's referral code
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *                     code:
   *                       type: string
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *                       nullable: true
   *                     uses:
   *                       type: integer
   *                     maxUses:
   *                       type: integer
   *                       nullable: true
   *                     isActive:
   *                       type: boolean
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get('/my', {
    schema: {
      tags: ['Referrals']
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get user ID from authentication
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get referral code service
        const codeService = getReferralCodeService();
        
        // Get user's active code
        const code = await codeService.getUserCode(userId);
        
        // If no code exists, return empty data
        if (!code) {
          return reply.code(200).send({
            data: null,
            meta: {
              timestamp: new Date().toISOString()
            }
          });
        }
        
        // Send response
        return reply.code(200).send({
          data: {
            id: code.id,
            code: code.code,
            createdAt: code.created_at,
            expiresAt: code.expires_at,
            uses: code.uses,
            maxUses: code.max_uses,
            isActive: code.is_active
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/codes/generate:
   *   post:
   *     summary: Generate a referral code
   *     description: Generates a new referral code for the authenticated user
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [data]
   *             properties:
   *               data:
   *                 type: object
   *                 properties:
   *                   customCode:
   *                     type: string
   *                     description: Custom code to use (optional)
   *                   expiresAt:
   *                     type: string
   *                     format: date-time
   *                     description: Expiration date (optional)
   *                   maxUses:
   *                     type: integer
   *                     description: Maximum number of uses (optional)
   *     responses:
   *       201:
   *         description: Referral code generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *                     code:
   *                       type: string
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *                       nullable: true
   *                     uses:
   *                       type: integer
   *                     maxUses:
   *                       type: integer
   *                       nullable: true
   *                     isActive:
   *                       type: boolean
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Invalid request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: Conflict - custom code already in use
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       429:
   *         description: Rate limit exceeded
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: GenerateCodeBody }>('/generate', {
    schema: {
      tags: ['Referrals'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            properties: {
              customCode: { type: 'string' },
              expiresAt: { type: 'string', format: 'date-time' },
              maxUses: { type: 'integer', minimum: 1 }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: GenerateCodeBody }>, reply: FastifyReply) => {
      try {
        // Get user ID from authentication
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get rate limiter
        const rateLimiter = getReferralRateLimiter();
        
        // Check rate limits
        const rateLimit = await rateLimiter.enforceRateLimit(userId, 'code_generation');
        if (!rateLimit.allowed) {
          return reply.code(429).send({
            data: null,
            meta: { 
              timestamp: new Date().toISOString(),
              resetTime: rateLimit.resetTime
            },
            errors: [{ 
              code: 'RATE_LIMIT_EXCEEDED', 
              message: 'Rate limit exceeded for referral code generation'
            }]
          });
        }
        
        // Get request data
        const { customCode, expiresAt, maxUses } = request.body.data;
        
        // Get referral code service
        const codeService = getReferralCodeService();
        
        // Generate code
        const code = await codeService.generateCode({
          user_id: userId,
          custom_code: customCode,
          expires_at: expiresAt ? new Date(expiresAt) : undefined,
          max_uses: maxUses
        });
        
        // Send response
        return reply.code(201).send({
          data: {
            id: code.id,
            code: code.code,
            createdAt: code.created_at,
            expiresAt: code.expires_at,
            uses: code.uses,
            maxUses: code.max_uses,
            isActive: code.is_active
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/codes/link:
   *   get:
   *     summary: Get referral link
   *     description: Generates a referral link for the authenticated user
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: customCode
   *         schema:
   *           type: string
   *         description: Custom code to use (optional)
   *     responses:
   *       200:
   *         description: Referral link generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                     url:
   *                       type: string
   *                       format: uri
   *                     qrCodeUrl:
   *                       type: string
   *                       format: uri
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       429:
   *         description: Rate limit exceeded
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get<{ Querystring: { customCode?: string } }>('/link', {
    schema: {
      tags: ['Referrals'],
      querystring: {
        type: 'object',
        properties: {
          customCode: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: { customCode?: string } }>, reply: FastifyReply) => {
      try {
        // Get user ID from authentication
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get rate limiter
        const rateLimiter = getReferralRateLimiter();
        
        // Check rate limits
        const rateLimit = await rateLimiter.enforceRateLimit(userId, 'link_generation');
        if (!rateLimit.allowed) {
          return reply.code(429).send({
            data: null,
            meta: { 
              timestamp: new Date().toISOString(),
              resetTime: rateLimit.resetTime
            },
            errors: [{ 
              code: 'RATE_LIMIT_EXCEEDED', 
              message: 'Rate limit exceeded for referral link generation'
            }]
          });
        }
        
        // Get request data
        const { customCode } = request.query;
        
        // Get referral code service
        const codeService = getReferralCodeService();
        
        // Get referral link
        const link = await codeService.getReferralLink(
          userId,
          'https://successkid.io/join',
          customCode
        );
        
        // Send response
        return reply.code(200).send({
          data: link,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/codes/deactivate/{id}:
   *   post:
   *     summary: Deactivate a referral code
   *     description: Deactivates a specific referral code for the authenticated user
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Referral code ID
   *     responses:
   *       200:
   *         description: Referral code deactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *                     code:
   *                       type: string
   *                     isActive:
   *                       type: boolean
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - not your code
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Params: { id: string } }>('/deactivate/:id', {
    schema: {
      tags: ['Referrals'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        // Get user ID from authentication
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get code ID from path
        const { id } = request.params;
        
        // Get referral code service
        const codeService = getReferralCodeService();
        
        // Deactivate code
        const code = await codeService.deactivateCode(userId, id);
        
        // Send response
        return reply.code(200).send({
          data: {
            id: code.id,
            code: code.code,
            isActive: code.is_active
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/codes/validate:
   *   post:
   *     summary: Validate a referral code
   *     description: Validates a referral code and returns information about it
   *     tags: [Referrals]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [data]
   *             properties:
   *               data:
   *                 type: object
   *                 required: [code]
   *                 properties:
   *                   code:
   *                     type: string
   *     responses:
   *       200:
   *         description: Referral code validation result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     valid:
   *                       type: boolean
   *                     active:
   *                       type: boolean
   *                     referrerId:
   *                       type: string
   *                       format: uuid
   *                       nullable: true
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Invalid request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       429:
   *         description: Rate limit exceeded
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: ValidateCodeBody }>('/validate', {
    schema: {
      tags: ['Referrals'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['code'],
            properties: {
              code: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: ValidateCodeBody }>, reply: FastifyReply) => {
      try {
        // Get client IP for rate limiting
        const clientIp = request.ip || '127.0.0.1';
        
        // Get rate limiter
        const rateLimiter = getReferralRateLimiter();
        
        // Check rate limits
        const rateLimit = await rateLimiter.enforceRateLimit(clientIp, 'code_validation');
        if (!rateLimit.allowed) {
          return reply.code(429).send({
            data: null,
            meta: { 
              timestamp: new Date().toISOString(),
              resetTime: rateLimit.resetTime
            },
            errors: [{ 
              code: 'RATE_LIMIT_EXCEEDED', 
              message: 'Rate limit exceeded for referral code validation'
            }]
          });
        }
        
        // Get request data
        const { code } = request.body.data;
        
        // Get referral code service
        const codeService = getReferralCodeService();
        
        // Validate code
        const validation = await codeService.validateCode(code);
        
        // Send response
        return reply.code(200).send({
          data: validation,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });
}
