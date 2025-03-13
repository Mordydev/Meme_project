import { PointsService } from '@/services/points-service';

describe('PointsService', () => {
  let pointsService: any;
  let mockPointsRepository: any;
  let mockSecurityService: any;
  let mockEventBus: any;
  
  beforeEach(() => {
    // Setup mocks
    mockPointsRepository = {
      getUserPointsTotal: jest.fn(),
      getDailyPointsBySource: jest.fn(),
      getRecentPointsActivity: jest.fn(),
      addPointsTransaction: jest.fn()
    };
    
    mockSecurityService = {
      checkRateLimit: jest.fn(),
      checkForAnomalousActivity: jest.fn(),
      logSuspiciousActivity: jest.fn()
    };
    
    mockEventBus = {
      publish: jest.fn()
    };
    
    // Create service with mocked dependencies
    pointsService = new PointsService(
      mockPointsRepository,
      mockSecurityService,
      mockEventBus
    );
  });
  
  describe('awardPoints', () => {
    it('should award points when all validations pass', async () => {
      // Arrange
      const userId = 'user123';
      const amount = 50;
      const source = 'content_creation';
      
      mockSecurityService.checkRateLimit.mockResolvedValue(false);
      mockSecurityService.checkForAnomalousActivity.mockResolvedValue(false);
      mockPointsRepository.getDailyPointsBySource.mockResolvedValue(0);
      mockPointsRepository.addPointsTransaction.mockResolvedValue({
        id: 'tx123',
        userId,
        amount,
        source,
        created_at: new Date()
      });
      mockPointsRepository.getUserPointsTotal.mockResolvedValue(150);
      
      // Act
      const result = await pointsService.awardPoints(userId, amount, source);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.amount).toBe(amount);
      expect(result.total).toBe(150);
      expect(mockPointsRepository.addPointsTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          amount,
          source
        })
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'points.awarded',
        expect.objectContaining({
          userId,
          amount,
          source
        })
      );
    });

    it('should not award points when rate limit is reached', async () => {
      // Arrange
      const userId = 'user123';
      const amount = 50;
      const source = 'content_creation';
      
      mockSecurityService.checkRateLimit.mockResolvedValue(true); // Rate limit reached
      
      // Act
      const result = await pointsService.awardPoints(userId, amount, source);
      
      // Assert
      expect(result.success).toBe(false);
      expect(mockPointsRepository.addPointsTransaction).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});