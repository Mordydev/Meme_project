// Type augmentation for Fastify to add custom properties
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    locals?: {
      startTime: [number, number];
      [key: string]: any;
    };
    routerPath?: string;
  }
}
