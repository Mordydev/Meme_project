import { LeaderboardService } from '../../../src/services/leaderboard-service';
import { LeaderboardCategory, LeaderboardPeriod } from '../../../src/models/leaderboard';

const mockLeaderboardRepository = {
  getLeaderboard: jest.fn(),
  getUserLeaderboardRank: jest.fn(),
};

const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
};

describe('LeaderboardService', () => {
  let leaderboardService: LeaderboardService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    leaderboardService = new LeaderboardService(mockLeaderboardRepository, mockCacheService);
  });
  
  describe('getLeaderboard', () => {
    it('should return cached leaderboard if available', async () => {
      // Mock data
      const category = LeaderboardCategory.POINTS;
      const options = {
        period: LeaderboardPeriod.WEEKLY,
        limit: 10,
        offset: 0,
      };
      
      const cachedLeaderboard = {
        entries: [
          {
            userId: 'user123',
            username: 'testuser',
            displayName: 'Test User',
            avatarUrl: 'https://example.com/avatar.jpg',
            score: 500,
            rank: 1,
          },
        ],
        total: 1,
        period: LeaderboardPeriod.WEEKLY,
        category: LeaderboardCategory.POINTS,
      };
      
      // Mock cache hit
      mockCacheService.get.mockResolvedValue(cachedLeaderboard);
      
      // Call the service method
      const result = await leaderboardService.getLeaderboard(category, options);
      
      // Assertions
      expect(mockCacheService.get).toHaveBeenCalledWith(expect.stringContaining('leaderboard:points:weekly'));
      expect(mockLeaderboardRepository.getLeaderboard).not.toHaveBeenCalled();
      expect(result).toEqual(cachedLeaderboard);
    });
    
    it('should fetch and cache leaderboard if not cached', async () => {
      // Mock data
      const category = LeaderboardCategory.POINTS;
      const options = {
        period: LeaderboardPeriod.WEEKLY,
        limit: 10,
        offset: 0,
      };
      
      const leaderboardData = {
        entries: [
          {
            userId: 'user123',
            username: 'testuser',
            displayName: 'Test User',
            avatarUrl: 'https://example.com/avatar.jpg',
            score: 500,
            rank: 1,
          },
        ],
        total: 1,
        period: LeaderboardPeriod.WEEKLY,
        category: LeaderboardCategory.POINTS,
      };
      
      // Mock cache miss
      mockCacheService.get.mockResolvedValue(null);
      
      // Mock repository response
      mockLeaderboardRepository.getLeaderboard.mockResolvedValue(leaderboardData);
      
      // Call the service method
      const result = await leaderboardService.getLeaderboard(category, options);
      
      // Assertions
      expect(mockCacheService.get).toHaveBeenCalledWith(expect.stringContaining('leaderboard:points:weekly'));
      expect(mockLeaderboardRepository.getLeaderboard).toHaveBeenCalledWith(category, options);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('leaderboard:points:weekly'),
        leaderboardData,
        expect.any(Number)
      );
      expect(result).toEqual(leaderboardData);
    });
    
    it('should include user rank if userId is provided', async () => {
      // Mock data
      const category = LeaderboardCategory.POINTS;
      const options = {
        period: LeaderboardPeriod.WEEKLY,
        limit: 10,
        offset: 0,
        userId: 'user123',
      };
      
      const leaderboardData = {
        entries: [
          {
            userId: 'user123',
            username: 'testuser',
            displayName: 'Test User',
            avatarUrl: 'https://example.com/avatar.jpg',
            score: 500,
            rank: 1,
          },
        ],
        total: 1,
        period: LeaderboardPeriod.WEEKLY,
        category: LeaderboardCategory.POINTS,
      };
      
      // Mock cache miss
      mockCacheService.get.mockResolvedValue(null);
      
      // Mock repository responses
      mockLeaderboardRepository.getLeaderboard.mockResolvedValue(leaderboardData);
      mockLeaderboardRepository.getUserLeaderboardRank.mockResolvedValue({
        rank: 1,
        score: 500,
      });
      
      // Call the service method
      const result = await leaderboardService.getLeaderboard(category, options);
      
      // Assertions
      expect(mockLeaderboardRepository.getLeaderboard).toHaveBeenCalledWith(category, options);
      expect(result).toEqual({
        ...leaderboardData,
        userRank: {
          rank: 1,
          score: 500,
        },
      });
    });
  });
  
  describe('getUserRank', () => {
    it('should return cached user rank if available', async () => {
      // Mock data
      const userId = 'user123';
      const category = LeaderboardCategory.POINTS;
      const period = LeaderboardPeriod.WEEKLY;
      
      const cachedRank = {
        rank: 1,
        score: 500,
      };
      
      // Mock cache hit
      mockCacheService.get.mockResolvedValue(cachedRank);
      
      // Call the service method
      const result = await leaderboardService.getUserRank(userId, category, period);
      
      // Assertions
      expect(mockCacheService.get).toHaveBeenCalledWith(expect.stringContaining('leaderboard:points:weekly:user:user123'));
      expect(mockLeaderboardRepository.getUserLeaderboardRank).not.toHaveBeenCalled();
      expect(result).toEqual(cachedRank);
    });
    
    it('should fetch and cache user rank if not cached', async () => {
      // Mock data
      const userId = 'user123';
      const category = LeaderboardCategory.POINTS;
      const period = LeaderboardPeriod.WEEKLY;
      
      const userRank = {
        rank: 1,
        score: 500,
      };
      
      // Mock cache miss
      mockCacheService.get.mockResolvedValue(null);
      
      // Mock repository response
      mockLeaderboardRepository.getUserLeaderboardRank.mockResolvedValue(userRank);
      
      // Call the service method
      const result = await leaderboardService.getUserRank(userId, category, period);
      
      // Assertions
      expect(mockCacheService.get).toHaveBeenCalledWith(expect.stringContaining('leaderboard:points:weekly:user:user123'));
      expect(mockLeaderboardRepository.getUserLeaderboardRank).toHaveBeenCalledWith(
        userId,
        category,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('leaderboard:points:weekly:user:user123'),
        userRank,
        expect.any(Number)
      );
      expect(result).toEqual(userRank);
    });
    
    it('should handle undefined rank', async () => {
      // Mock data
      const userId = 'user123';
      const category = LeaderboardCategory.POINTS;
      const period = LeaderboardPeriod.WEEKLY;
      
      // Mock cache miss
      mockCacheService.get.mockResolvedValue(null);
      
      // Mock repository response - no rank found
      mockLeaderboardRepository.getUserLeaderboardRank.mockResolvedValue(undefined);
      
      // Call the service method
      const result = await leaderboardService.getUserRank(userId, category, period);
      
      // Assertions
      expect(result).toBeUndefined();
      expect(mockCacheService.set).not.toHaveBeenCalled(); // should not cache undefined
    });
  });
});
