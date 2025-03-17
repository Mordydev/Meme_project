/**
 * Health Endpoint Integration Tests
 */
import { createTestEnvironment, TestEnvironment } from '../../testing';

describe('Health API Integration', () => {
  let env: TestEnvironment;
  
  beforeAll(async () => {
    // Create a test environment
    env = await createTestEnvironment({
      routes: ['health'],
    });
  });
  
  afterAll(async () => {
    // Clean up
    await env.teardown();
  });
  
  describe('GET /api/v1/health', () => {
    it('returns healthy status when dependencies are available', async () => {
      // Arrange - mock health checks
      
      // Act - make request to health endpoint
      const response = await env.app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('checks');
      expect(body.checks).toHaveProperty('postgres');
      expect(body.checks).toHaveProperty('redis');
    });
  });
  
  describe('GET /health/detail', () => {
    it('returns detailed health information when authenticated', async () => {
      // Arrange - create admin user for authentication
      const adminUser = await env.getTestUser('admin');
      const token = env.getAuthToken(adminUser);
      
      // Act - make authenticated request to detailed health endpoint
      const response = await env.app.inject({
        method: 'GET',
        url: '/health/detail',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('checks');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('uptime');
      
      // Check structure of detailed checks
      expect(body.checks).toHaveProperty('database');
      expect(body.checks).toHaveProperty('redis');
      expect(body.checks).toHaveProperty('memory');
      expect(body.checks).toHaveProperty('disk');
      expect(body.checks).toHaveProperty('cpu');
      
      // Database check should have detailed structure
      expect(body.checks.database).toHaveProperty('status');
      expect(body.checks.database).toHaveProperty('details');
    });
    
    it('returns 401 for unauthenticated requests to detailed health', async () => {
      // Act - make unauthenticated request to detailed health endpoint
      const response = await env.app.inject({
        method: 'GET',
        url: '/health/detail',
      });
      
      // Assert
      expect(response.statusCode).toBe(401);
    });
  });
});
