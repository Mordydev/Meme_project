import { FeedRepository, FeedQuery } from '../repositories/feed-repository';
import { InterestRepository } from '../repositories/interest-repository';
import { SocialRepository } from '../repositories/social-repository';
import { TransactionManager } from '../lib/transaction';
import { EventEmitter, EventType } from '../lib/events';
import { FeedItem, FeedOptions, FeedPage } from '../models/social';
import { CacheService } from './core/cache-service';

export interface DiscoveryFeedOptions {
  limit?: number;
  cursor?: string;
  category?: string;
  type?: 'content' | 'battle' | 'all';
  userId?: string; // Optional - for personalization
}

/**
 * Class to help building feed queries
 */
class FeedQueryBuilder {
  private query: FeedQuery;
  
  constructor(userId: string) {
    this.query = {
      userId,
      limit: 20
    };
  }
  
  withFollowing(following: string[]): FeedQueryBuilder {
    if (following && following.length > 0) {
      this.query.following = following;
    }
    return this;
  }
  
  withInterests(interests: string[]): FeedQueryBuilder {
    if (interests && interests.length > 0) {
      this.query.interests = interests;
    }
    return this;
  }
  
  withCursor(cursor?: string): FeedQueryBuilder {
    if (cursor) {
      this.query.cursor = cursor;
    }
    return this;
  }
  
  withLimit(limit?: number): FeedQueryBuilder {
    if (limit) {
      this.query.limit = limit;
    }
    return this;
  }
  
  withExcludedIds(excludeIds?: string[]): FeedQueryBuilder {
    if (excludeIds && excludeIds.length > 0) {
      this.query.excludeIds = excludeIds;
    }
    return this;
  }
  
  build(): FeedQuery {
    return this.query;
  }
}

/**
 * Class to enhance feed items with additional data
 */
class FeedEnhancer {
  constructor(
    private socialRepository: SocialRepository
  ) {}
  
  async enhanceItems(items: FeedItem[], currentUserId: string): Promise<FeedItem[]> {
    if (!items.length) return [];
    
    const enhancedItems = await Promise.all(
      items.map(async (item) => {
        // Add user relationship data
        if (item.userId && item.userId !== currentUserId) {
          const isFollowing = await this.socialRepository.checkFollowExists(
            currentUserId, item.userId
          ).catch(() => false);
          
          return {
            ...item,
            relationship: {
              isFollowing
            }
          };
        }
        
        return item;
      })
    );
    
    return enhancedItems;
  }
}

/**
 * Helper for feed cursor encoding/decoding
 */
class FeedCursorHelper {
  encode(item: FeedItem): string {
    return Buffer.from(`${item.createdAt.toISOString()}|${item.id}`).toString('base64');
  }
  
  decode(cursor: string): { timestamp: string; id: string } {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const [timestamp, id] = decoded.split('|');
      return { timestamp, id };
    } catch (error) {
      throw new Error('Invalid feed cursor');
    }
  }
}

/**
 * Service for managing user activity feeds
 */
export class FeedService {
  private feedQueryBuilder: typeof FeedQueryBuilder;
  private feedEnhancer: FeedEnhancer;
  private feedCursorHelper: FeedCursorHelper;
  
  constructor(
    private feedRepository: FeedRepository,
    private interestRepository: InterestRepository,
    private socialRepository: SocialRepository,
    private eventEmitter: EventEmitter,
    private transactionManager: TransactionManager,
    private cacheService: CacheService
  ) {
    this.feedQueryBuilder = FeedQueryBuilder;
    this.feedEnhancer = new FeedEnhancer(socialRepository);
    this.feedCursorHelper = new FeedCursorHelper();
  }

  /**
   * Register event handlers for this service
   */
  registerEventHandlers(): void {
    // Listen for content events to update feeds
    this.eventEmitter.on(EventType.CONTENT_CREATED, async (data) => {
      try {
        await this.addItemToFeeds({
          type: 'content',
          itemId: data.contentId,
          userId: data.creatorId,
          priority: 80,
          createdAt: new Date(data.timestamp)
        });
      } catch (error) {
        console.error('Error adding content to feeds:', error);
      }
    });
    
    // Listen for battle events
    this.eventEmitter.on(EventType.BATTLE_CREATED, async (data) => {
      try {
        await this.addItemToFeeds({
          type: 'battle',
          itemId: data.battleId,
          userId: data.creatorId,
          priority: 90, // Higher priority for battles
          createdAt: new Date(data.timestamp)
        });
      } catch (error) {
        console.error('Error adding battle to feeds:', error);
      }
    });
    
    // Listen for achievement events
    this.eventEmitter.on(EventType.ACHIEVEMENT_UNLOCKED, async (data) => {
      try {
        await this.addItemToFeeds({
          type: 'achievement',
          itemId: data.achievementId,
          userId: data.userId,
          priority: 70,
          createdAt: new Date(data.timestamp)
        });
      } catch (error) {
        console.error('Error adding achievement to feeds:', error);
      }
    });
    
    // Listen for follow events
    this.eventEmitter.on(EventType.USER_FOLLOWED, async (data) => {
      try {
        await this.addItemToFeeds({
          type: 'follow',
          itemId: `${data.followerId}_${data.followedId}`,
          userId: data.followerId,
          priority: 60,
          createdAt: new Date(data.timestamp)
        }, [data.followedId]); // Only add to followed user's feed
      } catch (error) {
        console.error('Error adding follow to feeds:', error);
      }
    });
  }

  /**
   * Get personalized feed for a user
   */
  async getUserFeed(userId: string, options: FeedOptions = {}): Promise<FeedPage> {
    const { cursor, limit = 20, context, bypassCache } = options;
    const cacheKey = `feed:user:${userId}:${context || 'default'}:${cursor || 'start'}:${limit}`;
    
    // Try cache first for non-authenticated feeds
    if (!bypassCache) {
      const cached = await this.cacheService.get<FeedPage>(cacheKey);
      if (cached) return cached;
    }
    
    // Get user's interests and relationships
    const [followingResult, interests] = await Promise.all([
      this.socialRepository.getUserFollowing(userId),
      this.interestRepository.getUserInterests(userId)
    ]);
    
    // Build feed query
    const query = new this.feedQueryBuilder(userId)
      .withFollowing(followingResult.following.map(f => f.followedId))
      .withInterests(interests.map(i => i.interest))
      .withCursor(cursor)
      .withLimit(limit)
      .build();
    
    // Execute query
    const feedItems = await this.feedRepository.getFeed(query);
    
    // Enhance items with additional context
    const enhancedItems = await this.feedEnhancer.enhanceItems(
      feedItems.data, 
      userId
    );
    
    const result = {
      data: enhancedItems,
      meta: {
        ...feedItems.meta,
        cursor: feedItems.data.length ? 
          this.feedCursorHelper.encode(feedItems.data[feedItems.data.length - 1]) : null
      }
    };
    
    // Cache result for short period
    if (!bypassCache) {
      await this.cacheService.set(cacheKey, result, 60); // 1 minute cache
    }
    
    return result;
  }

  /**
   * Get discovery feed with trending content and battles
   */
  async getDiscoveryFeed(options: DiscoveryFeedOptions = {}): Promise<FeedPage> {
    const { limit = 20, cursor, category, type = 'all', userId } = options;
    const cacheKey = `feed:discover:${type}:${category || 'all'}:${cursor || 'start'}:${limit}`;
    
    // Try cache first for anonymous users or non-personalized requests
    if (!userId) {
      const cached = await this.cacheService.get<FeedPage>(cacheKey);
      if (cached) return cached;
    }
    
    // Build query parameters based on options
    const queryParams: any = {
      limit,
      cursor,
      includeTypes: type === 'all' ? ['content', 'battle'] : [type]
    };
    
    if (category) {
      queryParams.category = category;
    }
    
    // Add user context for personalization if available
    if (userId) {
      const [followingResult, interests] = await Promise.all([
        this.socialRepository.getUserFollowing(userId),
        this.interestRepository.getUserInterests(userId)
      ]);
      
      queryParams.userId = userId;
      queryParams.following = followingResult.following.map(f => f.followedId);
      queryParams.interests = interests.map(i => i.interest);
    }
    
    // Fetch trending content
    const feedItems = await this.feedRepository.getDiscoveryFeed(queryParams);
    
    // Enhance items with additional context
    const enhancedItems = userId ? 
      await this.feedEnhancer.enhanceItems(feedItems.data, userId) : 
      feedItems.data;
    
    const result = {
      data: enhancedItems,
      meta: {
        ...feedItems.meta,
        cursor: feedItems.data.length ? 
          this.feedCursorHelper.encode(feedItems.data[feedItems.data.length - 1]) : null
      }
    };
    
    // Cache results if not personalized
    if (!userId) {
      await this.cacheService.set(cacheKey, result, 60 * 5); // 5 minutes cache
    }
    
    return result;
  }

  /**
   * Add item to feeds (used by event handlers)
   */
  private async addItemToFeeds(
    item: Omit<FeedItem, 'id'>,
    specificUserIds?: string[]
  ): Promise<void> {
    if (specificUserIds && specificUserIds.length > 0) {
      // Add only to specific user feeds
      await Promise.all(
        specificUserIds.map(userId =>
          this.feedRepository.addFeedItem({
            ...item,
            userId: userId // Target user feed
          })
        )
      );
    } else {
      // Add to main feed
      await this.feedRepository.addFeedItem(item);
      
      // For follows, no need to spread beyond specific users
      if (item.type === 'follow') return;
      
      // Additional logic for spreading to follower feeds, etc.
      // This would involve getting followers of the item creator
      // and creating personalized feed items for each
      // Omitted for brevity but would be implemented for a full system
    }
  }
}
