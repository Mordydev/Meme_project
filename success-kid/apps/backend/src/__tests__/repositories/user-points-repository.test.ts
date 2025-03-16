/**
 * User Points Repository Tests
 * 
 * Tests for the user points repository implementation
 */
import { Pool } from 'pg';
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { CreateUserPointsDto } from '../../models/user-points';

// Mock the pg client
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn()
    })
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('UserPointsRepository', () => {
  let repository: UserPointsRepository;
  let mockPool: Pool;
  
  beforeEach(() => {
    // Create a new mock pool for each test
    mockPool = new Pool();
    repository = new UserPointsRepository(mockPool);
    
    // Reset mock call history
    jest.clearAllMocks();
  });
  
  describe('awardPoints', () => {
    it('should insert a new points transaction', async () => {
      // Setup mock return value
      const mockPointsData = {
        id: 'pts123',
        user_id: 'user123',
        amount: 50,
        source: 'content_creation',
        reference_id: 'content123',
        created_at: new Date().toISOString(),
        description: 'Created a new post'
      };
      
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPointsData]
      });
      
      // Input data for test
      const input: CreateUserPointsDto = {
        user_id: 'user123',
        amount: 50,
        source: 'content_creation',
        reference_id: 'content123',
        description: 'Created a new post'
      };
      
      // Execute method under test
      const result = await repository.awardPoints(input);
      
      // Verify query was called with correct parameters
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_points'),
        expect.arrayContaining([
          'user123',
          50,
          'content_creation',
          'content123',
          'Created a new post'
        ])
      );
      
      // Verify the result
      expect(result).toEqual(mockPointsData);
    });
    
    it('should throw error when amount is zero', async () => {
      // Input data with invalid amount
      const input: CreateUserPointsDto = {
        user_id: 'user123',
        amount: 0, // Invalid amount
        source: 'content_creation'
      };
      
      // Execute method and expect it to throw
      await expect(repository.awardPoints(input))
        .rejects
        .toThrow('Points amount cannot be zero');
      
      // Verify query was not called
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserPointsBalance', () => {
    it('should return the total points balance', async () => {
      // Setup mock return value
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ balance: '500' }]
      });
      
      // Execute method under test
      const result = await repository.getUserPointsBalance('user123');
      
      // Verify query was called with correct parameters
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COALESCE(SUM(amount), 0) as balance'),
        ['user123']
      );
      
      // Verify the result
      expect(result).toBe(500);
    });
    
    it('should return 0 when user has no points', async () => {
      // Setup mock return value for no points
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ balance: '0' }]
      });
      
      // Execute method under test
      const result = await repository.getUserPointsBalance('user123');
      
      // Verify the result
      expect(result).toBe(0);
    });
  });
  
  describe('getPointsEarnedTodayBySource', () => {
    it('should return points earned today for a specific source', async () => {
      // Setup mock return value
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '150' }]
      });
      
      // Execute method under test
      const result = await repository.getPointsEarnedTodayBySource('user123', 'content_creation');
      
      // Verify query was called with correct parameters
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("DATE_TRUNC('day', NOW())"),
        ['user123', 'content_creation']
      );
      
      // Verify the result
      expect(result).toBe(150);
    });
  });
  
  describe('getPointsRedeemedThisWeek', () => {
    it('should return points redeemed this week', async () => {
      // Setup mock return value
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '2000' }]
      });
      
      // Execute method under test
      const result = await repository.getPointsRedeemedThisWeek('user123');
      
      // Verify query was called with correct parameters
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("DATE_TRUNC('week', NOW())"),
        ['user123']
      );
      
      // Verify the result
      expect(result).toBe(2000);
    });
  });
  
  // Tests for other methods omitted for brevity
});
