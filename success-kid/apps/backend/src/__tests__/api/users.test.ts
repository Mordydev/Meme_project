import { FastifyInstance } from 'fastify';
import { build } from '@/app';

describe('User API Endpoints', () => {
  let app: FastifyInstance;
  
  beforeAll(async () => {
    app = await build({
      logger: false
    });
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('GET /api/v1/users/me', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me'
      });
      
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toHaveProperty('errors');
    });
    
    it('should return user profile when authenticated', async () => {
      // Mock authentication
      const mockAuth = {
        userId: 'user123',
        isAuthenticated: true
      };
      
      // Mock user service to return a test user
      app.decorateRequest('user', mockAuth);
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: {
          Authorization: 'Bearer test-token'
        }
      });
      
      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.data).toHaveProperty('id', 'user123');
    });
  });
  
  describe('PUT /api/v1/users/me', () => {
    it('should update user profile', async () => {
      // Mock authentication
      const mockAuth = {
        userId: 'user123',
        isAuthenticated: true
      };
      
      // Mock user service
      app.decorateRequest('user', mockAuth);
      
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify({
          data: {
            display_name: 'Updated Name',
            bio: 'Updated bio'
          }
        })
      });
      
      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.data).toHaveProperty('display_name', 'Updated Name');
    });
  });
});