import { FastifyInstance, FastifyRequest } from 'fastify';
import { WebSocketService } from '../websockets/websocket-service';
import { MetricsService } from '../services/core/metrics-service';
import { NotificationRepository } from '../repositories/notification-repository';
import { ServiceContainer } from '../services/core/service-provider';

declare module 'fastify' {
  interface FastifyInstance {
    // Authentication
    auth?: any;
    clerk?: any;
    authenticate: (request: FastifyRequest) => Promise<{ userId: string }>;
    // WebSocket service
    websocket: WebSocketService;
    
    // Metrics service
    metrics?: MetricsService;
    
    // Core services
    services: ServiceContainer;
    
    // Repositories
    notificationRepository: NotificationRepository;
    
    // Other services
    redis?: any;
  }
  
  interface FastifyRequest {
    // Authentication data
    userId?: string;
    user?: any;
    auth?: { userId?: string; };
  }
}
