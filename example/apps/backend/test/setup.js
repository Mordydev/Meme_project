// Set environment variables for testing
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.SUPABASE_URL = 'https://test-supabase-url.com'
process.env.SUPABASE_KEY = 'test-supabase-key'

// Global Jest timeout
jest.setTimeout(10000)

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      publish: jest.fn().mockResolvedValue(1),
      subscribe: jest.fn().mockResolvedValue(),
      on: jest.fn(),
      connect: jest.fn(),
      quit: jest.fn(),
    }
  })
})

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }
})

// Silence the logger during tests
jest.mock('pino', () => {
  return {
    pino: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis(),
    }),
  }
})

// Cleanup after tests
afterAll(() => {
  jest.clearAllMocks()
})
