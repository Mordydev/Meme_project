/**
 * Analytics Service
 * 
 * Manages user behavior tracking, event logging, and analytics processing.
 */
import { FastifyInstance } from 'fastify';
import { logger } from '@/lib/logging/logger';
import { monitoringService } from '@/monitoring/service';
import { AppError } from '@/errors/base-error';

/**
 * User event data structure
 */
export interface UserEvent {
  eventId: string;
  userId?: string;
  sessionId?: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: Date;
  properties?: Record<string, any>;
  path?: string;
  referrer?: string;
  userAgent?: string;
}

/**
 * Page view data structure
 */
export interface PageView {
  userId?: string;
  sessionId?: string;
  path: string;
  title?: string;
  referrer?: string;
  timestamp: Date;
  duration?: number;
  userAgent?: string;
  deviceInfo?: {
    deviceType?: string;
    browser?: string;
    os?: string;
  };
  performance?: {
    loadTime?: number;
    domContentLoaded?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
}

/**
 * User interaction data structure
 */
export interface UserInteraction {
  userId?: string;
  sessionId?: string;
  type: 'click' | 'view' | 'scroll' | 'input' | 'custom';
  target: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
  path?: string;
}

/**
 * Batch ingestion data structure
 */
export interface AnalyticsBatch {
  sessionId: string;
  timestamp: number;
  events: any[];
  interactions: any[];
  metrics: any;
  userAgent: string;
  url: string;
}

/**
 * Analytics tracking service
 */
export class AnalyticsService {
  private eventHandlers: Array<(event: UserEvent) => Promise<void>> = [];
  private pageViewHandlers: Array<(pageView: PageView) => Promise<void>> = [];
  private interactionHandlers: Array<(interaction: UserInteraction) => Promise<void>> = [];
  
  /**
   * Track a user event
   * 
   * @param event User event data to track
   */
  async trackEvent(event: Omit<UserEvent, 'eventId' | 'timestamp'>): Promise<void> {
    try {
      const fullEvent: UserEvent = {
        ...event,
        eventId: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        timestamp: new Date(),
      };
      
      // Run all event handlers
      await this.notifyEventHandlers(fullEvent);
      
      // Record metric
      monitoringService.recordMetric('analytics.events', 1, {
        category: event.category,
        action: event.action
      });
      
      logger.debug('User event tracked', {
        eventId: fullEvent.eventId,
        userId: fullEvent.userId,
        category: fullEvent.category,
        action: fullEvent.action
      });
    } catch (error) {
      logger.error('Failed to track user event', { error, event });
      
      // Re-throw for API error handling
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to track event', 'TRACKING_ERROR', 500);
    }
  }
  
  /**
   * Track a page view
   * 
   * @param pageView Page view data to track
   */
  async trackPageView(pageView: Omit<PageView, 'timestamp'>): Promise<void> {
    try {
      const fullPageView: PageView = {
        ...pageView,
        timestamp: new Date(),
      };
      
      // Run all page view handlers
      await this.notifyPageViewHandlers(fullPageView);
      
      // Record metric
      monitoringService.recordMetric('analytics.page_views', 1, {
        path: pageView.path
      });
      
      logger.debug('Page view tracked', {
        userId: fullPageView.userId,
        path: fullPageView.path
      });
    } catch (error) {
      logger.error('Failed to track page view', { error, pageView });
      
      // Re-throw for API error handling
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to track page view', 'TRACKING_ERROR', 500);
    }
  }
  
  /**
   * Track a user interaction
   * 
   * @param interaction User interaction data to track
   */
  async trackInteraction(interaction: Omit<UserInteraction, 'timestamp'>): Promise<void> {
    try {
      const fullInteraction: UserInteraction = {
        ...interaction,
        timestamp: new Date(),
      };
      
      // Run all interaction handlers
      await this.notifyInteractionHandlers(fullInteraction);
      
      // Record metric
      monitoringService.recordMetric('analytics.interactions', 1, {
        type: interaction.type,
        target: interaction.target
      });
      
      logger.debug('User interaction tracked', {
        userId: fullInteraction.userId,
        type: fullInteraction.type,
        target: fullInteraction.target
      });
    } catch (error) {
      logger.error('Failed to track user interaction', { error, interaction });
    }
  }
  
  /**
   * Process a batch of analytics data
   * 
   * @param batch Analytics batch data
   */
  async processBatch(batch: AnalyticsBatch): Promise<void> {
    try {
      // Process events
      for (const eventData of batch.events) {
        await this.trackEvent({
          ...eventData,
          sessionId: batch.sessionId,
          timestamp: new Date(eventData.timestamp || batch.timestamp)
        });
      }
      
      // Process interactions
      for (const interactionData of batch.interactions) {
        await this.trackInteraction({
          ...interactionData,
          sessionId: batch.sessionId,
          timestamp: new Date(interactionData.timestamp || batch.timestamp),
          path: batch.url
        });
      }
      
      // Record metrics
      if (batch.metrics) {
        // Record core web vitals if present
        const webVitals = batch.metrics.coreWebVitals;
        if (webVitals) {
          if (webVitals.LCP) {
            monitoringService.recordMetric('web_vitals.lcp', webVitals.LCP, {}, monitoringService.MetricType.HISTOGRAM);
          }
          if (webVitals.FID) {
            monitoringService.recordMetric('web_vitals.fid', webVitals.FID, {}, monitoringService.MetricType.HISTOGRAM);
          }
          if (webVitals.CLS) {
            monitoringService.recordMetric('web_vitals.cls', webVitals.CLS, {}, monitoringService.MetricType.HISTOGRAM);
          }
          if (webVitals.INP) {
            monitoringService.recordMetric('web_vitals.inp', webVitals.INP, {}, monitoringService.MetricType.HISTOGRAM);
          }
        }
      }
      
      logger.debug('Analytics batch processed', {
        sessionId: batch.sessionId,
        eventsCount: batch.events.length,
        interactionsCount: batch.interactions.length
      });
    } catch (error) {
      logger.error('Failed to process analytics batch', { error });
      throw new AppError('Failed to process analytics batch', 'TRACKING_ERROR', 500);
    }
  }
  
  /**
   * Register an event handler
   * 
   * @param handler Handler function for events
   * @returns Unregister function
   */
  registerEventHandler(handler: (event: UserEvent) => Promise<void>): () => void {
    this.eventHandlers.push(handler);
    
    // Return unregister function
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index !== -1) {
        this.eventHandlers.splice(index, 1);
      }
    };
  }
  
  /**
   * Register a page view handler
   * 
   * @param handler Handler function for page views
   * @returns Unregister function
   */
  registerPageViewHandler(handler: (pageView: PageView) => Promise<void>): () => void {
    this.pageViewHandlers.push(handler);
    
    // Return unregister function
    return () => {
      const index = this.pageViewHandlers.indexOf(handler);
      if (index !== -1) {
        this.pageViewHandlers.splice(index, 1);
      }
    };
  }
  
  /**
   * Register an interaction handler
   * 
   * @param handler Handler function for interactions
   * @returns Unregister function
   */
  registerInteractionHandler(handler: (interaction: UserInteraction) => Promise<void>): () => void {
    this.interactionHandlers.push(handler);
    
    // Return unregister function
    return () => {
      const index = this.interactionHandlers.indexOf(handler);
      if (index !== -1) {
        this.interactionHandlers.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all event handlers
   * 
   * @param event User event
   */
  private async notifyEventHandlers(event: UserEvent): Promise<void> {
    for (const handler of this.eventHandlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error('Error in event handler', { error });
      }
    }
  }
  
  /**
   * Notify all page view handlers
   * 
   * @param pageView Page view
   */
  private async notifyPageViewHandlers(pageView: PageView): Promise<void> {
    for (const handler of this.pageViewHandlers) {
      try {
        await handler(pageView);
      } catch (error) {
        logger.error('Error in page view handler', { error });
      }
    }
  }
  
  /**
   * Notify all interaction handlers
   * 
   * @param interaction User interaction
   */
  private async notifyInteractionHandlers(interaction: UserInteraction): Promise<void> {
    for (const handler of this.interactionHandlers) {
      try {
        await handler(interaction);
      } catch (error) {
        logger.error('Error in interaction handler', { error });
      }
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

/**
 * Set up analytics API endpoints
 * 
 * @param app Fastify instance
 */
export function setupAnalytics(app: FastifyInstance): void {
  // Analytics track endpoint
  app.post('/api/v1/analytics/track', {
    schema: {
      body: {
        type: 'object',
        required: ['category', 'action'],
        properties: {
          category: { type: 'string' },
          action: { type: 'string' },
          label: { type: 'string' },
          value: { type: 'number' },
          properties: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    const { category, action, label, value, properties } = request.body as any;
    
    await analyticsService.trackEvent({
      userId: (request as any).user?.id,
      category,
      action,
      label,
      value,
      properties,
      path: request.headers.referer,
      userAgent: request.headers['user-agent']
    });
    
    return reply.code(204).send();
  });
  
  // Analytics page view endpoint
  app.post('/api/v1/analytics/pageview', {
    schema: {
      body: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string' },
          title: { type: 'string' },
          referrer: { type: 'string' },
          duration: { type: 'number' },
          performance: { 
            type: 'object',
            properties: {
              loadTime: { type: 'number' },
              domContentLoaded: { type: 'number' },
              firstContentfulPaint: { type: 'number' },
              largestContentfulPaint: { type: 'number' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { path, title, referrer, duration, performance } = request.body as any;
    
    await analyticsService.trackPageView({
      userId: (request as any).user?.id,
      path,
      title,
      referrer,
      duration,
      performance,
      userAgent: request.headers['user-agent']
    });
    
    return reply.code(204).send();
  });
  
  // Analytics batch endpoint - used by frontend monitoring service
  app.post('/api/v1/analytics', async (request, reply) => {
    const batch = request.body as AnalyticsBatch;
    
    await analyticsService.processBatch(batch);
    
    return reply.code(204).send();
  });
}

export default {
  service: analyticsService,
  setup: setupAnalytics
};