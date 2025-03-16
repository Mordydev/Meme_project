/**
 * Points API Integration Tests
 * 
 * Tests the integration of points API endpoints with the points service
 */
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';
import { pointsService, redemptionService } from '../../services';

// Mock the points and redemption services
jest.mock('../../services/points', () => ({
  pointsService: {
    getUserBalance: jest.fn(),
    getUserTransactions: jest.fn(),
    getAllDailyCaps: jest.fn(),
    awardPoints: jest.fn()
  }
}));

jest.mock('../../services/points/redemption', () => ({
  redemptionService: {
    requestRedemption: jest.fn(),
    getUserRedemptions: jest.fn()
  }
}));

describe('Points API Integration', () => {
  let app: FastifyInstance;
  
  beforeAll(async () => {
    app = await buildApp({ logger: false });
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup request user mocking - this would normally be set by authentication middleware
    app.addHook('preHandler', (request, reply, done) => {
      request.user = { id: 'test-user-123', isAdmin: false };
      done();
    });
  });
  
  describe('GET /api/v1/points/balance', () => {
    it('should return user balance and transactions', async () => {
      // Mock service responses
      (pointsService.getUserBalance as jest.Mock).mockResolvedValue(1250);
      (pointsService.getUserTransactions as jest.Mock).mockResolvedValue([
        {
          id: 'tx_123',
          user_id: 'test-user-123',
          amount: 50,
          source: 'content_creation',
          reference_id: 'post_123',
          created_at: new Date(),
          description: 'Created a post'
        }
      ]);
      (pointsService.getAllDailyCaps as jest.Mock).mockResolvedValue(new Map([
        ['content_creation', {
          source: 'content_creation',
          limit: 200,
          current: 50,
          remaining: 150,
          resetsAt: new Date()
        }]
      ]));
      
      // Make request
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/points/balance'
      });
      
      // Check response
      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      
      // Verify expected data structure
      expect(json.data).toHaveProperty('balance', 1250);
      expect(json.data).toHaveProperty('transactions');
      expect(json.data.transactions).toHaveLength(1);
      expect(json.data).toHaveProperty('today');
      expect(json.data.today).toHaveProperty('earned');
      expect(json.data.today).toHaveProperty('limits');
      expect(json.data.today.limits).toHaveProperty('content_creation');
      
      // Verify service calls
      expect(pointsService.getUserBalance).toHaveBeenCalledWith('test-user-123');
      expect(pointsService.getUserTransactions).toHaveBeenCalledWith('test-user-123', 10);
      expect(pointsService.getAllDailyCaps).toHaveBeenCalledWith('test-user-123');
    });
  });
  
  describe('POST /api/v1/points/award', () => {
    it('should award points to user', async () => {
      // Mock service response
      (pointsService.awardPoints as jest.Mock).mockResolvedValue({
        success: true,
        amount: 50,
        total: 1300
      });
      
      // Make request
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/points/award',
        payload: {
          data: {
            amount: 50,
            source: 'content_creation',
            referenceId: 'post_123'
          }
        }
      });
      
      // Check response
      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      
      // Verify expected data structure
      expect(json.data).toHaveProperty('success', true);
      expect(json.data).toHaveProperty('amount', 50);
      expect(json.data).toHaveProperty('newBalance', 1300);
      
      // Verify service calls
      expect(pointsService.awardPoints).toHaveBeenCalledWith({
        userId: 'test-user-123',
        amount: 50,
        source: 'content_creation',
        referenceId: 'post_123',
        description: undefined
      });
    });
    
    it('should handle validation errors', async () => {
      // Make request with invalid amount
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/points/award',
        payload: {
          data: {
            amount: -50, // Invalid negative amount
            source: 'content_creation'
          }
        }
      });
      
      // Check response
      expect(response.statusCode).toBe(400);
      
      // Verify service was not called
      expect(pointsService.awardPoints).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/v1/points/redeem', () => {
    it('should create redemption request', async () => {
      // Mock service response
      (redemptionService.requestRedemption as jest.Mock).mockResolvedValue({
        id: 'redemption_123',
        userId: 'test-user-123',
        pointsAmount: 1000,
        tokenAmount: 10,
        walletAddress: 'sample_wallet_address',
        status: 'pending',
        createdAt: new Date()
      });
      
      // Make request
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/points/redeem',
        payload: {
          data: {
            amount: 1000,
            walletAddress: 'sample_wallet_address'
          }
        }
      });
      
      // Check response
      expect(response.statusCode).toBe(202);
      const json = JSON.parse(response.payload);
      
      // Verify expected data structure
      expect(json.data).toHaveProperty('success', true);
      expect(json.data).toHaveProperty('requestId', 'redemption_123');
      expect(json.data).toHaveProperty('pointsAmount', 1000);
      expect(json.data).toHaveProperty('tokenAmount', 10);
      expect(json.data).toHaveProperty('status', 'pending');
      expect(json.data).toHaveProperty('estimatedProcessingTime');
      
      // Verify service calls
      expect(redemptionService.requestRedemption).toHaveBeenCalledWith({
        userId: 'test-user-123',
        pointsAmount: 1000,
        walletAddress: 'sample_wallet_address'
      });
    });
  });
  
  describe('GET /api/v1/points/redemptions', () => {
    it('should return redemption history', async () => {
      // Mock service response
      (redemptionService.getUserRedemptions as jest.Mock).mockResolvedValue([
        {
          id: 'redemption_123',
          userId: 'test-user-123',
          pointsAmount: 1000,
          tokenAmount: 10,
          walletAddress: 'sample_wallet_address',
          status: 'completed',
          createdAt: new Date(),
          processedAt: new Date(),
          transactionHash: 'tx_hash_123'
        }
      ]);
      
      // Make request
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/points/redemptions'
      });
      
      // Check response
      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      
      // Verify expected data structure
      expect(json.data).toHaveLength(1);
      expect(json.data[0]).toHaveProperty('id', 'redemption_123');
      expect(json.data[0]).toHaveProperty('pointsAmount', 1000);
      expect(json.data[0]).toHaveProperty('tokenAmount', 10);
      expect(json.data[0]).toHaveProperty('status', 'completed');
      expect(json.data[0]).toHaveProperty('transactionHash', 'tx_hash_123');
      
      // Verify service calls
      expect(redemptionService.getUserRedemptions).toHaveBeenCalledWith('test-user-123', 20, 0);
    });
  });
});
