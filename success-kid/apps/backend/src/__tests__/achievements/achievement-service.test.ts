import { AchievementService } from '../../services/achievement/achievement-service';
import { AchievementRepository } from '../../repositories/achievement/achievement-repository';
import { EventBus } from '../../lib/event-bus';
import { PointsService } from '../../services/points/points-service';

// Mock dependencies
jest.mock('../../repositories/achievement/achievement-repository');
jest.mock('../../lib/event-bus');
jest.mock('../../services/points/points-service');

describe('AchievementService', () => {
  let achievementService: AchievementService;
  let mockAchievementRepository: jest.Mocked<AchievementRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockPointsService: jest.Mocked<PointsService>;

  beforeEach(() => {
    // Create mock instances
    mockAchievementRepository = new AchievementRepository(null) as jest.Mocked<AchievementRepository>;
    mockEventBus = new EventBus() as jest.Mocked<EventBus>;
    mockPointsService = {} as jest.Mocked<PointsService>;
    mockPointsService.awardPoints = jest.fn().mockResolvedValue({ success: true, amount: 100, total: 500 });

    // Create service with mocks
    achievementService = new AchievementService(
      mockAchievementRepository,
      mockPointsService,
      mockEventBus
    );

    // Setup common mock implementations
    mockAchievementRepository.findByEventType = jest.fn().mockResolvedValue([]);
    mockAchievementRepository.isAchievementUnlocked = jest.fn().mockResolvedValue(false);
    mockAchievementRepository.updateAchievementProgress = jest.fn().mockResolvedValue(undefined);
    mockAchievementRepository.unlockAchievement = jest.fn().mockResolvedValue({ 
      user_id: 'user123', 
      achievement_id: 'ach123', 
      unlocked_at: new Date(),
      progress: {},
      notified: false
    });
    mockEventBus.publish = jest.fn().mockResolvedValue(undefined);
    mockEventBus.subscribe = jest.fn();
  });

  describe('checkAchievementsForUser', () => {
    it('should not check achievements if none are found for the event type', async () => {
      // Arrange
      const userId = 'user123';
      const eventType = 'content.created';
      const eventData = { userId, contentId: 'content123' };
      mockAchievementRepository.findByEventType.mockResolvedValue([]);

      // Act
      const result = await achievementService.checkAchievementsForUser(userId, eventType, eventData);

      // Assert
      expect(result).toEqual([]);
      expect(mockAchievementRepository.findByEventType).toHaveBeenCalledWith(eventType);
      expect(mockAchievementRepository.isAchievementUnlocked).not.toHaveBeenCalled();
    });

    it('should skip achievements that are already unlocked', async () => {
      // Arrange
      const userId = 'user123';
      const eventType = 'content.created';
      const eventData = { userId, contentId: 'content123' };
      const mockAchievements = [
        { id: 'ach123', name: 'First Post', description: 'Create your first post', points_reward: 100 }
      ];
      mockAchievementRepository.findByEventType.mockResolvedValue(mockAchievements);
      mockAchievementRepository.isAchievementUnlocked.mockResolvedValue(true);

      // Act
      const result = await achievementService.checkAchievementsForUser(userId, eventType, eventData);

      // Assert
      expect(result).toEqual([]);
      expect(mockAchievementRepository.findByEventType).toHaveBeenCalledWith(eventType);
      expect(mockAchievementRepository.isAchievementUnlocked).toHaveBeenCalledWith(userId, 'ach123');
      expect(mockAchievementRepository.updateAchievementProgress).not.toHaveBeenCalled();
    });

    // Add more tests for checkAchievementsForUser
  });

  describe('unlockAchievement', () => {
    it('should unlock an achievement and award points', async () => {
      // Arrange
      const userId = 'user123';
      const achievement = { 
        id: 'ach123', 
        name: 'First Post', 
        description: 'Create your first post', 
        points_reward: 100,
        image_url: 'image.png',
        difficulty: 'common',
        category: 'content'
      };

      // Act
      // Use the private method through any to access it for testing
      await (achievementService as any).unlockAchievement(userId, achievement);

      // Assert
      expect(mockAchievementRepository.unlockAchievement).toHaveBeenCalledWith(userId, achievement.id);
      expect(mockPointsService.awardPoints).toHaveBeenCalledWith({
        userId,
        amount: achievement.points_reward,
        source: 'achievement',
        referenceId: achievement.id,
        description: `Achievement: ${achievement.name}`
      });
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    // Add more tests for unlockAchievement
  });

  // Add tests for other methods
});
