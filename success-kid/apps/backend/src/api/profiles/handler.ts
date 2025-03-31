/**
 * Profile API Handlers
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { profileService } from '../../services'; // Import the profile service
import { handleApiError } from '../../errors';
import { NotFoundError, ForbiddenError, ValidationError } from '../../lib/errors';
import { logger } from '../../lib/logger'; // Keep logger import
import { GetProfileParams, UpdateProfileBody } from './types';
import { GetProfileParamsSchema, UpdateProfileBodySchema, ProfileSchema } from './schema';

/**
 * Get the profile of the currently authenticated user.
 */
export async function getMyProfileHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        // @ts-ignore - Assuming request.user is populated by auth middleware
        const userId = request.user?.id;
        if (!userId) {
            throw new ForbiddenError('Authentication required to view your profile.');
        }

        // Fetch profile using the service
        const profile = await profileService.getProfileByUserId(userId); // Use correct method name
        if (!profile) {
            // This case might indicate an issue if an authenticated user doesn't have a profile
            logger.error(`Profile not found for authenticated user: ${userId}`);
            throw new NotFoundError('Profile');
        }

        // Add email only for the 'me' endpoint
        const responseData = {
            ...profile,
            // email: request.user?.email // Email is not part of the profile object returned by service
        };

        // Validate response data against schema before sending (optional but good practice)
        // Note: ProfileSchema needs email to be optional if we don't include it here
        const validatedData = ProfileSchema.parse(responseData);

        return reply.code(200).send({
            data: validatedData,
            meta: { timestamp: new Date().toISOString() }
        });
    } catch (error) {
        return handleApiError(request, reply, error);
    }
}

/**
 * Update the profile of the currently authenticated user.
 */
export async function updateMyProfileHandler(
    request: FastifyRequest<{ Body: UpdateProfileBody }>,
    reply: FastifyReply
) {
    try {
        // @ts-ignore - Assuming request.user is populated
        const userId = request.user?.id;
        if (!userId) {
            throw new ForbiddenError('Authentication required to update your profile.');
        }

        const dataToUpdate = UpdateProfileBodySchema.parse(request.body);

        // Call the new updateProfile service method
        const updatedProfile = await profileService.updateProfile(userId, dataToUpdate);

        if (!updatedProfile) {
             // Handle case where update failed or profile not found
            logger.error(`Failed to update profile for user: ${userId}`);
            throw new NotFoundError('Profile');
        }

         // Add email only for the 'me' endpoint response
        const responseData = {
            ...updatedProfile,
             // email: request.user?.email // Email is not part of the profile object returned by service
        };

        // Validate response data
        // Note: ProfileSchema needs email to be optional if we don't include it here
        const validatedData = ProfileSchema.parse(responseData);

        return reply.code(200).send({
            data: validatedData,
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
 * Get a public user profile by userId.
 */
export async function getUserProfileHandler(
    request: FastifyRequest<{ Params: GetProfileParams }>,
    reply: FastifyReply
) {
    try {
        const { userId } = GetProfileParamsSchema.parse(request.params);

        // Fetch profile using the service
        const profile = await profileService.getProfileByUserId(userId); // Use correct method name
        if (!profile) {
            throw new NotFoundError('User profile', userId);
        }

        // For public view, potentially omit sensitive fields like email
        // The profile object from the service doesn't contain email, so no need to remove it.
        const responseData = { ...profile };

        // Validate against the schema (ProfileSchema should have email as optional)
        const validatedData = ProfileSchema.parse(responseData);


        return reply.code(200).send({
            data: validatedData,
            meta: { timestamp: new Date().toISOString() }
        });
    } catch (error) {
         if (error instanceof z.ZodError) {
            return reply.code(400).send({ errors: error.errors });
        }
        return handleApiError(request, reply, error);
    }
}
