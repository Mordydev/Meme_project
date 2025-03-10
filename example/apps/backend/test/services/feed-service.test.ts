import { FeedService } from '../../src/services/feed-service';
import { EventEmitter } from '../../src/lib/events';
import { TransactionManager } from '../../src/lib/transaction';

// Mocks
const mockFeedRepository = {
  getFeed: jest.fn(),
  getDiscoveryFeed: jest.fn(),
  addFeedItem: jest.fn()
};

const mockInterestRepository = {
  getUserInterests: jest.fn()
};

const mockSocialRepository = {
  getUserFollowing: jest.fn(),
  checkFollowExists: jest.fn()
};

const mockEventEmitter = {
  on: jest.fn(),
  emit: jest.fn()
};

const mockTransactionManager = {
  execute: jest.fn()
};

const mockCacheService = {
  get: jest.fn(),
  set: jest.fn()
};

describe('FeedService', () => {
  let feedService: FeedService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    feedService = new FeedService(
      mockFeedRepository as any,
      mockInterestRepository as any,
      mockSocialRepository as any,
      mockEventEmitter as unknown as EventEmitter,
      mockTransactionManager as unknown as TransactionManager,
      mockCacheService as any
    );
  });

  describe('getUserFeed()', () => {
    it('should return cached feed if available and bypassCache is false', async () => {
      // Setup
      const userId = 'user1';
      const options = { limit: 20 };
      const cachedFeed = {
        data: [{ id: 'item1' }],
        meta: { cursor: null, hasMore: false }
      };
      
      mockCacheService.get.mockResolvedValue(cachedFeed);
      
      // Execute
      const result = await feedService.getUserFeed(userId, options);
      
      // Verify
      expect(mockCacheService.get).toHaveBeenCalled();
      expect(result).toEqual(cachedFeed);
      expect(mockFeedRepository.getFeed).not.toHaveBeenCalled();
    });

    it('should fetch fresh feed if bypassCache is true', async () => {
      // Setup
      const userId = 'user1';
      const options = { limit: 20, bypassCache: true };
      const following = { following: [{ followedId: 'user2' }] };
      const interests = [{ interest: 'comedy' }];
      const feedItems = {
        data: [{ id: 'item1', userId: 'user2' }],
        meta: { cursor: null, hasMore: false }
      };
      
      mockSocialRepository.getUserFollowing.mockResolvedValue(following);
      mockInterestRepository.getUserInterests.mockResolvedValue(interests);
      mockFeedRepository.getFeed.mockResolvedValue(feedItems);
      mockSocialRepository.checkFollowExists.mockResolvedValue(true);
      
      // Execute
      const result = await feedService.getUserFeed(userId, options);
      
      // Verify
      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(mockSocialRepository.getUserFollowing).toHaveBeenCalledWith(userId);
      expect(mockInterestRepository.getUserInterests).toHaveBeenCalledWith(userId);
      expect(mockFeedRepository.getFeed).toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled(); // Should not cache when bypassCache is true
      expect(result.data[0]).toHaveProperty('relationship');
    });

    it('should enhance feed items with relationship data', async () => {
      // Setup
      const userId = 'user1';
      const options = { limit: 20 };
      const following = { following: [] };
      const interests = [];
      const feedItems = {
        data: [
          { id: 'item1', userId: 'user2' },
          { id: 'item2', userId: 'user1' } // Same as current user
        ],
        meta: { cursor: null, hasMore: false }
      };
      
      mockCacheService.get.mockResolvedValue(null);
      mockSocialRepository.getUserFollowing.mockResolvedValue(following);
      mockInterestRepository.getUserInterests.mockResolvedValue(interests);
      mockFeedRepository.getFeed.mockResolvedValue(feedItems);
      mockSocialRepository.checkFollowExists.mockResolvedValue(false);
      
      // Execute
      const result = await feedService.getUserFeed(userId, options);
      
      // Verify
      expect(result.data[0]).toHaveProperty('relationship');
      expect(result.data[0].relationship).toEqual({ isFollowing: false });
      // Item from the same user should not have a relationship property added
      expect(result.data[1]).not.toHaveProperty('relationship');
    });
  });

  describe('getDiscoveryFeed()', () => {
    it('should return cached discovery feed for anonymous users', async () => {
      // Setup
      const options = { limit: 20, type: 'all' };
      const cachedFeed = {
        data: [{ id: 'item1' }],
        meta: { cursor: null, hasMore: false }
      };
      
      mockCacheService.get.mockResolvedValue(cachedFeed);
      
      // Execute
      const result = await feedService.getDiscoveryFeed(options);
      
      // Verify
      expect(mockCacheService.get).toHaveBeenCalled();
      expect(result).toEqual(cachedFeed);
      expect(mockFeedRepository.getDiscoveryFeed).not.toHaveBeenCalled();
    });

    it('should fetch personalized discovery feed for authenticated users', async () => {
      // Setup
      const options = { 
        limit: 20, 
        type: 'content', 
        userId: 'user1',
        category: 'comedy'
      };
      const following = { following: [{ followedId: 'user2' }] };
      const interests = [{ interest: 'comedy' }];
      const feedItems = {
        data: [{ id: 'item1', userId: 'user2' }],
        meta: { cursor: null, hasMore: false }
      };
      
      mockSocialRepository.getUserFollowing.mockResolvedValue(following);
      mockInterestRepository.getUserInterests.mockResolvedValue(interests);
      mockFeedRepository.getDiscoveryFeed.mockResolvedValue(feedItems);
      mockSocialRepository.checkFollowExists.mockResolvedValue(true);
      
      // Execute
      const result = await feedService.getDiscoveryFeed(options);
      
      // Verify
      expect(mockCacheService.get).not.toHaveBeenCalled(); // Skip cache for authenticated users
      expect(mockSocialRepository.getUserFollowing).toHaveBeenCalledWith('user1');
      expect(mockInterestRepository.getUserInterests).toHaveBeenCalledWith('user1');
      expect(mockFeedRepository.getDiscoveryFeed).toHaveBeenCalledWith(expect.objectContaining({
        limit: 20,
        category: 'comedy',
        includeTypes: ['content'],
        userId: 'user1',
        following: ['user2'],
        interests: ['comedy']
      }));
      expect(result.data[0]).toHaveProperty('relationship');
      expect(mockCacheService.set).not.toHaveBeenCalled(); // Don't cache personalized feeds
    });

    it('should cache non-personalized discovery feeds', async () => {
      // Setup
      const options = { limit: 20, type: 'all' };
      const feedItems = {
        data: [{ id: 'item1', userId: 'user2' }],
        meta: { cursor: null, hasMore: false }
      };
      
      mockCacheService.get.mockResolvedValue(null);
      mockFeedRepository.getDiscoveryFeed.mockResolvedValue(feedItems);
      
      // Execute
      const result = await feedService.getDiscoveryFeed(options);
      
      // Verify
      expect(mockFeedRepository.getDiscoveryFeed).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled(); // Should cache non-personalized discovery feed
      expect(result.data).toEqual(feedItems.data);
    });
  });
});
