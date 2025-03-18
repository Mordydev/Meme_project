/**
 * Cache Invalidation Service
 * 
 * Provides patterns for effective cache invalidation based on events
 * and database changes.
 */
import { cacheService } from './cache-service';
import { logger } from '../../lib/logger';
import { EventEmitter } from 'events';

/**
 * Cache invalidation event
 */
export type InvalidationEvent = {
  /** Entity type (e.g., 'user', 'content', 'point') */
  entity: string;
  
  /** Entity ID */
  id: string | number;
  
  /** Operation that triggered invalidation (e.g., 'create', 'update', 'delete') */
  operation: 'create' | 'update' | 'delete';
  
  /** Additional data related to the operation */
  data?: any;
};

/**
 * Cache invalidation rules for entity operations
 */
export type InvalidationRule = {
  /** Entity type to watch for changes */
  entity: string;
  
  /** Operations that trigger this rule */
  operations: Array<'create' | 'update' | 'delete'>;
  
  /** Function to generate tags to invalidate based on event */
  tagsToInvalidate: (event: InvalidationEvent) => string[];
  
  /** Function to generate patterns to invalidate based on event */
  patternsToInvalidate?: (event: InvalidationEvent) => string[];
};

/**
 * Service for managing cache invalidation based on rules
 */
export class CacheInvalidationService {
  /** Event emitter for invalidation events */
  private events = new EventEmitter();
  
  /** Invalidation rules */
  private rules: InvalidationRule[] = [];
  
  /**
   * Initialize cache invalidation service
   */
  constructor() {
    // Add default invalidation rules
    this.addDefaultRules();
  }
  
  /**
   * Add a cache invalidation rule
   * 
   * @param rule Invalidation rule to add
   * @returns The service instance for chaining
   */
  addRule(rule: InvalidationRule): this {
    this.rules.push(rule);
    return this;
  }
  
  /**
   * Add default invalidation rules
   */
  private addDefaultRules() {
    // User profile updates invalidate user profiles
    this.addRule({
      entity: 'user',
      operations: ['update', 'delete'],
      tagsToInvalidate: (event) => [
        `user:${event.id}`,
        'users'
      ]
    });
    
    // Profile updates invalidate user profiles
    this.addRule({
      entity: 'profile',
      operations: ['update'],
      tagsToInvalidate: (event) => [
        `user:${event.id}`,
        `profile:${event.id}`,
        'profiles'
      ]
    });
    
    // Content changes invalidate content feeds and specific content
    this.addRule({
      entity: 'content',
      operations: ['create', 'update', 'delete'],
      tagsToInvalidate: (event) => {
        const tags = [`content:${event.id}`, 'content'];
        
        // Add user-specific tags if user ID is in data
        if (event.data && event.data.userId) {
          tags.push(`user:${event.data.userId}`);
        }
        
        // Add content type tag if type is in data
        if (event.data && event.data.type) {
          tags.push(`content-type:${event.data.type}`);
        }
        
        return tags;
      }
    });
    
    // Comment changes invalidate content and comment feeds
    this.addRule({
      entity: 'comment',
      operations: ['create', 'update', 'delete'],
      tagsToInvalidate: (event) => {
        const tags = [`comment:${event.id}`, 'comments'];
        
        // Add content-specific tags if content ID is in data
        if (event.data && event.data.contentId) {
          tags.push(`content:${event.data.contentId}`);
        }
        
        // Add user-specific tags if user ID is in data
        if (event.data && event.data.userId) {
          tags.push(`user:${event.data.userId}`);
        }
        
        return tags;
      }
    });
    
    // Point transactions invalidate user points data
    this.addRule({
      entity: 'point',
      operations: ['create', 'update', 'delete'],
      tagsToInvalidate: (event) => {
        const tags = [`point:${event.id}`, 'points'];
        
        // Add user-specific tags if user ID is in data
        if (event.data && event.data.userId) {
          tags.push(`user:${event.data.userId}`);
          tags.push(`user-points:${event.data.userId}`);
        }
        
        return tags;
      }
    });
    
    // Achievement unlocks invalidate user achievements data
    this.addRule({
      entity: 'achievement',
      operations: ['create', 'update'],
      tagsToInvalidate: (event) => {
        const tags = [`achievement:${event.id}`, 'achievements'];
        
        // Add user-specific tags if user ID is in data
        if (event.data && event.data.userId) {
          tags.push(`user:${event.data.userId}`);
          tags.push(`user-achievements:${event.data.userId}`);
        }
        
        return tags;
      }
    });
    
    // Leaderboard updates invalidate leaderboard caches
    this.addRule({
      entity: 'leaderboard',
      operations: ['update'],
      tagsToInvalidate: (event) => {
        const tags = ['leaderboard'];
        
        // Add timeframe-specific tags if timeframe is in data
        if (event.data && event.data.timeframe) {
          tags.push(`timeframe:${event.data.timeframe}`);
        }
        
        // Add category-specific tags if category is in data
        if (event.data && event.data.category) {
          tags.push(`category:${event.data.category}`);
        }
        
        return tags;
      }
    });
    
    // Wallet connections invalidate user wallet data
    this.addRule({
      entity: 'wallet',
      operations: ['create', 'update', 'delete'],
      tagsToInvalidate: (event) => {
        const tags = [`wallet:${event.id}`, 'wallets'];
        
        // Add user-specific tags if user ID is in data
        if (event.data && event.data.userId) {
          tags.push(`user:${event.data.userId}`);
        }
        
        return tags;
      }
    });
    
    // Market data updates invalidate market caches
    this.addRule({
      entity: 'market',
      operations: ['update'],
      tagsToInvalidate: () => ['market']
    });
  }
  
  /**
   * Invalidate cache based on an event
   * 
   * @param event Invalidation event
   * @returns Promise resolving when invalidation is complete
   */
  async invalidate(event: InvalidationEvent): Promise<void> {
    logger.debug('Processing cache invalidation event', { event });
    
    // Find applicable rules
    const applicableRules = this.rules.filter(rule => 
      rule.entity === event.entity && 
      rule.operations.includes(event.operation)
    );
    
    // No applicable rules
    if (applicableRules.length === 0) {
      return;
    }
    
    // Collect all tags and patterns to invalidate
    const tagsToInvalidate = new Set<string>();
    const patternsToInvalidate = new Set<string>();
    
    // Process all applicable rules
    for (const rule of applicableRules) {
      // Add tags from rule
      const tags = rule.tagsToInvalidate(event);
      tags.forEach(tag => tagsToInvalidate.add(tag));
      
      // Add patterns from rule if any
      if (rule.patternsToInvalidate) {
        const patterns = rule.patternsToInvalidate(event);
        patterns.forEach(pattern => patternsToInvalidate.add(pattern));
      }
    }
    
    // Invalidate all collected tags
    const invalidationPromises: Promise<number>[] = [];
    
    for (const tag of tagsToInvalidate) {
      invalidationPromises.push(cacheService.invalidateByTag(tag));
    }
    
    // Invalidate all collected patterns
    for (const pattern of patternsToInvalidate) {
      invalidationPromises.push(cacheService.invalidateByPattern(pattern));
    }
    
    // Wait for all invalidations to complete
    await Promise.all(invalidationPromises);
    
    // Emit invalidation event
    this.events.emit('invalidated', { 
      event, 
      tags: Array.from(tagsToInvalidate),
      patterns: Array.from(patternsToInvalidate)
    });
  }
  
  /**
   * Subscribe to invalidation events
   * 
   * @param event Event name
   * @param listener Event handler
   * @returns The service instance for chaining
   */
  on(event: 'invalidated', listener: (data: any) => void): this {
    this.events.on(event, listener);
    return this;
  }
  
  /**
   * Unsubscribe from invalidation events
   * 
   * @param event Event name
   * @param listener Event handler
   * @returns The service instance for chaining
   */
  off(event: 'invalidated', listener: (data: any) => void): this {
    this.events.off(event, listener);
    return this;
  }
}

// Export singleton instance
export const cacheInvalidationService = new CacheInvalidationService();

// Export default for convenience
export default cacheInvalidationService;
