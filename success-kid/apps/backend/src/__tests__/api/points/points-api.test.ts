/**
 * Points API Integration Tests
 * 
 * Tests for the Points API endpoints.
 */
import { FastifyInstance } from 'fastify';
import { createTestEnvironment, TestEnvironment } from '@/testing/helpers/test-environment';
import { User } from '@/testing/factories/user';
import { PointsTransaction } from '@/testing/factories/points';

describe('Points API', () => {
  let app: FastifyInstance;
  let testEnv: TestEnvironment;
  let testUser: User;
  let authToken: string;
  
  // Setup before all tests
  beforeAll(async () => {
    // Create test environment
    testEnv = await createTestEnvironment({
      enableLogging: false,
      mockAuth: false,
      mockDatabase: false,
      seedTestData: true
    });
    
    // Get app instance
    app = testEnv.getApp();
    
    // Get test user
    testUser = await testEnv.getTestUser('user');
    authToken = testEnv.getAuthToken(testUser);
  });
  
  // Cleanup after all tests
  afterAll(async () => {
    await testEnv.teardown();
  });
  
  // Reset between tests
  beforeEach(async () => {
    await testEnv.reset();
  });
  
  describe('POST /api/v1/points/award', () => {
    it('should award points to a user', async () => {
      // Arrange
      const payload = {
        data: {
          userId: testUser.id,
          amount: 50,
          source: 'test'
        }
      };
      
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/points/award',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.data.success).toBe(true);
      expect(result.data.amount).toBe(payload.data.amount);
      
      // Verify database state
      const client = await testEnv.getDatabaseConnection();
      try {
        const dbResult = await client.query(
          'SELECT * FROM user_points WHERE user_id = $1',
          [testUser.id]
        );
        expect(dbResult.rows.length).toBeGreaterThan(0);
        expect(dbResult.rows.some(row => row.amount === payload.data.amount)).toBe(true);
      } finally {
        client.release();
      }
    });
    
    it('should return 400 when amount is negative', async () => {
      // Arrange
      const payload = {
        data: {
          userId: testUser.id,
          amount: -50,
          source: 'test'
        }
      };
      
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/points/award',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload
      });
      
      // Assert
      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].code).toBe('VALIDATION_ERROR');
    });
    
    it('should return 401 when not authenticated', async () => {
      // Arrange
      const payload = {
        data: {
          userId: testUser.id,
          amount: 50,
          source: 'test'
        }
      };
      
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/points/award',
        payload
      });
      
      // Assert
      expect(response.statusCode).toBe(401);
    });
  });
  
  describe('GET /api/v1/points/balance/:userId', () => {
    it('should return user points balance', async () => {
      // Arrange - Add some points first
      const awardPayload = {
        data: {
          userId: testUser.id,
          amount: 50,
          source: 'test'
        }
      };
      
      await app.inject({
        method: 'POST',
        url: '/api/v1/points/award',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: awardPayload
      });
      
      // Act
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/points/balance/${testUser.id}`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.data.balance).toBeGreaterThanOrEqual(50);
      expect(result.data.userId).toBe(testUser.id);
    });
    
    it('should return 404 for non-existent user', async () => {
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/points/balance/non-existent-user',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      // Assert
      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].code).toBe('RESOURCE_NOT_FOUND');
    });
  });
  
  describe('GET /api/v1/points/history/:userId', () => {
    it('should return user points history', async () => {
      // Arrange - Add some points first
      const awardPayload = {
        data: {
          userId: testUser.id,
          amount: 50,
          source: 'test'
        }
      };
      
      await app.inject({
        method: 'POST',
        url: '/api/v1/points/award',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: awardPayload
      });
      
      // Act
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/points/history/${testUser.id}`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(Array.isArray(result.data.transactions)).toBe(true);
      expect(result.data.transactions.length).toBeGreaterThan(0);
      
      // Check if first transaction matches what we added
      const firstTransaction = result.data.transactions[0];
      expect(firstTransaction.userId).toBe(testUser.id);
      expect(firstTransaction.amount).toBe(50);
      expect(firstTransaction.source).toBe('test');
    });
  });
  
  // Add more test cases for other endpoints...
});
