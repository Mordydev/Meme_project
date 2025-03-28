// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-secret';
process.env.CLERK_SECRET_KEY = 'test-clerk-secret';

// Mock external services
jest.mock('@/lib/db-client', () => ({
  getPgPool: jest.fn(() => ({
    query: jest.fn(),
    connect: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn(),
    })),
  })),
  getRedisClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});