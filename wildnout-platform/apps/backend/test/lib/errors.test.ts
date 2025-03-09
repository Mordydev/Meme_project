import { 
  AppError, 
  ValidationError, 
  AuthError, 
  ForbiddenError, 
  NotFoundError, 
  ConflictError, 
  RateLimitError, 
  DependencyError,
  errorHandler
} from '../../src/lib/errors';

describe('Error Handling Framework', () => {
  describe('Error Classes', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('test_error', 'Test error message', 400, { field: 'value' });
      
      expect(error.code).toBe('test_error');
      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'value' });
      expect(error.name).toBe('AppError');
    });
    
    it('should create ValidationError correctly', () => {
      const error = new ValidationError('Invalid input', { field: 'value' });
      
      expect(error.code).toBe('validation_error');
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'value' });
    });
    
    it('should create AuthError correctly', () => {
      const error = new AuthError('Unauthorized');
      
      expect(error.code).toBe('auth_error');
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
    });
    
    it('should create ForbiddenError correctly', () => {
      const error = new ForbiddenError('Access denied');
      
      expect(error.code).toBe('forbidden');
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
    });
    
    it('should create NotFoundError correctly with ID', () => {
      const error = new NotFoundError('user', '123');
      
      expect(error.code).toBe('not_found');
      expect(error.message).toBe('user with ID 123 not found');
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ resource: 'user', id: '123' });
    });
    
    it('should create NotFoundError correctly without ID', () => {
      const error = new NotFoundError('configuration');
      
      expect(error.code).toBe('not_found');
      expect(error.message).toBe('configuration not found');
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ resource: 'configuration', id: undefined });
    });
    
    it('should create ConflictError correctly', () => {
      const error = new ConflictError('Username already exists');
      
      expect(error.code).toBe('conflict');
      expect(error.message).toBe('Username already exists');
      expect(error.statusCode).toBe(409);
    });
    
    it('should create RateLimitError correctly', () => {
      const error = new RateLimitError('Too many requests');
      
      expect(error.code).toBe('rate_limit_exceeded');
      expect(error.message).toBe('Too many requests');
      expect(error.statusCode).toBe(429);
    });
    
    it('should create DependencyError correctly', () => {
      const error = new DependencyError('Database', 'Connection failed');
      
      expect(error.code).toBe('dependency_error');
      expect(error.message).toBe('Database: Connection failed');
      expect(error.statusCode).toBe(502);
    });
  });
  
  describe('Error Handler', () => {
    let mockRequest;
    let mockReply;
    
    beforeEach(() => {
      mockRequest = {
        id: 'req-123',
        log: {
          error: jest.fn()
        }
      };
      
      mockReply = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-01T00:00:00.000Z');
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('should handle AppError correctly', () => {
      const error = new ValidationError('Invalid input', { field: 'value' });
      
      errorHandler(error, mockRequest, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: {
          code: 'validation_error',
          message: 'Invalid input',
          details: { field: 'value' }
        },
        meta: {
          requestId: 'req-123',
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      });
    });
    
    it('should handle validation errors', () => {
      const error = {
        validation: [{ field: 'username', message: 'is required' }]
      };
      
      errorHandler(error, mockRequest, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: {
          code: 'validation_error',
          message: 'Validation error',
          details: [{ field: 'username', message: 'is required' }]
        },
        meta: {
          requestId: 'req-123',
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      });
    });
    
    it('should handle unknown errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Unexpected error');
      
      errorHandler(error, mockRequest, mockReply);
      
      expect(mockRequest.log.error).toHaveBeenCalledWith(error);
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: {
          code: 'internal_error',
          message: 'Internal server error'
        },
        meta: {
          requestId: 'req-123',
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      });
      
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should include more details for unknown errors in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Unexpected error');
      error.stack = 'Error stack trace';
      
      errorHandler(error, mockRequest, mockReply);
      
      expect(mockRequest.log.error).toHaveBeenCalledWith(error);
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: {
          code: 'internal_error',
          message: 'Unexpected error',
          stack: 'Error stack trace'
        },
        meta: {
          requestId: 'req-123',
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});
