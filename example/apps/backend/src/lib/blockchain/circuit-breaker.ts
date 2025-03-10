import { Logger } from 'pino';

/**
 * Circuit state enum representing the possible states of a circuit breaker
 */
export enum CircuitState {
  CLOSED, // Circuit is closed, operations execute normally
  OPEN,   // Circuit is open, operations are failing and not attempted
  HALF_OPEN // Circuit is recovering, testing if operations succeed
}

export interface CircuitBreakerOptions {
  failureThreshold: number;  // Number of failures before opening circuit
  resetTimeout: number;      // Time in ms to wait before attempting reset (half-open)
  monitorInterval?: number;  // Optional interval for health checks in ms
  monitor?: boolean;         // Whether to monitor the circuit with health checks
  logger?: Logger;           // Optional logger for circuit state changes
}

/**
 * Circuit Breaker implementation for resilient service calls
 * 
 * This pattern prevents cascading failures by failing fast when a service is unhealthy.
 * It also provides automatic recovery through periodic testing of the service.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private monitorInterval?: NodeJS.Timeout;
  private readonly name: string;
  private readonly logger?: Logger;
  
  constructor(
    name: string,
    private readonly options: CircuitBreakerOptions
  ) {
    this.name = name;
    this.logger = options.logger;
    
    // Log initialization
    this.logger?.debug({
      circuit: this.name,
      failureThreshold: this.options.failureThreshold,
      resetTimeout: this.options.resetTimeout,
    }, 'Circuit breaker initialized');
    
    // Start monitoring if enabled
    if (options.monitor) {
      this.startMonitoring();
    }
  }
  
  /**
   * Execute an operation through the circuit breaker
   * Throws an error if the circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      // Check if it's time to try a reset (half-open state)
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.toHalfOpen();
      } else {
        // Circuit is still open
        const error = new Error(`Circuit ${this.name} is open`);
        error.name = 'CircuitBreakerOpenError';
        throw error;
      }
    }
    
    try {
      // Execute the operation
      const result = await fn();
      
      // Record success
      this.onSuccess();
      
      return result;
    } catch (error) {
      // Record failure
      this.onFailure();
      throw error;
    }
  }
  
  /**
   * Check if the circuit is currently open
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }
  
  /**
   * Get the current state of the circuit
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Handle a successful operation
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      // Reset to closed state after enough successes in half-open state
      if (this.successCount >= 3) { // Require 3 consecutive successes to close circuit
        this.toClosed();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Gradually reduce failure count on successes
      if (this.failureCount > 0) {
        this.failureCount = Math.max(0, this.failureCount - 0.1);
      }
    }
  }
  
  /**
   * Handle a failed operation
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.toOpen();
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      
      if (this.failureCount >= this.options.failureThreshold) {
        this.toOpen();
      }
    }
  }
  
  /**
   * Transition to open state
   */
  private toOpen(): void {
    if (this.state !== CircuitState.OPEN) {
      const previousState = this.state;
      this.state = CircuitState.OPEN;
      this.failureCount = 0;
      this.successCount = 0;
      
      this.logger?.warn({
        circuit: this.name,
        previousState: CircuitState[previousState],
        newState: CircuitState[this.state],
        lastFailureTime: new Date(this.lastFailureTime),
      }, 'Circuit breaker opened');
    }
  }
  
  /**
   * Transition to half-open state
   */
  private toHalfOpen(): void {
    if (this.state !== CircuitState.HALF_OPEN) {
      const previousState = this.state;
      this.state = CircuitState.HALF_OPEN;
      this.failureCount = 0;
      this.successCount = 0;
      
      this.logger?.info({
        circuit: this.name,
        previousState: CircuitState[previousState],
        newState: CircuitState[this.state],
      }, 'Circuit breaker half-open');
    }
  }
  
  /**
   * Transition to closed state
   */
  private toClosed(): void {
    if (this.state !== CircuitState.CLOSED) {
      const previousState = this.state;
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.successCount = 0;
      
      this.logger?.info({
        circuit: this.name,
        previousState: CircuitState[previousState],
        newState: CircuitState[this.state],
      }, 'Circuit breaker closed');
    }
  }
  
  /**
   * Start monitoring the circuit with health checks
   */
  private startMonitoring(): void {
    const interval = this.options.monitorInterval || 30000; // Default to 30 seconds
    
    this.monitorInterval = setInterval(() => {
      if (this.state === CircuitState.OPEN) {
        const timeSinceLastFailure = Date.now() - this.lastFailureTime;
        const remainingTime = Math.max(0, this.options.resetTimeout - timeSinceLastFailure);
        
        this.logger?.debug({
          circuit: this.name,
          state: CircuitState[this.state],
          lastFailureTime: new Date(this.lastFailureTime).toISOString(),
          resetIn: `${Math.ceil(remainingTime / 1000)}s`,
        }, 'Circuit breaker status');
        
        // Auto-transition to half-open when timeout expires
        if (timeSinceLastFailure >= this.options.resetTimeout) {
          this.toHalfOpen();
        }
      }
    }, interval);
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }
  }
}
