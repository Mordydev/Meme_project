/**
 * Profile API Routes
 */
import { FastifyInstance } from 'fastify';
import { authMiddleware, authOptionalMiddleware } from '../../middleware/auth';
// Import handlers (will be created next)
import {
    getMyProfileHandler,
    updateMyProfileHandler,
    getUserProfileHandler
} from './handler';
// Import schemas (will be created next)
import {
    GetProfileParamsSchema,
    UpdateProfileBodySchema,
    ProfileResponseSchema
} from './schema';
// Import types (will be created next)
import { GetProfileParams, UpdateProfileBody } from './types';
import { z } from 'zod';

export default async function registerProfileRoutes(fastify: FastifyInstance) {

    // GET /api/v1/profiles/me - Get current user's profile
    fastify.get('/me', {
        schema: {
            tags: ['Profiles'],
            description: "Get the current authenticated user's profile.",
            response: { 200: ProfileResponseSchema } // Assuming a schema for the response
        },
        onRequest: [authMiddleware] // Requires authentication
    }, getMyProfileHandler);

    // PUT /api/v1/profiles/me - Update current user's profile
    fastify.put<{ Body: UpdateProfileBody }>('/me', {
        schema: {
            tags: ['Profiles'],
            description: "Update the current authenticated user's profile.",
            body: UpdateProfileBodySchema, // Assuming a schema for the request body
            response: { 200: ProfileResponseSchema } // Return updated profile
        },
        onRequest: [authMiddleware] // Requires authentication
    }, updateMyProfileHandler);

    // GET /api/v1/profiles/:userId - Get a user's public profile by ID
    fastify.get<{ Params: GetProfileParams }>('/:userId', {
        schema: {
            tags: ['Profiles'],
            description: "Get a user's public profile by their ID.",
            params: GetProfileParamsSchema, // Assuming a schema for URL params
            response: { 200: ProfileResponseSchema } // Assuming same response schema
        },
        onRequest: [authOptionalMiddleware] // Publicly viewable? Or require auth? Let's assume optional for now.
    }, getUserProfileHandler);

}
