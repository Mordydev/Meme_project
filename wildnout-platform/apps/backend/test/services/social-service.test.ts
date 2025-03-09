import { SocialService, UserRelationship } from '../../src/services/social-service';
import { EventEmitter } from '../../src/lib/events';
import { TransactionManager } from '../../src/lib/transaction';
import { AppError } from '../../src/lib/errors';

// Mocks
const mockSocialRepository = {
  findUserReaction: jest.fn(),
  createReaction: jest.fn(),
  deleteReaction: jest.fn(),
  getReactionsForTarget: jest.fn(),
  getReactionCounts: jest.fn(),
  checkFollowExists: jest.fn(),
  createFollow: jest.fn(),
  deleteFollow: jest.fn(),
  getUserFollowers: jest.fn(),
  getUserFollowing: jest.fn(),
  getFollowCounts: jest.fn(),
  getSuggestedUsersByNetwork: jest.fn(),
  getPopularCreators: jest.fn()
};

const mockContentRepository = {
  findById: jest.fn(),
  updateReactionCount: jest.fn(),
  db: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn()
  }
};

const mockCommentRepository = {
  findById: jest.fn(),
  updateReactionCount: jest.fn()
};

const mockNotificationService = {
  createNotification: jest.fn()
};

const mockEventEmitter = {
  on: jest.fn(),
  emit: jest.fn()
};

const mockTransactionManager = {
  execute: jest.fn((fn) => fn())
};

describe('SocialService', () => {
  let socialService: SocialService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    socialService = new SocialService(
      mockSocialRepository as any,
      mockContentRepository as any,
      mockCommentRepository as any,
      mockNotificationService as any,
      mockEventEmitter as unknown as EventEmitter,
      mockTransactionManager as unknown as TransactionManager
    );
  });

  describe('createReaction()', () => {
    it('should create a new reaction if one does not exist', async () => {
      // Setup
      const userId = 'user1';
      const targetType = 'content';
      const targetId = 'content1';
      const reactionType = 'like';
      
      mockContentRepository.findById.mockResolvedValue({ id: targetId });
      mockSocialRepository.findUserReaction.mockResolvedValue(null);
      mockSocialRepository.createReaction.mockResolvedValue({
        id: 'reaction1',
        userId,
        targetType,
        targetId,
        type: reactionType,
        createdAt: new Date()
      });
      
      // Execute
      const result = await socialService.createReaction(userId, targetType, targetId, reactionType);
      
      // Verify
      expect(mockContentRepository.findById).toHaveBeenCalledWith(targetId);
      expect(mockSocialRepository.findUserReaction).toHaveBeenCalledWith(
        userId, targetType, targetId, expect.anything()
      );
      expect(mockSocialRepository.createReaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          targetType,
          targetId,
          type: reactionType
        }),
        expect.anything()
      );
      expect(mockContentRepository.updateReactionCount).toHaveBeenCalledWith(
        targetId, reactionType, true
      );
      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(result.id).toBe('reaction1');
    });

    it('should toggle off a reaction if the same type already exists', async () => {
      // Setup
      const userId = 'user1';
      const targetType = 'content';
      const targetId = 'content1';
      const reactionType = 'like';
      const existingReaction = {
        id: 'reaction1',
        userId,
        targetType,
        targetId,
        type: reactionType,
        createdAt: new Date()
      };
      
      mockContentRepository.findById.mockResolvedValue({ id: targetId });
      mockSocialRepository.findUserReaction.mockResolvedValue(existingReaction);
      
      // Execute
      const result = await socialService.createReaction(userId, targetType, targetId, reactionType);
      
      // Verify
      expect(mockSocialRepository.deleteReaction).toHaveBeenCalledWith(
        existingReaction.id, expect.anything()
      );
      expect(mockContentRepository.updateReactionCount).toHaveBeenCalledWith(
        targetId, reactionType, false
      );
      expect(result).toEqual(existingReaction);
    });

    it('should throw an error if target does not exist', async () => {
      // Setup
      mockContentRepository.findById.mockResolvedValue(null);
      
      // Execute & Verify
      await expect(socialService.createReaction(
        'user1', 'content', 'nonexistent', 'like'
      )).rejects.toThrow();
    });
  });

  describe('getUserRelationship()', () => {
    it('should return the relationship between two users', async () => {
      // Setup
      const userId = 'user1';
      const otherUserId = 'user2';
      
      mockSocialRepository.checkFollowExists
        .mockResolvedValueOnce(true)  // user1 follows user2
        .mockResolvedValueOnce(true); // user2 follows user1
      
      // Execute
      const result = await socialService.getUserRelationship(userId, otherUserId);
      
      // Verify
      expect(mockSocialRepository.checkFollowExists).toHaveBeenCalledTimes(2);
      expect(mockSocialRepository.checkFollowExists).toHaveBeenCalledWith(userId, otherUserId);
      expect(mockSocialRepository.checkFollowExists).toHaveBeenCalledWith(otherUserId, userId);
      
      expect(result).toEqual({
        isFollowing: true,
        isFollowedBy: true,
        mutualFollow: true
      });
    });

    it('should handle one-way following relationships', async () => {
      // Setup
      const userId = 'user1';
      const otherUserId = 'user2';
      
      mockSocialRepository.checkFollowExists
        .mockResolvedValueOnce(true)   // user1 follows user2
        .mockResolvedValueOnce(false); // user2 does not follow user1
      
      // Execute
      const result = await socialService.getUserRelationship(userId, otherUserId);
      
      // Verify
      expect(result).toEqual({
        isFollowing: true,
        isFollowedBy: false,
        mutualFollow: false
      });
    });
  });

  describe('getSuggestedFollows()', () => {
    it('should return suggested users based on network and popular creators', async () => {
      // Setup
      const userId = 'user1';
      const following = [{ followedId: 'user2' }, { followedId: 'user3' }];
      const excludeIds = ['user1', 'user2', 'user3'];
      const suggestedByNetwork = [
        { id: 'user4', username: 'user4', displayName: 'User 4' },
        { id: 'user5', username: 'user5', displayName: 'User 5' }
      ];
      const popularCreators = [
        { id: 'user6', username: 'user6', displayName: 'User 6' },
        { id: 'user7', username: 'user7', displayName: 'User 7' }
      ];
      
      mockSocialRepository.getUserFollowing.mockResolvedValue({ following });
      mockSocialRepository.getSuggestedUsersByNetwork.mockResolvedValue(suggestedByNetwork);
      mockSocialRepository.getPopularCreators.mockResolvedValue(popularCreators);
      
      // Execute
      const result = await socialService.getSuggestedFollows(userId);
      
      // Verify
      expect(mockSocialRepository.getUserFollowing).toHaveBeenCalledWith(userId);
      expect(mockSocialRepository.getSuggestedUsersByNetwork).toHaveBeenCalledWith(
        userId, excludeIds, expect.anything()
      );
      expect(mockSocialRepository.getPopularCreators).toHaveBeenCalledWith(
        excludeIds, expect.anything()
      );
      
      expect(result).toEqual([...suggestedByNetwork]);
    });

    it('should include popular creators when there are not enough network suggestions', async () => {
      // Setup
      const userId = 'user1';
      const following = [{ followedId: 'user2' }];
      const suggestedByNetwork = [{ id: 'user4', username: 'user4' }]; // Only one suggestion
      const popularCreators = [
        { id: 'user5', username: 'user5' },
        { id: 'user6', username: 'user6' }
      ];
      
      mockSocialRepository.getUserFollowing.mockResolvedValue({ following });
      mockSocialRepository.getSuggestedUsersByNetwork.mockResolvedValue(suggestedByNetwork);
      mockSocialRepository.getPopularCreators.mockResolvedValue(popularCreators);
      
      // Execute
      const result = await socialService.getSuggestedFollows(userId, 3);
      
      // Verify
      // Should include the network suggestion and 2 popular creators to make 3 total
      expect(result.length).toBe(3);
      expect(result).toContainEqual(suggestedByNetwork[0]);
      expect(result).toContainEqual(popularCreators[0]);
      expect(result).toContainEqual(popularCreators[1]);
    });
  });
});
