/**
 * Points API Routes (Enhanced Implementation)
 * 
 * API endpoints for the Success Points system with Redis-based cap tracking,
 * improved fraud detection, and comprehensive redemption flow.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
// Corrected imports to use main service index
// Import eligibilityService as well
import { enhancedPointsService, redemptionService, walletService, eligibilityService } from '../../services'; 
import { handleApiError } from '../../errors'; // Assuming this handler exists and works with AppError
import { AppError } from '../../errors/base-error.js'; // Added .js extension
import { PointsSource, PointsTransaction } from '../../models/entities/points.model'; // Import camelCase type
import { 
    REDEMPTION_CONSTANTS, 
    CreateRedemptionRequestDto, // Import DTO
    Redemption, // Import camelCase type
    RedemptionResult, // Import result type
    PaginatedRedemptionResult, // Import result type
    PaginationMeta // Import PaginationMeta type
} from '../../models/entities/redemption.model'; 
// Import schemas for trends and eligibility
import { 
    TrendsQuerySchema, 
    TrendsResponseSchema, 
    EligibilityResponseSchema,
    PointsRedeemRequestSchema, 
    RedeemResponseSchema, 
    TransactionQuerySchema, 
    TransactionsResponseSchema, // Corrected import name
    RedemptionsResponseSchema, 
    CancelRedemptionParamsSchema, 
    CancelRedemptionResponseSchema,
    // Import specific response item schemas
    RedemptionHistoryItemSchema 
} from './schema'; 
import { TrendsQueryParams, TransactionQueryParams } from './types'; // Import types

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
        // Expecting { transactions: PointsTransaction[], total: number }
        const transactionsResult = await enhancedPointsService.getUserTransactions(userId, { limit: 5 }); 
        const caps = await enhancedPointsService.getAllCaps(userId);
        const wallet = await walletService.getUserWallet(userId); 

        const formattedCaps: Record<string, any> = {};
        // TODO: Add explicit types for capData and source
        caps.forEach((capData: any, source: any) => {
          formattedCaps[source] = {
            daily: { used: capData.daily.current, limit: capData.daily.limit, remaining: capData.daily.remaining, resetsAt: capData.daily.resetsAt?.toISOString() }, // Format dates
            weekly: { used: capData.weekly.current, limit: capData.weekly.limit, remaining: capData.weekly.remaining, resetsAt: capData.weekly.resetsAt?.toISOString() } // Format dates
          };
        });
        
        // getUserTransactions returns PointsTransaction entities (camelCase)
        const formattedTransactions = transactionsResult.transactions.map((tx: PointsTransaction) => ({ 
            id: tx.id,
            amount: tx.amount,
            source: tx.source as PointsSource, // Cast string to PointsSource enum for response
            referenceId: tx.referenceId, // Use camelCase
            createdAt: tx.createdAt.toISOString(), // Convert Date to ISO string
            description: tx.description,
            // metadata: tx.metadata // Metadata not in PointTransactionResponseItemSchema
        }));

        return reply.code(200).send({
          data: {
            balance,
            transactions: formattedTransactions, // Use formatted transactions
             caps: formattedCaps,
             wallet: wallet ? { isConnected: true, isVerified: wallet.isVerified, address: wallet.address } : { isConnected: false },
             redemption: { 
                 conversionRate: REDEMPTION_CONSTANTS.CONVERSION_RATE, 
                 minimumAmount: REDEMPTION_CONSTANTS.MINIMUM_AMOUNT, 
                 weeklyLimit: REDEMPTION_CONSTANTS.WEEKLY_LIMIT 
             }
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
      querystring: TransactionQuerySchema, // Use Zod schema
      response: { 200: TransactionsResponseSchema } // Correct schema name
    },
    handler: async (request: FastifyRequest<{ Querystring: TransactionQueryParams }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
           throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
        }
        
        // Use validated query params
        const limit = request.query.limit ?? 20;
        const offset = request.query.offset ?? 0;
        const source = request.query.source; 
        
        // Assuming getUserTransactions returns PointsTransaction entities (camelCase)
        const { transactions, total } = await enhancedPointsService.getUserTransactions(userId, { limit, offset, source }); 
        
        return reply.code(200).send({
          // Map properties from PointsTransaction to match PointTransactionResponseItemSchema
          data: transactions.map((tx: PointsTransaction) => ({ 
              id: tx.id,
              amount: tx.amount,
              source: tx.source as PointsSource, // Cast string to PointsSource enum for response
              referenceId: tx.referenceId, // Use camelCase
              createdAt: tx.createdAt.toISOString(), // Convert Date to ISO string for response
              description: tx.description,
              // metadata: tx.metadata // Metadata not in PointTransactionResponseItemSchema
          })),
          meta: { timestamp: new Date().toISOString() },
          pagination: { total, limit, offset, hasMore: offset + transactions.length < total } // Use returned total
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  // --- POST /award --- 
  // (Assuming this remains internal/admin and doesn't need model refactoring now)
  fastify.post<{ Body: PointsAwardRequest }>('/award', {
    schema: { /* ... existing schema ... */ },
    handler: async (request: FastifyRequest<{ Body: PointsAwardRequest }>, reply: FastifyReply) => {
        // ... existing handler ...
    },
  });

  // --- POST /redeem --- 
  fastify.post<{ Body: CreateRedemptionRequestDto }>('/redeem', { // Use DTO for Body type
     schema: {
       tags: ['Points', 'Redemption'],
       description: "Initiates a request to redeem points for tokens.",
       body: PointsRedeemRequestSchema, // Use correct schema name
       response: { 202: RedeemResponseSchema } // Use Zod schema for response
     },
     config: { 
        rateLimit: { max: 5, timeWindow: '1 hour' }
     },
     handler: async (request: FastifyRequest<{ Body: CreateRedemptionRequestDto }>, reply: FastifyReply) => {
       try {
         const userId = request.user?.id;
         if (!userId) {
            throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
         }
         
         // Body is already validated by schema and typed as CreateRedemptionRequestDto
         const { pointsAmount, walletAddress } = request.body; 
         let finalWalletAddress = walletAddress;

         // If wallet address is not provided in request, try to get the user's connected wallet
         if (!finalWalletAddress) {
           const connectedWallet = await walletService.getUserWallet(userId);
           if (!connectedWallet?.address) {
             throw new AppError('No wallet connected for redemption.', 'WALLET_NOT_CONNECTED', 400);
           }
           finalWalletAddress = connectedWallet.address;
         }
         
         // Delegate to redemption service using camelCase DTO
         // Explicitly type the result, assuming it matches RedemptionResult interface
         const result: RedemptionResult = await redemptionService.requestRedemption({ userId, pointsAmount, walletAddress: finalWalletAddress }); 
         
         const now = new Date();
         const daysUntilSunday = (7 - now.getUTCDay()) % 7; // Use UTC day
         const nextSunday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday));
         nextSunday.setUTCHours(0, 0, 0, 0);

         // Construct response matching RedeemResponseSchema
         // Check if result has the expected structure before accessing properties
         if (!result || typeof result.success !== 'boolean' || !result.redemption) {
             throw new Error('Invalid response structure from redemptionService.requestRedemption');
         }
         const responseData = {
             success: result.success, 
             requestId: result.redemption.id, 
             pointsAmount: result.redemption.pointsAmount,
             tokenAmount: result.redemption.tokenAmount,
             status: result.redemption.status,
             estimatedProcessingTime: nextSunday.toISOString(), 
             walletAddress: result.redemption.walletAddress,
             conversionRate: REDEMPTION_CONSTANTS.CONVERSION_RATE 
         };

         return reply.code(202).send({ 
           data: responseData,
           meta: { timestamp: new Date().toISOString() },
         });
       } catch (error) {
         return handleApiError(request, reply, error);
       }
     },
  });
  
  // --- GET /redemptions --- 
  fastify.get<{ Querystring: TransactionQueryParams }>('/redemptions', {
     schema: {
       tags: ['Points', 'Redemption'],
       description: "Retrieves the user's redemption history.",
       querystring: TransactionQuerySchema, // Use Zod schema
       response: { 200: RedemptionsResponseSchema } // Use Zod schema
     },
     handler: async (request: FastifyRequest<{ Querystring: TransactionQueryParams }>, reply: FastifyReply) => {
       try {
         const userId = request.user?.id;
         if (!userId) {
            throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
         }
         
         const limit = request.query.limit ?? 20;
         const offset = request.query.offset ?? 0;
         
         // Delegate to redemption service 
         // Explicitly type the result, assuming it matches PaginatedRedemptionResult interface
         const result: PaginatedRedemptionResult = await redemptionService.getUserRedemptions(userId, (offset / limit) + 1, limit); 
         
         // Check if result has the expected structure
         if (!result || !Array.isArray(result.data) || !result.pagination) {
             throw new Error('Invalid response structure from redemptionService.getUserRedemptions');
         }

         // Construct pagination object matching the API standard { total, limit, offset, hasMore, page, totalPages }
         const responsePagination: PaginationMeta & { limit: number; offset: number; hasMore: boolean } = { 
             total: result.pagination.total,
             limit: limit, // Use the requested limit
             offset: offset, // Use the requested offset
             page: result.pagination.page, // Include page from service result
             totalPages: result.pagination.totalPages, // Include totalPages from service result
             // Calculate hasMore based on total and current position
             hasMore: (offset + result.data.length) < result.pagination.total 
         };

         // Map data to match RedemptionHistoryItemSchema
         // Add explicit type for 'redemption' parameter
         const responseData = result.data.map((redemption: Redemption) => ({
             id: redemption.id,
             pointsAmount: redemption.pointsAmount,
             tokenAmount: redemption.tokenAmount,
             status: redemption.status,
             createdAt: redemption.createdAt.toISOString(), // Convert Date
             processedAt: redemption.processedAt ? redemption.processedAt.toISOString() : null, // Convert Date or null
             transactionHash: redemption.transactionHash,
             walletAddress: redemption.walletAddress
         }));

         return reply.code(200).send({
           data: responseData, // Send the mapped data array
           meta: { timestamp: new Date().toISOString() },
           pagination: responsePagination // Send the constructed API pagination object
         });
       } catch (error) {
         return handleApiError(request, reply, error);
       }
     },
  });

  // --- POST /redemptions/:id/cancel --- 
  fastify.post<{ Params: { id: string } }>('/redemptions/:id/cancel', {
     schema: {
       tags: ['Points', 'Redemption'],
       description: "Cancels a pending redemption request.",
       params: CancelRedemptionParamsSchema, // Use Zod schema
       response: { 200: CancelRedemptionResponseSchema } // Use Zod schema
     },
     handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
       try {
         const userId = request.user?.id;
         if (!userId) {
            throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
         }
         
         // Delegate to redemption service 
         // Explicitly type the result, assuming it matches RedemptionResult interface
         const result: RedemptionResult = await redemptionService.cancelRedemption(request.params.id, userId);
         
         // Check if result has the expected structure
         if (!result || typeof result.success !== 'boolean' || !result.redemption) {
             throw new Error('Invalid response structure from redemptionService.cancelRedemption');
         }

         // Construct response matching CancelRedemptionResponseSchema
         const responseData = {
             success: result.success,
             redemption: {
                 id: result.redemption.id,
                 status: result.redemption.status, // Should be 'cancelled'
                 pointsAmount: result.redemption.pointsAmount,
                 refunded: true // Indicate refund happened (based on cancellation logic)
             }
         }; 

         return reply.code(200).send({
           data: responseData, 
           meta: { timestamp: new Date().toISOString() },
         });
       } catch (error) {
         return handleApiError(request, reply, error);
       }
     },
  });

  // --- GET /caps ---
  fastify.get('/caps', {
    schema: { /* ... existing schema ... */ },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
        // ... existing handler ...
    },
  });

  // --- GET /redemption/eligibility --- 
  fastify.get('/redemption/eligibility', {
    schema: {
      tags: ['Points', 'Redemption'],
      description: "Checks if the user is eligible to redeem points.",
      response: { // Add response schema
        200: EligibilityResponseSchema
      }
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
           throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
         }

         // Delegate to eligibility service (imported now)
         const eligibility = await eligibilityService.checkEligibility(userId);

         // Format response according to schema
        // Fetch necessary details if not included in eligibility result (e.g., balance, wallet address)
        const currentBalance = await enhancedPointsService.getUserBalance(userId);
        const wallet = await walletService.getUserWallet(userId);

        return reply.code(200).send({
          data: {
            isEligible: eligibility.eligible,
            reasons: eligibility.reasons,
            checks: { 
                hasEnoughPoints: currentBalance >= (eligibility.limits?.minimum ?? REDEMPTION_CONSTANTS.MINIMUM_AMOUNT),
                isWalletConnected: !!wallet, 
                isWalletVerified: eligibility.walletVerified,
                isWeeklyCapReached: (eligibility.limits?.weekly.remaining ?? 0) <= 0
            },
            details: { 
                currentBalance: currentBalance, 
                minimumPoints: eligibility.limits?.minimum,
                walletAddress: wallet?.address, 
                weeklyUsed: eligibility.limits?.weekly.used,
                weeklyLimit: eligibility.limits?.weekly.limit
            }
          }, 
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  // --- GET /trends --- 
  fastify.get<{ Querystring: TrendsQueryParams }>('/trends', { 
    schema: {
      tags: ['Points', 'Analytics'],
      description: "Retrieves points earning trends over time.",
      querystring: TrendsQuerySchema, 
      response: { 200: TrendsResponseSchema }
    },
    handler: async (request: FastifyRequest<{ Querystring: TrendsQueryParams }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
           throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
         }

        const period = request.query.period ?? 'week'; 
        const trendsData = await enhancedPointsService.getTrends(userId, period); 

        // Format response according to schema
        return reply.code(200).send({
          data: {
            period: period,
            data: trendsData // Assuming service returns data in correct format (now camelCase)
          },
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

}
