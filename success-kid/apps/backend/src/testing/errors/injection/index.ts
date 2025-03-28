/**
 * Error Injection Service
 * 
 * Service for injecting various types of errors into the system for testing.
 */

/**
 * Error injection service interface
 */
export interface ErrorInjectionService {
  injectDatabaseError(query: string): Promise<void>;
  injectNetworkError(service: string): Promise<void>;
  injectTimeout(service: string, duration: number): Promise<void>;
  injectResourceConstraint(resource: string, limit: number): Promise<void>;
  resetInjections(): Promise<void>;
}

/**
 * In-memory implementation of error injection service
 */
class InMemoryErrorInjectionService implements ErrorInjectionService {
  private injectedErrors: Map<string, any> = new Map();
  
  /**
   * Inject a database error for a specific query
   * 
   * @param query Query pattern to match for error injection
   */
  async injectDatabaseError(query: string): Promise<void> {
    this.injectedErrors.set(`database:${query}`, {
      type: 'database_error',
      query,
      message: 'Injected database error for testing'
    });
  }
  
  /**
   * Inject a network error for a specific service
   * 
   * @param service Service to inject error for
   */
  async injectNetworkError(service: string): Promise<void> {
    this.injectedErrors.set(`network:${service}`, {
      type: 'network_error',
      service,
      message: 'Injected network error for testing'
    });
  }
  
  /**
   * Inject a timeout for a specific service
   * 
   * @param service Service to inject timeout for
   * @param duration Duration of timeout in milliseconds
   */
  async injectTimeout(service: string, duration: number): Promise<void> {
    this.injectedErrors.set(`timeout:${service}`, {
      type: 'timeout',
      service,
      duration,
      message: `Injected timeout of ${duration}ms for ${service}`
    });
  }
  
  /**
   * Inject a resource constraint for a specific resource
   * 
   * @param resource Resource to constrain
   * @param limit Resource limit
   */
  async injectResourceConstraint(resource: string, limit: number): Promise<void> {
    this.injectedErrors.set(`resource:${resource}`, {
      type: 'resource_constraint',
      resource,
      limit,
      message: `Injected resource constraint of ${limit} for ${resource}`
    });
  }
  
  /**
   * Check if an error is injected for a specific key
   * 
   * @param key Error injection key
   * @returns Whether an error is injected
   */
  isErrorInjected(key: string): boolean {
    return this.injectedErrors.has(key);
  }
  
  /**
   * Get injected error details
   * 
   * @param key Error injection key
   * @returns Error details
   */
  getInjectedError(key: string): any {
    return this.injectedErrors.get(key);
  }
  
  /**
   * Reset all injected errors
   */
  async resetInjections(): Promise<void> {
    this.injectedErrors.clear();
  }
}

// Export singleton instance
const errorInjectionService = new InMemoryErrorInjectionService();
export default errorInjectionService;
