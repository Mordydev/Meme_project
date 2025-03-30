/**
 * Points API Routes (Enhanced Implementation)
 * 
 * API endpoints for the Success Points system with Redis-based cap tracking,
 * improved fraud detection, and comprehensive redemption flow.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
// Corrected imports to use main service index
import { enhancedPointsService, redemptionService, walletService } from '../../services'; 
import { handleApiError } from '../../errors'; // Assuming this handler exists and works with AppError
import { AppError } from '../../errors/base-error.js'; // Added .js extension
import { PointsSource } from '../../models/entities/points.model';
import { REDEMPTION_CONSTANTS } from '../../models/entities/redemption.model'; // Assuming this exists
import { TrendsQuerySchema, TrendsResponseSchema } from './schema'; // Import schemas for trends
import { TrendsQueryParams } from './types'; // Import type for trends query

// Removed unused interfaces (UserIdParams) and adjusted others slightly if needed
interface PointsAwardRequest {
  data: {
    amount: number;
    source: PointsSource;
    referenceId?: string;
    description?: string;
    metadata?: Record<string, any>;
  };
}

interface PointsRedeemRequest {
  data: {
    amount: number;
    walletAddress?: string; // Keep optional as per enhanced.ts logic
  };
}

interface TransactionQueryParams {
  limit?: number;
  offset?: number;
  source?: string;
}

/**
 * Register enhanced points API routes
 * Note: Renamed function from enhancedPointsRoutes to registerPointsRoutes
 */
export default async function registerPointsRoutes(fastify: FastifyInstance) {
  
  // --- GET /balance ---
  fastify.get('/balance', {
    schema: {
      tags: ['Points'],
      description: "Retrieves the user's current points balance, recent transactions, caps, and basic wallet/redemption info.",
      // Add detailed response schema based on enhanced.ts logic if needed for OpenAPI spec
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
        }
        
        const balance = await enhancedPointsService.getUserBalance(userId);
        const transactions = await enhancedPointsService.getUserTransactions(userId, 5); // Limit to 5 for balance view
        const caps = await enhancedPointsService.getAllCaps(userId);
        const wallet = await walletService.getUserWallet(userId); 

        const formattedCaps: Record<string, any> = {};
        // TODO: Add explicit types for capData and source
        caps.forEach((capData: any, source: any) => {
          formattedCaps[source] = {
            daily: { used: capData.daily.current, limit: capData.daily.limit, remaining: capData.daily.remaining, resetsAt: capData.daily.resetsAt },
            weekly: { used: capData.weekly.current, limit: capData.weekly.limit, remaining: capData.weekly.remaining, resetsAt: capData.weekly.resetsAt }
          };
        });
        
        return reply.code(200).send({
          data: {
            balance,
            // TODO: Add explicit type for tx
            transactions: transactions.map((tx: any) => ({ id: tx.id, amount: tx.amount, source: tx.source, referenceId: tx.reference_id, createdAt: tx.created_at, description: tx.description })),
            caps: formattedCaps,
            wallet: wallet ? { isConnected: true, isVerified: wallet.isVerified, address: wallet.address } : { isConnected: false },
            redemption: { conversionRate: REDEMPTION_CONSTANTS.CONVERSION_RATE, minimumAmount: REDEMPTION_CONSTANTS.MINIMUM_AMOUNT, weeklyLimit: REDEMPTION_CONSTANTS.WEEKLY_CAP }
          },
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        return handleApiError(request, reply, error); // Assuming handleApiError exists
      }
    },
  });

  // --- GET /transactions ---
  fastify.get<{ Querystring: TransactionQueryParams }>('/transactions', {
    schema: {
      tags: ['Points'],
      description: "Retrieves the user's points transaction history with pagination.",
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          offset: { type: 'integer', default: 0, minimum: 0 },
          source: { type: 'string' }
        }
      }
      // Add detailed response schema if needed
    },
    handler: async (request: FastifyRequest<{ Querystring: TransactionQueryParams }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
           throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
        }
        
        const limit = request.query.limit || 20;
        const offset = request.query.offset || 0;
        const source = request.query.source; 
        
        // TODO: Implement filtering by source in service method
        // TODO: Implement method to get total count for pagination
        const transactions = await enhancedPointsService.getUserTransactions(userId, limit, offset); 
        const total = 0; // Placeholder for total count
        
        return reply.code(200).send({
          // TODO: Add explicit type for tx
          data: transactions.map((tx: any) => ({ id: tx.id, amount: tx.amount, source: tx.source, referenceId: tx.reference_id, createdAt: tx.created_at, description: tx.description })),
          meta: { timestamp: new Date().toISOString() },
          pagination: { total, limit, offset, hasMore: offset + transactions.length < total } // hasMore logic might be incorrect without total
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  // --- POST /award ---
  fastify.post<{ Body: PointsAwardRequest }>('/award', {
    schema: {
      tags: ['Points'],
      description: "Awards points to the user for a specific activity (internal/admin use likely).",
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['amount', 'source'],
            properties: {
              amount: { type: 'number', minimum: 1 },
              source: { type: 'string' }, // Consider enum validation
              referenceId: { type: 'string' },
              description: { type: 'string' },
              metadata: { type: 'object' }
            },
          },
        },
      },
      // Add detailed response schema if needed
    },
    // TODO: Add admin/internal auth check here
    handler: async (request: FastifyRequest<{ Body: PointsAwardRequest }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id; // Or target user ID if admin action
        if (!userId) {
           throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
        }
        
        // Basic rate limiting check (example, refine in service)
        if (await enhancedPointsService.isThrottled(userId, request.body.data.source as PointsSource)) {
           throw new AppError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
        }
        
        const { amount, source, referenceId, description, metadata } = request.body.data;
        
        const result = await enhancedPointsService.awardPoints({ userId, amount, source: source as PointsSource, referenceId, description, metadata });
        
        return reply.code(200).send({
          data: { success: result.success, amount: result.amount, newBalance: result.total },
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  // --- POST /redeem --- (Placeholder for full redemption flow in Task 2.2)
  fastify.post<{ Body: PointsRedeemRequest }>('/redeem', {
     schema: {
       tags: ['Points', 'Redemption'],
       description: "Initiates a request to redeem points for tokens.",
       body: {
         type: 'object',
         required: ['data'],
         properties: {
           data: {
             type: 'object',
             required: ['amount'],
             properties: {
               amount: { type: 'number', minimum: REDEMPTION_CONSTANTS.MINIMUM_AMOUNT },
               walletAddress: { type: 'string' } // Optional, service should check connected wallet
             },
           },
         },
       },
       // Add detailed response schema (202 Accepted)
     },
     config: { // Add route-specific rate limit
        rateLimit: {
            max: 5, // Max 5 redemption attempts
            timeWindow: '1 hour' // Per hour
        }
     },
     handler: async (request: FastifyRequest<{ Body: PointsRedeemRequest }>, reply: FastifyReply) => {
       try {
         const userId = request.user?.id;
         if (!userId) {
            throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
         }
         
         const { amount } = request.body.data;
         let { walletAddress } = request.body.data; // Make it mutable

         // If wallet address is not provided in request, try to get the user's connected wallet
         if (!walletAddress) {
           const connectedWallet = await walletService.getUserWallet(userId);
           if (!connectedWallet?.address) {
             // Throw specific error if no wallet is connected
             throw new AppError('No wallet connected for redemption.', 'WALLET_NOT_CONNECTED', 400);
           }
           walletAddress = connectedWallet.address;
         }
         
         // Delegate to redemption service (to be fully implemented in Task 2.2)
         // Now walletAddress is guaranteed to be a string here
         const redemption = await redemptionService.requestRedemption({ userId, pointsAmount: amount, walletAddress });
         
         const now = new Date();
         const daysUntilSunday = (7 - now.getUTCDay()) % 7; // Use UTC day
         const nextSunday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday));
         nextSunday.setUTCHours(0, 0, 0, 0);

         return reply.code(202).send({ // 202 Accepted
           data: {
             success: true,
             requestId: redemption.id,
             pointsAmount: redemption.points_amount,
             tokenAmount: redemption.token_amount,
             status: redemption.status,
             estimatedProcessingTime: nextSunday.toISOString(),
             walletAddress: redemption.wallet_address,
             conversionRate: REDEMPTION_CONSTANTS.CONVERSION_RATE
           },
           meta: { timestamp: new Date().toISOString() },
         });
       } catch (error) {
         // Specific error handling for redemption (e.g., InsufficientPointsError)
         return handleApiError(request, reply, error);
       }
     },
  });
  
  // --- GET /redemptions --- (Placeholder for full redemption flow in Task 2.2)
  fastify.get<{ Querystring: TransactionQueryParams }>('/redemptions', {
     schema: {
       tags: ['Points', 'Redemption'],
       description: "Retrieves the user's redemption history.",
       querystring: {
         type: 'object',
         properties: {
           limit: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
           offset: { type: 'integer', default: 0, minimum: 0 }
         }
       }
       // Add detailed response schema
     },
     handler: async (request: FastifyRequest<{ Querystring: TransactionQueryParams }>, reply: FastifyReply) => {
       try {
         const userId = request.user?.id;
         if (!userId) {
            throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
         }
         
         const limit = request.query.limit || 20;
         const offset = request.query.offset || 0;
         
         // Delegate to redemption service (to be fully implemented in Task 2.2)
         // TODO: Implement method to get total count for pagination
         const redemptions = await redemptionService.getUserRedemptions(userId, limit, offset); 
         const total = 0; // Placeholder for total count
         
         return reply.code(200).send({
           // TODO: Add explicit type for r
           data: redemptions.map((r: any) => ({ id: r.id, pointsAmount: r.points_amount, tokenAmount: r.token_amount, status: r.status, createdAt: r.created_at, processedAt: r.processed_at, transactionHash: r.transaction_hash, walletAddress: r.wallet_address })),
           meta: { timestamp: new Date().toISOString() },
           pagination: { total, limit, offset, hasMore: offset + redemptions.length < total } // hasMore logic might be incorrect without total
         });
       } catch (error) {
         return handleApiError(request, reply, error);
       }
     },
  });

  // --- POST /redemptions/:id/cancel --- (Placeholder for full redemption flow in Task 2.2)
  fastify.post<{ Params: { id: string } }>('/redemptions/:id/cancel', {
     schema: {
       tags: ['Points', 'Redemption'],
       description: "Cancels a pending redemption request.",
       params: {
         type: 'object',
         required: ['id'],
         properties: { id: { type: 'string' } }
       }
       // Add detailed response schema
     },
     handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
       try {
         const userId = request.user?.id;
         if (!userId) {
            throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
         }
         
         // Delegate to redemption service (to be fully implemented in Task 2.2)
         const redemption = await redemptionService.cancelRedemption(request.params.id, userId);
         
         return reply.code(200).send({
           data: { success: true, redemption: { id: redemption.id, status: redemption.status, pointsAmount: redemption.points_amount, refunded: true } },
           meta: { timestamp: new Date().toISOString() },
         });
       } catch (error) {
         // Specific error handling (e.g., RedemptionNotFoundError, NotCancellableError)
         return handleApiError(request, reply, error);
       }
     },
  });

  // --- GET /caps ---
  fastify.get('/caps', {
    schema: {
      tags: ['Points'],
      description: "Retrieves the user's detailed daily and weekly point caps for all sources.",
      // Add detailed response schema if needed
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
         const userId = request.user?.id;
         if (!userId) {
            throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
         }
        
        const caps = await enhancedPointsService.getAllCaps(userId);
        
        const formattedCaps: Record<string, any> = {};
        // TODO: Add explicit types for capData and source
        caps.forEach((capData: any, source: any) => {
          formattedCaps[source] = {
            daily: { used: capData.daily.current, limit: capData.daily.limit, remaining: capData.daily.remaining, resetsAt: capData.daily.resetsAt },
            weekly: { used: capData.weekly.current, limit: capData.weekly.limit, remaining: capData.weekly.remaining, resetsAt: capData.weekly.resetsAt }
          };
        });
        
        return reply.code(200).send({
          data: { caps: formattedCaps },
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  // --- GET /redemption/eligibility --- (New endpoint for Task 2.2)
  fastify.get('/redemption/eligibility', {
    schema: {
      tags: ['Points', 'Redemption'],
      description: "Checks if the user is eligible to redeem points.",
      // Add detailed response schema
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
           throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
        }

        // Delegate to redemption service (to be fully implemented in Task 2.2)
        // TODO: Implement redemptionService.checkEligibility(userId)
        // const eligibility = await redemptionService.checkEligibility(userId);
        const eligibility = { placeholder: 'Eligibility data TBD' }; // Placeholder

        return reply.code(200).send({
          data: eligibility, 
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  // --- GET /trends --- (New endpoint for Task 2.2)
  fastify.get<{ Querystring: TrendsQueryParams }>('/trends', { // Use TrendsQueryParams type
    schema: {
      tags: ['Points', 'Analytics'],
      description: "Retrieves points earning trends over time.",
      querystring: TrendsQuerySchema, // Use Zod schema for request validation
      response: { // Add response schema
        200: TrendsResponseSchema 
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: TrendsQueryParams }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
           throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
        }

        // Period is validated and defaulted by TrendsQuerySchema
        const period = request.query.period ?? 'week'; 

        // Delegate to points service analytics (to be implemented in Task 2.2)
        // TODO: Implement enhancedPointsService.getTrends(userId, period)
        const trendsData = await enhancedPointsService.getTrends(userId, period); 

        // Format response according to schema
        return reply.code(200).send({
          data: {
            period: period,
            data: trendsData // Assuming service returns data in correct format
          },
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  // Note: Removed analytics sub-route registration as routes are now top-level
}
