import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { MarketHistoryQuery, MarketTransactionsQuery } from './types';
import { MarketHistoryQuerySchema, MarketTransactionsQuerySchema } from './schema';
import { logger } from '../../lib/logger';
import { handleApiError } from '../../errors/handlers'; // Assuming this exists
import { marketService } from '../../services'; // Import the actual marketService
import { NotFoundError } from '../../lib/errors'; // Import specific errors if needed

/**
 * Get current market statistics
 */
export async function getMarketStatsHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const stats = await marketService.getCurrentStats();
        if (!stats) {
            // Handle case where service returns null (e.g., API error)
            throw new NotFoundError('Market stats');
        }
        return reply.code(200).send({
            data: stats,
            meta: { timestamp: new Date().toISOString() }
        });
    } catch (error) {
        return handleApiError(request, reply, error);
    }
}

/**
 * Get historical market price data
 */
export async function getMarketPriceHistoryHandler(
    request: FastifyRequest<{ Querystring: MarketHistoryQuery }>,
    reply: FastifyReply
) {
    try {
        const query = MarketHistoryQuerySchema.parse(request.query);
        // Provide a default period if not specified or if 'all' is passed (service doesn't support 'all')
        const period = (query.period && query.period !== 'all') ? query.period : '24h'; 
        
        const history = await marketService.getPriceHistory(period);

        return reply.code(200).send({
            data: history,
            meta: { timestamp: new Date().toISOString() }
        });
    } catch (error) {
         if (error instanceof z.ZodError) {
            return reply.code(400).send({ errors: error.errors });
        }
        return handleApiError(request, reply, error);
    }
}

/**
 * Get market milestone progress
 */
export async function getMarketMilestonesHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const progress = await marketService.getMilestoneProgress();
         if (!progress) {
            throw new NotFoundError('Milestone progress');
        }
        return reply.code(200).send({
            data: progress,
            meta: { timestamp: new Date().toISOString() }
        });
    } catch (error) {
        return handleApiError(request, reply, error);
    }
}

/**
 * Get recent market transactions
 */
export async function getMarketTransactionsHandler(
    request: FastifyRequest<{ Querystring: MarketTransactionsQuery }>,
    reply: FastifyReply
) {
    try {
        const query = MarketTransactionsQuerySchema.parse(request.query);
        // Assuming service method takes limit directly
        const transactions = await marketService.getRecentTransactions(query.limit);

        // Note: The service currently returns only the data array.
        // Pagination logic (cursor, hasMore) would need to be implemented
        // in the service/repository if required by the API design.
        // For now, returning just the data based on the service implementation.

        return reply.code(200).send({
            data: transactions,
            meta: { timestamp: new Date().toISOString() },
            pagination: { // Placeholder pagination
                limit: query.limit,
                // nextCursor: null, // Add cursor logic if implemented
                // hasMore: false    // Add hasMore logic if implemented
            }
        });
    } catch (error) {
         if (error instanceof z.ZodError) {
            return reply.code(400).send({ errors: error.errors });
        }
        return handleApiError(request, reply, error);
    }
}
