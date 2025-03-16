/**
 * Points Service Tests
 * 
 * Tests for the core points service functionality
 */
import { PointsService } from '../../../services/points/points-service';
import { PointsVerifier } from '../../../services/points/verification/points-verifier';
import { EventBus } from '../../../lib/event-bus';
import { ValidationError, InsufficientPointsError } from '../../../errors';

// Mock dependencies
const mockPointsRepository = {
  getUserPointsTotal: jest.fn(),
  getDailyPointsBySource: jest.fn(),
  getRecentPointsActivity: jest.fn(),
  addPointsTransaction: jest.fn(),
  deductPoints: jest.fn(),
  getUserPointsTransactions: jest.fn(),
  transferPointsBetweenUsers: jest.fn()
};

const mockEventBus = {
  publish: jest.fn()
} as unknown as EventBus;

const mockPointsVerifier = {
  verifyActivity: jest.fn()
} as unknown as PointsVerifier;

describe('PointsService', () => {
  let pointsService: PointsService;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create service with mocked dependencies
    pointsService = new PointsService(
      mockPointsRepository,
      mockEventBus,
      mockPointsVerifier
    );
  });
  
  describe('awardPoints', () => {
    it('should award points successfully', async () => {
      // Set up mocks
      mockPointsRepository.getDailyPointsBySource.mockResolvedValue(0);
      mockPointsRepository.getUserPointsTotal.mockResolvedValue(1050);
      mockPointsRepository.addPointsTransaction.mockResolvedValue({
        id: 'tx_123',
        user_id: 'user_123',
        amount: 50,
        source: 'content_creation',
        created_at: new Date()
      });
      mockPointsVerifier.verifyActivity.mockResolvedValue({
        isValid: true,
        confidenceScore: 0.9
      });
      
      // Call the service
      const result = await pointsService.awardPoints({
        userId: 'user_123',
        amount: 50,
        source: 'content_creation'
      });
      
      // Assert the result
      expect(result).toEqual({
        success: true,
        amount: 50,
        total: 1050
      });
      
      // Verify mocks were called correctly
      expect(mockPointsRepository.getDailyPointsBySource).toHaveBeenCalledWith(
        'user_123', 'content_creation'
      );
      expect(mockPointsRepository.addPointsTransaction).toHaveBeenCalledWith({
        userId: 'user_123',
        amount: 50,
        source: 'content_creation',
        referenceId: undefined,
        description: 'Created new content'
      });
      expect(mockEventBus.publish).toHaveBeenCalled();
    });
    
    it('should respect daily caps', async () => {
      // Set up mocks to simulate reaching daily cap
      mockPointsRepository.getDailyPointsBySource.mockResolvedValue(200); // Already at limit
      mockPointsRepository.getUserPointsTotal.mockResolvedValue(1000);
      
      // Call the service
      const result = await pointsService.awardPoints({
        userId: 'user_123',
        amount: 50,
        source: 'content_creation'
      });
      
      // Assert the result shows no points awarded
      expect(result).toEqual({
        success: false,
        amount: 0,
        total: 1000
      });
      
      // Verify no transaction was created
      expect(mockPointsRepository.addPointsTransaction).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
    
    it('should reject negative point amounts', async () => {
      // Call the service with invalid amount
      await expect(pointsService.awardPoints({
        userId: 'user_123',
        amount: -50,
        source: 'content_creation'
      })).rejects.toThrow(ValidationError);
      
      // Verify no further processing occurred
      expect(mockPointsRepository.getDailyPointsBySource).not.toHaveBeenCalled();
      expect(mockPointsRepository.addPointsTransaction).not.toHaveBeenCalled();
    });
    
    it('should reject activities that fail verification', async () => {
      // Set up mocks
      mockPointsRepository.getDailyPointsBySource.mockResolvedValue(0);
      mockPointsVerifier.verifyActivity.mockResolvedValue({
        isValid: false,
        confidenceScore: 0.9,
        reason: 'Content too short'
      });
      
      // Call the service
      const result = await pointsService.awardPoints({
        userId: 'user_123',
        amount: 50,
        source: 'content_creation'
      });
      
      // Assert the result shows no points awarded
      expect(result).toEqual({
        success: false,
        amount: 0,
        total: expect.any(Number)
      });
      
      // Verify verification was called but no transaction created
      expect(mockPointsVerifier.verifyActivity).toHaveBeenCalled();
      expect(mockPointsRepository.addPointsTransaction).not.toHaveBeenCalled();
    });
  });
  
  describe('deductPoints', () => {
    it('should deduct points successfully', async () => {
      // Set up mocks
      mockPointsRepository.getUserPointsTotal.mockResolvedValue(1000);
      mockPointsRepository.deductPoints.mockResolvedValue({
        id: 'tx_123',
        user_id: 'user_123',
        amount: -50,
        source: 'redemption',
        created_at: new Date()
      });
      
      // Call the service
      const result = await pointsService.deductPoints({
        userId: 'user_123',
        amount: 50,
        source: 'redemption'
      });
      
      // Assert the result
      expect(result).toEqual({
        success: true,
        amount: 50,
        total: 1000
      });
      
      // Verify mocks were called correctly
      expect(mockPointsRepository.getUserPointsTotal).toHaveBeenCalledWith('user_123');
      expect(mockPointsRepository.deductPoints).toHaveBeenCalledWith({
        userId: 'user_123',
        amount: 50,
        source: 'redemption',
        referenceId: undefined,
        description: 'Points deduction for redemption'
      });
    });
    
    it('should reject deduction if user has insufficient balance', async () => {
      // Set up mocks
      mockPointsRepository.getUserPointsTotal.mockResolvedValue(30); // Less than amount to deduct
      
      // Call the service with amount greater than balance
      await expect(pointsService.deductPoints({
        userId: 'user_123',
        amount: 50,
        source: 'redemption'
      })).rejects.toThrow(InsufficientPointsError);
      
      // Verify no deduction was attempted
      expect(mockPointsRepository.deductPoints).not.toHaveBeenCalled();
    });
    
    it('should emit event for redemption deductions', async () => {
      // Set up mocks
      mockPointsRepository.getUserPointsTotal.mockResolvedValue(1000);
      mockPointsRepository.deductPoints.mockResolvedValue({
        id: 'tx_123',
        user_id: 'user_123',
        amount: -50,
        source: 'redemption',
        created_at: new Date()
      });
      
      // Call the service
      await pointsService.deductPoints({
        userId: 'user_123',
        amount: 50,
        source: 'redemption',
        referenceId: 'redemption_123'
      });
      
      // Verify event was published
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'points.redeemed',
        expect.objectContaining({
          userId: 'user_123',
          amount: 50,
          referenceId: 'redemption_123'
        })
      );
    });
  });
  
  describe('getUserBalance', () => {
    it('should return user balance', async () => {
      // Set up mock
      mockPointsRepository.getUserPointsTotal.mockResolvedValue(1000);
      
      // Call the service
      const balance = await pointsService.getUserBalance('user_123');
      
      // Assert result
      expect(balance).toBe(1000);
      
      // Verify mock was called
      expect(mockPointsRepository.getUserPointsTotal).toHaveBeenCalledWith('user_123');
    });
  });
  
  describe('getUserTransactions', () => {
    it('should return user transactions with default pagination', async () => {
      // Set up mock
      const mockTransactions = [
        {
          id: 'tx_1',
          user_id: 'user_123',
          amount: 50,
          source: 'content_creation',
          created_at: new Date()
        },
        {
          id: 'tx_2',
          user_id: 'user_123',
          amount: 20,
          source: 'daily_login',
          created_at: new Date()
        }
      ];
      
      mockPointsRepository.getUserPointsTransactions.mockResolvedValue(mockTransactions);
      
      // Call the service
      const transactions = await pointsService.getUserTransactions('user_123');
      
      // Assert result
      expect(transactions).toEqual(mockTransactions);
      
      // Verify mock was called with default pagination
      expect(mockPointsRepository.getUserPointsTransactions).toHaveBeenCalledWith(
        'user_123', 20, 0
      );
    });
    
    it('should respect custom pagination parameters', async () => {
      // Set up mock
      mockPointsRepository.getUserPointsTransactions.mockResolvedValue([]);
      
      // Call the service
      await pointsService.getUserTransactions('user_123', 10, 20);
      
      // Verify mock was called with custom pagination
      expect(mockPointsRepository.getUserPointsTransactions).toHaveBeenCalledWith(
        'user_123', 10, 20
      );
    });
  });
});
