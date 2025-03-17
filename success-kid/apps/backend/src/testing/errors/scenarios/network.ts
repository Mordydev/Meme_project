/**
 * Network Error Scenarios
 * 
 * Scenarios for testing network-related error handling.
 */
import { ErrorType } from '../index';
import { ErrorScenario, ValidationResult } from './index';

/**
 * Base class for network error scenarios
 */
export abstract class NetworkErrorScenario implements ErrorScenario {
  name: string;
  description: string;
  targetService: string;
  errorType = ErrorType.NETWORK_ERROR;
  
  constructor(name: string, description: string, targetService: string) {
    this.name = name;
    this.description = description;
    this.targetService = targetService;
  }
  
  abstract setup(): Promise<void>;
  abstract inject(): Promise<void>;
  abstract validate(response: any): Promise<ValidationResult>;
  abstract cleanup(): Promise<void>;
}

/**
 * Timeout error scenario
 */
export class TimeoutErrorScenario extends NetworkErrorScenario {
  private service: string;
  private duration: number;
  private errorInjectionService: any;
  
  /**
   * Create a scenario for testing timeout errors
   * 
   * @param service Name of the service to inject timeout
   * @param duration Duration of the timeout in milliseconds
   * @param errorInjectionService Service for injecting errors
   */
  constructor(service: string, duration: number, errorInjectionService: any) {
    super(
      `${service} Timeout`,
      `Tests API behavior when ${service} times out for ${duration}ms`,
      service
    );
    
    this.errorType = ErrorType.TIMEOUT;
    this.service = service;
    this.duration = duration;
    this.errorInjectionService = errorInjectionService;
  }
  
  async setup(): Promise<void> {
    // No specific setup needed
  }
  
  async inject(): Promise<void> {
    // Inject timeout in the target service
    if (this.errorInjectionService) {
      await this.errorInjectionService.injectTimeout(this.service, this.duration);
    }
  }
  
  async validate(response: any): Promise<ValidationResult> {
    // Validate status code - expect 504 for timeout
    if (response.statusCode !== 504 && response.statusCode !== 500) {
      return {
        passed: false,
        message: `Expected status 504 or 500 but got ${response.statusCode}`
      };
    }
    
    // Parse response body
    let body: any;
    try {
      body = typeof response.payload === 'string' 
        ? JSON.parse(response.payload) 
        : response.payload;
    } catch (error) {
      return {
        passed: false,
        message: 'Failed to parse response payload as JSON'
      };
    }
    
    // Validate error structure
    if (!body.errors || !Array.isArray(body.errors) || body.errors.length === 0) {
      return {
        passed: false,
        message: 'Response does not contain errors array'
      };
    }
    
    return { passed: true };
  }
  
  async cleanup(): Promise<void> {
    // Reset error injection
    if (this.errorInjectionService) {
      await this.errorInjectionService.resetInjections();
    }
  }
}

/**
 * Connection failure scenario
 */
export class ConnectionFailureScenario extends NetworkErrorScenario {
  private service: string;
  private errorInjectionService: any;
  
  /**
   * Create a scenario for testing connection failures
   * 
   * @param service Name of the service to inject failure
   * @param errorInjectionService Service for injecting errors
   */
  constructor(service: string, errorInjectionService: any) {
    super(
      `${service} Connection Failure`,
      `Tests API behavior when connection to ${service} fails`,
      service
    );
    
    this.service = service;
    this.errorInjectionService = errorInjectionService;
  }
  
  async setup(): Promise<void> {
    // No specific setup needed
  }
  
  async inject(): Promise<void> {
    // Inject connection failure in the target service
    if (this.errorInjectionService) {
      await this.errorInjectionService.injectNetworkError(this.service);
    }
  }
  
  async validate(response: any): Promise<ValidationResult> {
    // Validate status code - expect 503 or 500 for connection failure
    if (response.statusCode !== 503 && response.statusCode !== 500) {
      return {
        passed: false,
        message: `Expected status 503 or 500 but got ${response.statusCode}`
      };
    }
    
    // Parse response body
    let body: any;
    try {
      body = typeof response.payload === 'string' 
        ? JSON.parse(response.payload) 
        : response.payload;
    } catch (error) {
      return {
        passed: false,
        message: 'Failed to parse response payload as JSON'
      };
    }
    
    // Validate error structure
    if (!body.errors || !Array.isArray(body.errors) || body.errors.length === 0) {
      return {
        passed: false,
        message: 'Response does not contain errors array'
      };
    }
    
    return { passed: true };
  }
  
  async cleanup(): Promise<void> {
    // Reset error injection
    if (this.errorInjectionService) {
      await this.errorInjectionService.resetInjections();
    }
  }
}

/**
 * Create a timeout error scenario
 * 
 * @param service Service to inject timeout
 * @param duration Duration of timeout in milliseconds
 * @param errorInjectionService Service for injecting errors
 * @returns Error scenario instance
 */
export function createTimeoutScenario(
  service: string,
  duration: number,
  errorInjectionService: any
): ErrorScenario {
  return new TimeoutErrorScenario(service, duration, errorInjectionService);
}

/**
 * Create a connection failure scenario
 * 
 * @param service Service to inject failure
 * @param errorInjectionService Service for injecting errors
 * @returns Error scenario instance
 */
export function createConnectionFailureScenario(
  service: string,
  errorInjectionService: any
): ErrorScenario {
  return new ConnectionFailureScenario(service, errorInjectionService);
}

// Default export for convenient imports
export default {
  TimeoutErrorScenario,
  ConnectionFailureScenario,
  createTimeoutScenario,
  createConnectionFailureScenario
};
