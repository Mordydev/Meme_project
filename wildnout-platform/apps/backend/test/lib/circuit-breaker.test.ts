import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { withCircuitBreaker } from '../../src/repositories/core/utils/optimized-query-patterns';

describe('Circuit Breaker Pattern', () => {
  let mockFastify: any;
  let mockMetricsService: any;
  let mockLogger: any;
  
  beforeEach(() => {
    // Setup mocks
    mockMetricsService = {
      getCounter: jest.fn(),
      getGauge: jest.fn(),
      increment: jest.fn(),
      gauge: jest.fn(),
      reset: jest.fn()
    };
    
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    
    mockFastify = {
      metrics: mockMetricsService,
      log: mockLogger
    };
  });
  
  test('should execute operation successfully', async () => {
    // Setup
    const mockOperation = jest.fn().mockResolvedValue('success');
    mockMetricsService.getCounter.mockResolvedValue(0);
    
    // Execute
    const result = await withCircuitBreaker(
      mockFastify,
      mockOperation,
      { operationName: 'testOperation' }
    );
    
    // Verify
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockMetricsService.reset).toHaveBeenCalled();
  });
  
  test('should use fallback when circuit is open', async () => {
    // Setup
    const mockOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));
    mockMetricsService.getCounter.mockResolvedValue(5); // Error count at threshold
    mockMetricsService.getGauge.mockResolvedValue(Date.now()); // Recent error
    
    // Execute
    const result = await withCircuitBreaker(
      mockFastify,
      mockOperation,
      { 
        operationName: 'testOperation',
        fallbackValue: 'fallback',
        maxErrors: 5
      }
    );
    
    // Verify
    expect(result).toBe('fallback');
    expect(mockOperation).not.toHaveBeenCalled();
    expect(mockMetricsService.increment).toHaveBeenCalledWith('circuit.unknown.fallback_used');
  });
  
  test('should try operation after reset timeout', async () => {
    // Setup
    const mockOperation = jest.fn().mockResolvedValue('success');
    mockMetricsService.getCounter.mockResolvedValue(5); // Error count at threshold
    mockMetricsService.getGauge.mockResolvedValue(Date.now() - 31000); // Error time > reset timeout
    
    // Execute
    const result = await withCircuitBreaker(
      mockFastify,
      mockOperation,
      { 
        operationName: 'testOperation',
        resetTimeout: 30000
      }
    );
    
    // Verify
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockMetricsService.reset).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalled();
  });
  
  test('should increment error count on failure', async () => {
    // Setup
    const mockOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));
    mockMetricsService.getCounter.mockResolvedValue(0);
    
    // Execute and expect rejection
    await expect(withCircuitBreaker(
      mockFastify,
      mockOperation,
      { operationName: 'testOperation' }
    )).rejects.toThrow('Operation failed');
    
    // Verify
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockMetricsService.increment).toHaveBeenCalled();
    expect(mockMetricsService.gauge).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
