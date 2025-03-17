/**
 * Tests for Presence API
 */
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { presenceService, PresenceStatus } from '../presence';

describe('Presence API', () => {
  let app: FastifyInstance;
  let mockUser: any;
  
  // Mock authentication
  const mockAuthenticate = jest.fn().mockImplementation(async (request, reply) => {
    request.user = mockUser;
  });
  
  // Mock presence service
  jest.mock('../presence', () => ({
    presenceService: {
      updatePresence: jest.fn(),
      getUserPresence: jest.fn(),
      getUsersPresence: jest.fn(),
      subscribeToPresence: jest.fn(),
    },
    PresenceStatus: {
      ONLINE: 'online',
      AWAY: 'away',
      BUSY: 'busy',
      OFFLINE: 'offline',
    },
  }));
  
  beforeAll(async () => {
    app = await buildApp();
    app.decorate('authenticate', mockAuthenticate);
    await app.ready();
  });
  
  beforeEach(() => {
    mockUser = { id: 'user123', email: 'test@example.com' };
    jest.clearAllMocks();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('PUT /', () => {
    it('should update user presence', async () => {
      // Mock service function
      const mockPresence = {
        userId: 'user123',
        status: PresenceStatus.ONLINE,
        lastActive: new Date(),
        customStatus: 'Working on my project'
      };
      
      (presenceService.updatePresence as jest.Mock).mockResolvedValue(mockPresence);
      
      // Make request
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/presence',
        payload: {
          status: 'online',
          customStatus: 'Working on my project'
        }
      });
      
      // Check response
      expect(response.statusCode).toBe(200);
      
      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.userId).toBe('user123');
      expect(responseBody.data.status).toBe('online');
      expect(responseBody.data.customStatus).toBe('Working on my project');
      
      // Verify service was called
      expect(presenceService.updatePresence).toHaveBeenCalledWith(
        'user123',
        'online',
        expect.objectContaining({
          customStatus: 'Working on my project',
          source: 'api'
        })
      );
    });
    
    it('should handle service errors', async () => {
      // Mock service error
      (presenceService.updatePresence as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );
      
      // Make request
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/presence',
        payload: {
          status: 'online'
        }
      });
      
      // Check response
      expect(response.statusCode).toBe(500);
      
      const responseBody = JSON.parse(response.body);
      expect(responseBody.error).toBeDefined();
    });
  });
  
  describe('GET /', () => {
    it('should get current user presence', async () => {
      // Mock service function
      const mockPresence = {
        userId: 'user123',
        status: PresenceStatus.ONLINE,
        lastActive: new Date(),
        customStatus: 'Available'
      };
      
      (presenceService.getUserPresence as jest.Mock).mockResolvedValue(mockPresence);
      
      // Make request
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/presence'
      });
      
      // Check response
      expect(response.statusCode).toBe(200);
      
      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.userId).toBe('user123');
      expect(responseBody.data.status).toBe('online');
      
      // Verify service was called
      expect(presenceService.getUserPresence).toHaveBeenCalledWith('user123');
    });
    
    it('should return offline status if no presence data', async () => {
      // Mock no presence data
      (presenceService.getUserPresence as jest.Mock).mockResolvedValue(null);
      
      // Make request
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/presence'
      });
      
      // Check response
      expect(response.statusCode).toBe(200);
      
      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.userId).toBe('user123');
      expect(responseBody.data.status).toBe('offline');
    });
  });
  
  describe('GET /batch', () => {
    it('should get presence for multiple users', async () => {
      // Mock service function
      const mockPresenceMap = new Map([
        ['user123', {
          userId: 'user123',
          status: PresenceStatus.ONLINE,
          lastActive: new Date(),
          customStatus: 'Available'
        }],
        ['user456', {
          userId: 'user456',
          status: PresenceStatus.AWAY,
          lastActive: new Date(),
          customStatus: 'In a meeting'
        }]
      ]);
      
      (presenceService.getUsersPresence as jest.Mock).mockResolvedValue(mockPresenceMap);
      
      // Make request
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/presence/batch?userIds=user123&userIds=user456'
      });
      
      // Check response
      expect(response.statusCode).toBe(200);
      
      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.user123.status).toBe('online');
      expect(responseBody.data.user456.status).toBe('away');
      
      // Verify service was called
      expect(presenceService.getUsersPresence).toHaveBeenCalledWith(['user123', 'user456']);
    });
  });
  
  describe('POST /subscribe', () => {
    it('should subscribe to presence updates', async () => {
      // Make request
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/presence/subscribe',
        payload: {
          userIds: ['user456', 'user789']
        }
      });
      
      // Check response
      expect(response.statusCode).toBe(200);
      
      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.subscribed).toBe(true);
      expect(responseBody.data.userCount).toBe(2);
      
      // Verify service was called
      expect(presenceService.subscribeToPresence).toHaveBeenCalledWith('user123', ['user456', 'user789']);
    });
  });
});
