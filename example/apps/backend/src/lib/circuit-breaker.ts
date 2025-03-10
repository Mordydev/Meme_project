import { logger } from './logger';

/**
 * Circuit states
 */
enum CircuitState {
  CLOSED, // Normal operation, requests proceed
  OPEN,   // Failing state, requests are prevented
  HALF_OPEN // Testing if system has recovered
}

/**
 * Options for the circuit breaker
 */
interface CircuitBreakerOptions {
  failureThreshold: number;  // Number of failures before opening circuit
  resetTimeout: number;      // Time in ms before trying to close circuit again
  timeoutDuration: number;   // Timeout in ms for operations
  monitorIntervalMs?: number; // How often to check circuit health
}

/**
 * Circuit breaker pattern implementation for handling unreliable services
 * Prevents cascading failures by stopping requests to failing services
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly timeoutDuration: number;
  private healthCheckInterval?: NodeJS.Timeout;

  /**
   * Creates a new CircuitBreaker instance
   * @param name - Circuit breaker name for logging and identification
   * @param options - Configuration options
   */
  constructor(
    private readonly name: string,
    options: CircuitBreakerOptions
  ) {
    this.failureThreshold = options.failureThreshold;
    this.resetTimeout = options.resetTimeout;
    this.timeoutDuration = options.timeoutDuration;
    
    // Start the health check monitor
    if (options.monitorIntervalMs) {
      this.startMonitoring(options.monitorIntervalMs);
    }
    
    logger.info({
      circuitName: this.name,
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout,
      timeoutDuration: this.timeoutDuration,
    }, 'Circuit breaker initialized');
  }

  /**
   * Executes a function with circuit breaker protection
   * @param fn - The function to execute
   * @returns The result of the function
   * @throws Error if circuit is open or function fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try again
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.toHalfOpen();
      } else {
        logger.debug({ circuitName: this.name }, 'Circuit open, fast failing');
        throw new Error(`Service unavailable (circuit open): ${this.name}`);
      }
    }
    
    // Setup timeout to prevent long-running operations
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timeout: ${this.name}`));
      }, this.timeoutDuration);
    });
    
    try {
      // Execute function with timeout
      const result = await Promise.race([fn(), timeoutPromise]);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= 3) {
        this.reset();
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.toOpen();
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      
      if (this.failureCount >= this.failureThreshold) {
        this.toOpen();
      }
    }
  }

  /**
   * Open the circuit (block requests)
   */
  private toOpen(): void {
    if (this.state !== CircuitState.OPEN) {
      this.state = CircuitState.OPEN;
      this.failureCount = 0;
      this.successCount = 0;
      
      logger.warn({
        circuitName: this.name,
        lastFailureTime: new Date(this.lastFailureTime).toISOString(),
        resetTime: new Date(this.lastFailureTime + this.resetTimeout).toISOString()
      }, 'Circuit breaker opened');
    }
  }

  /**
   * Half-open the circuit (test if system has recovered)
   */
  private toHalfOpen(): void {
    if (this.state !== CircuitState.HALF_OPEN) {
      this.state = CircuitState.HALF_OPEN;
      this.failureCount = 0;
      this.successCount = 0;
      
      logger.info({
        circuitName: this.name
      }, 'Circuit breaker half-open, testing service');
    }
  }

  /**
   * Reset the circuit to normal operation
   */
  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    
    logger.info({
      circuitName: this.name
    }, 'Circuit breaker reset to closed state');
  }

  /**
   * Start periodic health monitoring
   */
  private startMonitoring(intervalMs: number): void {
    this.healthCheckInterval = setInterval(() => {
      // Log circuit state for monitoring
      logger.debug({
        circuitName: this.name,
        state: CircuitState[this.state],
        failureCount: this.failureCount,
        successCount: this.successCount,
        lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null
      }, 'Circuit breaker health check');
    }, intervalMs);
  }

  /**
   * Stop circuit breaker monitoring
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Get current circuit state
   */
  getState(): string {
    return CircuitState[this.state];
  }
}
