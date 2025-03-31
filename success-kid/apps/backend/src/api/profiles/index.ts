/**
 * Profiles API Module Entry Point
 */
import { FastifyInstance } from 'fastify';
import registerProfileRoutes from './routes';

/**
 * Registers all profile-related routes with the Fastify instance.
 * @param fastify - The Fastify instance.
 * @param opts - Plugin options (optional).
 */
export default async function profileModule(fastify: FastifyInstance, opts: Record<string, unknown>): Promise<void> {
    // Register all routes defined in routes.ts
    // Prefix all routes with /api/v1/profiles
    fastify.register(registerProfileRoutes, { prefix: '/api/v1/profiles' });
}
