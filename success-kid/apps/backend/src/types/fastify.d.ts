// Type augmentation for Fastify to add custom properties
import 'fastify';
import { ClerkUser } from '../lib/clerk/client';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
      [key: string]: any;
    };
    locals?: Record<string, any>;
    routerPath?: string;
  }
}
