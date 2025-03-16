import { PointsService } from '../../services/points/points-service';
import { VerificationService } from '../../services/points/verification-service';
import { CapEnforcementService } from '../../services/points/cap-enforcement-service';
import { RedemptionService } from '../../services/points/redemption-service';
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { WalletConnectionRepository } from '../../repositories/wallet-connection-repository';
import { PointsSource } from '../../models/user-points';
import { eventBus } from '../../lib/event-bus';

// Mock the dependencies
jest.mock('../../lib/event-bus', () => ({
  eventBus: {
    publish: jest.fn().mockResolvedValue(undefined)
  },
  EventType: {
    POINTS_AWARDED: 'points.awarded',
    POINTS_REDEEMED: 'points.redeemed'
  }
}));

jest.mock('../../lib/db-client', () => ({
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
    lpush: jest.fn(),
    del: jest.fn()
  })
}));

describe('PointsService', () => {
  let pointsService: PointsService;
  let mockUserPointsRepo: jest.Mocked<UserPointsRepository>;
  let mockWalletRepo: jest.Mocked<WalletConnectionRepository>;
  
  beforeEach(() => {
    // Create mock repositories
    mockUserPointsRepo = {
      awardPoints: jest.fn(),
      getPointsEarnedTodayBySource: jest.fn(),
      getUserPointsBalance: jest.fn(),
      getUserPointsHistory: jest.fn(),
      getPointsRedeemedThisWeek: jest.fn(),
      getPointsBySource: jest.fn(),
      transferPoints: jest.fn(),
      getPointsLeaderboard: jest.fn()
    } as unknown as jest.Mocked<UserPointsRepository>;
    
    mockWalletRepo = {
      findByUserId: jest.fn(),
      findByAddress: jest.fn()
    } as unknown as jest.Mocked<WalletConnectionRepository>;
    
    // Create the service with mocked dependencies
    pointsService = new PointsService(mockUserPointsRepo, mockWalletRepo);
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  describe('awardPoints', () => {
    it('should award points successfully when all checks pass', async () => {
      // Arrange
      const userId = 'user123';
      const amount = 50;
      const source: PointsSource = 'content_creation';
      
      // Mock repository responses
      mockUserPointsRepo.getPointsEarnedTodayBySource.mockResolvedValue(0);
      mockUserPointsRepo.awardPoints.mockResolvedValue({
        id: 'tx123',
        user_id: userId,
        amount,
        source,
        reference_id: null,
        created_at: new Date(),
        description: null
      });
      mockUserPointsRepo.getUserPointsBalance.mockResolvedValue(150);
      
      // Act
      const result = await pointsService.awardPoints(userId, amount, source);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.amount).toBe(amount);
      expect(result.balance).toBe(150);
      expect(mockUserPointsRepo.awardPoints).toHaveBeenCalledWith(expect.objectContaining({
        user_id: userId,
        amount,
        source
      }));
      expect(eventBus.publish).toHaveBeenCalledWith(
        'points.awarded',
        expect.objectContaining({
          userId,
          amount,
          balance: 150
        })
      );
    });
    
    it('should reject negative point amounts', async () => {
      // Arrange
      const userId = 'user123';
      const amount = -50;
      const source: PointsSource = 'content_creation';
      
      // Act
      const result = await pointsService.awardPoints(userId, amount, source);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Points amount must be positive');
      expect(mockUserPointsRepo.awardPoints).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
    
    it('should enforce daily caps', async () => {
      // Arrange
      const userId = 'user123';
      const amount = 50;
      const source: PointsSource = 'content_creation';
      
      // Mock repository to show daily cap reached
      mockUserPointsRepo.getPointsEarnedTodayBySource.mockResolvedValue(200); // Assuming cap is 200
      
      // Act
      const result = await pointsService.awardPoints(userId, amount, source);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Daily cap exceeded');
      expect(mockUserPointsRepo.awardPoints).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
    
    it('should skip caps when skipCaps is true', async () => {
      // Arrange
      const userId = 'user123';
      const amount = 50;
      const source: PointsSource = 'content_creation';
      
      // Mock repository responses
      mockUserPointsRepo.getPointsEarnedTodayBySource.mockResolvedValue(200); // Over the cap
      mockUserPointsRepo.awardPoints.mockResolvedValue({
        id: 'tx123',
        user_id: userId,
        amount,
        source,
        reference_id: null,
        created_at: new Date(),
        description: null
      });
      mockUserPointsRepo.getUserPointsBalance.mockResolvedValue(150);
      
      // Act
      const result = await pointsService.awardPoints(userId, amount, source, { skipCaps: true });
      
      // Assert
      expect(result.success).toBe(true);
      expect(mockUserPointsRepo.awardPoints).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });
  
  describe('deductPoints', () => {
    it('should deduct points successfully when user has sufficient balance', async () => {
      // Arrange
      const userId = 'user123';
      const amount = 50;
      const source: PointsSource = 'redemption';
      
      // Mock repository responses
      mockUserPointsRepo.getUserPointsBalance.mockResolvedValue(150);
      mockUserPointsRepo.awardPoints.mockResolvedValue({
        id: 'tx123',
        user_id: userId,
        amount: -amount, // Negative for deduction
        source,
        reference_id: null,
        created_at: new Date(),
        description: null
      });
      mockUserPointsRepo.getUserPointsBalance.mockResolvedValueOnce(150).mockResolvedValueOnce(100);
      
      // Act
      const result = await pointsService.deductPoints(userId, amount, source);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.amount).toBe(amount);
      expect(result.balance).toBe(100);
      expect(mockUserPointsRepo.awardPoints).toHaveBeenCalledWith(expect.objectContaining({
        user_id: userId,
        amount: -amount, // Negative for deduction
        source
      }));
      expect(eventBus.publish).toHaveBeenCalledWith(
        'points.redeemed',
        expect.any(Object)
      );
    });
    
    it('should reject deduction when user has insufficient balance', async () => {
      // Arrange
      const userId = 'user123';
      const amount = 150;
      const source: PointsSource = 'redemption';
      
      // Mock repository to show insufficient balance
      mockUserPointsRepo.getUserPointsBalance.mockResolvedValue(100);
      
      // Act
      const result = await pointsService.deductPoints(userId, amount, source);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Insufficient points balance');
      expect(mockUserPointsRepo.awardPoints).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });
  
  describe('requestRedemption', () => {
    it('should call redemptionService requestRedemption method', async () => {
      // Arrange
      const userId = 'user123';
      const amount = 1000;
      const walletAddress = 'wallet123';
      
      // Set up the spy on the redemptionService
      const spy = jest.spyOn(RedemptionService.prototype, 'requestRedemption');
      spy.mockResolvedValue({
        success: true,
        redemptionId: 'red123',
        status: 'pending',
        pointsAmount: amount,
        tokenAmount: amount / 100,
        walletAddress,
        estimatedProcessingTime: '24 hours'
      });
      
      // Act
      await pointsService.requestRedemption(userId, amount, walletAddress);
      
      // Assert
      expect(spy).toHaveBeenCalledWith(userId, amount, walletAddress);
      
      // Clean up
      spy.mockRestore();
    });
  });
  
  describe('getRedemptionEligibility', () => {
    it('should call redemptionService getEligibility method', async () => {
      // Arrange
      const userId = 'user123';
      
      // Set up the spy on the redemptionService
      const spy = jest.spyOn(RedemptionService.prototype, 'getEligibility');
      spy.mockResolvedValue({
        isEligible: true,
        requirements: {
          minimumBalance: 1000,
          walletConnected: true,
          verificationComplete: true
        },
        limits: {
          conversionRate: 100,
          minimumAmount: 1000,
          weeklyLimit: 10000,
          weeklyUsed: 0,
          remaining: 10000,
          resetsAt: new Date().toISOString()
        },
        balance: {
          current: 2000,
          pending: 0
        }
      });
      
      // Act
      await pointsService.getRedemptionEligibility(userId);
      
      // Assert
      expect(spy).toHaveBeenCalledWith(userId);
      
      // Clean up
      spy.mockRestore();
    });
  });
  
  describe('getUserBalance', () => {
    it('should return user balance from repository', async () => {
      // Arrange
      const userId = 'user123';
      const expectedBalance = 1500;
      
      mockUserPointsRepo.getUserPointsBalance.mockResolvedValue(expectedBalance);
      
      // Act
      const balance = await pointsService.getUserBalance(userId);
      
      // Assert
      expect(balance).toBe(expectedBalance);
      expect(mockUserPointsRepo.getUserPointsBalance).toHaveBeenCalledWith(userId);
    });
  });
  
  describe('getUserHistory', () => {
    it('should return user history from repository', async () => {
      // Arrange
      const userId = 'user123';
      const options = { limit: 10, offset: 0 };
      const expectedHistory = [
        {
          id: 'tx1',
          user_id: userId,
          amount: 50,
          source: 'content_creation' as PointsSource,
          reference_id: null,
          created_at: new Date(),
          description: null
        }
      ];
      
      mockUserPointsRepo.getUserPointsHistory.mockResolvedValue(expectedHistory);
      
      // Act
      const history = await pointsService.getUserHistory(userId, options);
      
      // Assert
      expect(history).toBe(expectedHistory);
      expect(mockUserPointsRepo.getUserPointsHistory).toHaveBeenCalledWith(userId, options);
    });
  });
  
  describe('getDailyCapsStatus', () => {
    it('should call capEnforcementService getDailyCapsStatus method', async () => {
      // Arrange
      const userId = 'user123';
      
      // Set up the spy on the capEnforcementService
      const spy = jest.spyOn(CapEnforcementService.prototype, 'getDailyCapsStatus');
      const mockCaps = {
        content_creation: { used: 50, limit: 200, remaining: 150 },
        comment: { used: 30, limit: 150, remaining: 120 }
      } as Record<PointsSource, { used: number; limit: number; remaining: number }>;
      
      spy.mockResolvedValue(mockCaps);
      
      // Act
      const caps = await pointsService.getDailyCapsStatus(userId);
      
      // Assert
      expect(spy).toHaveBeenCalledWith(userId);
      expect(caps).toBe(mockCaps);
      
      // Clean up
      spy.mockRestore();
    });
  });
});
