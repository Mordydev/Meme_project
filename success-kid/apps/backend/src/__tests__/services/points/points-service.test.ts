/**
 * Points Service Unit Tests
 * 
 * Tests for the PointsService class functionality.
 */
import { jest } from '@jest/globals';
import { PointsService } from '@/services/points';
import { createMockedRepositories, createMockEventEmitter } from '@/testing/helpers/mocks';
import { PointsTransaction } from '@/testing/factories/points';

// Mock dependencies
jest.mock('@/repositories/points-repository');
jest.mock('@/repositories/user-repository');

describe('PointsService', () => {
  // Test dependencies
  let pointsService: PointsService;
  let mockPointsRepo: any;
  let mockUserRepo: any;
  let mockEventEmitter: any;
  
  // Setup before each test
  beforeEach(() => {
    // Create mock repositories
    const mocks = createMockedRepositories();
    mockPointsRepo = mocks.pointsRepository;
    mockUserRepo = mocks.userRepository;
    
    // Create mock event emitter
    mockEventEmitter = createMockEventEmitter();
    
    // Create service with mock dependencies
    pointsService = new PointsService(
      mockPointsRepo,
      mockUserRepo,
      mockEventEmitter
    );
  });
  
  // Reset mocks after each test
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('awardPoints', () => {
    it('should award points when within daily limit', async () => {
      // Arrange
      const userId = 'user-123';
      const amount = 50;
      const source = 'content_creation';
      
      mockUserRepo.findById.mockResolvedValue({ id: userId, status: 'active' });
      mockPointsRepo.getDailyPointsBySource.mockResolvedValue(0);
      mockPointsRepo.addPointsTransaction.mockResolvedValue({
        id: 'tx-123',
        userId,
        amount,
        source,
        created_at: new Date()
      });
      mockPointsRepo.getUserPointsTotal.mockResolvedValue(150);
      
      // Act
      const result = await pointsService.awardPoints(userId, amount, source);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.amount).toBe(amount);
      expect(result.newTotal).toBe(150);
      expect(mockPointsRepo.addPointsTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          amount,
          source
        })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'points.awarded',
        expect.objectContaining({
          userId,
          amount,
          source
        })
      );
    });
    
    it('should reject points when exceeding daily limit', async () => {
      // Arrange
      const userId = 'user-123';
      const amount = 50;
      const source = 'content_creation';
      const dailyLimit = 100;
      const currentTotal = 90;
      
      mockUserRepo.findById.mockResolvedValue({ id: userId, status: 'active' });
      mockPointsRepo.getDailyPointsBySource.mockResolvedValue(currentTotal);
      
      // Set expected limits in service config
      jest.spyOn(pointsService as any, 'getSourceLimit').mockReturnValue(dailyLimit);
      
      // Act & Assert
      await expect(
        pointsService.awardPoints(userId, amount, source)
      ).rejects.toThrow('Daily limit exceeded');
      
      expect(mockPointsRepo.addPointsTransaction).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
    
    it('should reject points for suspended users', async () => {
      // Arrange
      const userId = 'user-123';
      const amount = 50;
      const source = 'content_creation';
      
      mockUserRepo.findById.mockResolvedValue({ id: userId, status: 'suspended' });
      
      // Act & Assert
      await expect(
        pointsService.awardPoints(userId, amount, source)
      ).rejects.toThrow('User is suspended');
      
      expect(mockPointsRepo.getDailyPointsBySource).not.toHaveBeenCalled();
      expect(mockPointsRepo.addPointsTransaction).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
    
    it('should reject negative point amounts', async () => {
      // Arrange
      const userId = 'user-123';
      const amount = -50;
      const source = 'content_creation';
      
      // Act & Assert
      await expect(
        pointsService.awardPoints(userId, amount, source)
      ).rejects.toThrow('Point amount must be positive');
      
      expect(mockUserRepo.findById).not.toHaveBeenCalled();
      expect(mockPointsRepo.getDailyPointsBySource).not.toHaveBeenCalled();
      expect(mockPointsRepo.addPointsTransaction).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserPointsHistory', () => {
    it('should return user points history', async () => {
      // Arrange
      const userId = 'user-123';
      const transactions: Partial<PointsTransaction>[] = [
        { id: 'tx-1', userId, amount: 50, source: 'content_creation', createdAt: new Date() },
        { id: 'tx-2', userId, amount: 25, source: 'comment', createdAt: new Date() }
      ];
      
      mockUserRepo.findById.mockResolvedValue({ id: userId, status: 'active' });
      mockPointsRepo.getUserTransactions.mockResolvedValue(transactions);
      
      // Act
      const result = await pointsService.getUserPointsHistory(userId);
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('tx-1');
      expect(result[1].id).toBe('tx-2');
      expect(mockPointsRepo.getUserTransactions).toHaveBeenCalledWith(
        userId,
        expect.any(Object) // Options parameter
      );
    });
    
    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 'user-123';
      
      mockUserRepo.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(
        pointsService.getUserPointsHistory(userId)
      ).rejects.toThrow('User not found');
      
      expect(mockPointsRepo.getUserTransactions).not.toHaveBeenCalled();
    });
  });
  
  // Add more test cases for other methods...
});
