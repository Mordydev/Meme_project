import { build } from '../../app';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock services
jest.mock('../../services', () => ({
  enhancedPointsService: {
    getUserBalance: jest.fn().mockResolvedValue(1500),
    getUserTransactions: jest.fn().mockResolvedValue({
      transactions: [
        { 
          id: 'tx1', 
          userId: 'user123', 
          amount: 50, 
          source: 'content_creation',
          createdAt: new Date().toISOString()
        }
      ],
      total: 1
    }),
    getAllDailyCaps: jest.fn().mockResolvedValue(new Map([
      ['content_creation', { current: 150, limit: 500 }]
    ]))
  },
  achievementService: {
    getAchievementSummaryForDashboard: jest.fn().mockResolvedValue({
      recentUnlocks: [
        { 
          id: 'ach1', 
          name: 'First Post', 
          pointsAwarded: 50, 
          unlockedAt: new Date().toISOString() 
        }
      ],
      topInProgress: [
        { 
          id: 'ach2', 
          name: 'Content Creator', 
          progressPercent: 75 
        }
      ]
    })
  },
  feedService: {
    getFeed: jest.fn().mockResolvedValue([
      {
        id: 'post1',
        type: 'post',
        userId: 'user123',
        userName: 'TestUser',
        contentText: 'This is a test post',
        createdAt: new Date().toISOString(),
        stats: {
          comments: 5,
          reactions: 10
        }
      }
    ])
  },
  marketService: {
    getCurrentStats: jest.fn().mockResolvedValue({
      price: 0.0001,
      priceChange24h: 5.2,
      volume24h: 150000,
      marketCap: 700000
    }),
    getMilestoneProgress: jest.fn().mockResolvedValue({
      progressPercentage: 70
    })
  },
  referralService: {
    getUserReferralStats: jest.fn().mockResolvedValue({
      referrals: {
        total: 10,
        pending: 3,
        completed: 5,
        converted: 2,
        rewarded: 0,
        conversionRate: 70
      }
    })
  },
  walletService: {
    getWalletInfo: jest.fn().mockResolvedValue({
      connected: true,
      address: '0x123'
    })
  }
}));

// Mock cache service
jest.mock('../../lib/cache', () => ({
  cacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('Dashboard API', () => {
  let app;
  
  beforeAll(async () => {
    app = await build();
    
    // Mock authentication middleware
    app.addHook('onRequest', (request, reply, done) => {
      request.user = {
        id: 'user123',
        email: 'test@example.com'
      };
      done();
    });
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('should return complete dashboard data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard'
    });
    
    expect(response.statusCode).toBe(200);
    
    const payload = JSON.parse(response.payload);
    
    // Check overall structure
    expect(payload).toHaveProperty('data');
    expect(payload).toHaveProperty('meta');
    
    // Check data sections
    expect(payload.data).toHaveProperty('points');
    expect(payload.data).toHaveProperty('achievements');
    expect(payload.data).toHaveProperty('activity');
    expect(payload.data).toHaveProperty('market');
    expect(payload.data).toHaveProperty('referral');
    
    // Check specific values
    expect(payload.data.points.currentBalance).toBe(1500);
    expect(payload.data.points.recentTransactions).toHaveLength(1);
    expect(payload.data.achievements.recentUnlocks).toHaveLength(1);
    expect(payload.data.achievements.topInProgress).toHaveLength(1);
    expect(payload.data.activity.recentItems).toHaveLength(1);
    expect(payload.data.market.currentPrice).toBe(0.0001);
    expect(payload.data.market.nextMilestoneProgress).toBe(70);
    expect(payload.data.referral.successfulReferrals).toBe(7); // 5 completed + 2 converted
    
    // Check meta
    expect(payload.meta.fromCache).toBe(false);
    expect(payload.meta).toHaveProperty('timestamp');
    expect(payload.meta).toHaveProperty('duration');
    expect(payload.meta.services).toEqual({
      points: 'fulfilled',
      achievements: 'fulfilled',
      activity: 'fulfilled',
      market: 'fulfilled',
      referral: 'fulfilled',
      wallet: 'fulfilled'
    });
  });
  
  it('should handle service failures gracefully', async () => {
    // Mock one service to fail
    jest.requireMock('../../services').achievementService.getAchievementSummaryForDashboard
      .mockRejectedValueOnce(new Error('Service unavailable'));
    
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard'
    });
    
    expect(response.statusCode).toBe(200);
    
    const payload = JSON.parse(response.payload);
    
    // Should still return data with default values for the failed service
    expect(payload.data.achievements.recentUnlocks).toEqual([]);
    expect(payload.data.achievements.topInProgress).toEqual([]);
    
    // Other services should still work
    expect(payload.data.points.currentBalance).toBe(1500);
    
    // Check meta shows failure
    expect(payload.meta.services.achievements).toBe('rejected');
  });
  
  it('should reject unauthorized requests', async () => {
    // Override the auth hook just for this test
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard',
      onRequest: (request, reply, done) => {
        request.user = null; // No user
        done();
      }
    });
    
    expect(response.statusCode).toBe(401);
  });
});
