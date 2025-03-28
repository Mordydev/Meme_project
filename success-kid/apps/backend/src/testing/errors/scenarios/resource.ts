/**
 * Resource Error Scenarios
 * 
 * Scenarios for testing resource-related error handling.
 */
import { ErrorType } from '../index';
import { ErrorScenario, ValidationResult } from './index';

/**
 * Base class for resource error scenarios
 */
export abstract class ResourceErrorScenario implements ErrorScenario {
  name: string;
  description: string;
  targetService: string;
  errorType = ErrorType.RESOURCE_NOT_FOUND;
  
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
 * Resource not found scenario
 */
export class ResourceNotFoundScenario extends ResourceErrorScenario {
  private resourceType: string;
  private resourceId: string;
  private originalId?: string;
  
  /**
   * Create a scenario for testing resource not found errors
   * 
   * @param resourceType Type of resource (e.g., 'user', 'content')
   * @param originalId Original valid ID to replace
   */
  constructor(resourceType: string, originalId?: string) {
    super(
      `${resourceType} Not Found`,
      `Tests API behavior when requesting a non-existent ${resourceType}`,
      `${resourceType}-service`
    );
    
    this.resourceType = resourceType;
    this.resourceId = 'non-existent-id';
    this.originalId = originalId;
  }
  
  async setup(): Promise<void> {
    // No specific setup needed
  }
  
  async inject(): Promise<void> {
    // Using non-existent ID is the injection
    // Implementation will use this.resourceId in place of a valid ID
  }
  
  async validate(response: any): Promise<ValidationResult> {
    // Validate status code
    if (response.statusCode !== 404) {
      return {
        passed: false,
        message: `Expected status 404 but got ${response.statusCode}`
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
    
    // Check for specific error code
    const error = body.errors[0];
    if (error.code !== 'RESOURCE_NOT_FOUND') {
      return {
        passed: false,
        message: `Expected error code RESOURCE_NOT_FOUND but got ${error.code}`
      };
    }
    
    // Check for resource type in message
    if (!error.message.toLowerCase().includes(this.resourceType.toLowerCase())) {
      return {
        passed: false,
        message: `Error message does not mention the resource type '${this.resourceType}'`
      };
    }
    
    return { passed: true };
  }
  
  async cleanup(): Promise<void> {
    // No specific cleanup needed
  }
  
  /**
   * Get the ID to use for this scenario
   * 
   * @returns The non-existent resource ID
   */
  getResourceId(): string {
    return this.resourceId;
  }
}

/**
 * Unauthorized resource access scenario
 */
export class UnauthorizedResourceAccessScenario extends ResourceErrorScenario {
  private resourceType: string;
  private resourceId: string;
  
  /**
   * Create a scenario for testing unauthorized resource access
   * 
   * @param resourceType Type of resource (e.g., 'user', 'content')
   * @param resourceId ID of the resource to access
   */
  constructor(resourceType: string, resourceId: string) {
    super(
      `Unauthorized ${resourceType} Access`,
      `Tests API behavior when accessing a ${resourceType} without proper permissions`,
      `${resourceType}-service`
    );
    
    this.errorType = ErrorType.PERMISSION_DENIED;
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
  
  async setup(): Promise<void> {
    // No specific setup needed
  }
  
  async inject(): Promise<void> {
    // The test should use an unauthorized user/token
    // Implementation should ensure the request is made with invalid permissions
  }
  
  async validate(response: any): Promise<ValidationResult> {
    // Validate status code - expect 403 for permission denied
    if (response.statusCode !== 403) {
      return {
        passed: false,
        message: `Expected status 403 but got ${response.statusCode}`
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
    
    // Check for specific error code
    const error = body.errors[0];
    if (error.code !== 'FORBIDDEN') {
      return {
        passed: false,
        message: `Expected error code FORBIDDEN but got ${error.code}`
      };
    }
    
    return { passed: true };
  }
  
  async cleanup(): Promise<void> {
    // No specific cleanup needed
  }
  
  /**
   * Get the resource ID for this scenario
   * 
   * @returns The resource ID
   */
  getResourceId(): string {
    return this.resourceId;
  }
}

/**
 * Create a resource not found scenario
 * 
 * @param resourceType Type of resource
 * @param originalId Original valid ID to replace
 * @returns Error scenario instance
 */
export function createResourceNotFoundScenario(
  resourceType: string,
  originalId?: string
): ErrorScenario {
  return new ResourceNotFoundScenario(resourceType, originalId);
}

/**
 * Create an unauthorized resource access scenario
 * 
 * @param resourceType Type of resource
 * @param resourceId ID of the resource to access
 * @returns Error scenario instance
 */
export function createUnauthorizedAccessScenario(
  resourceType: string,
  resourceId: string
): ErrorScenario {
  return new UnauthorizedResourceAccessScenario(resourceType, resourceId);
}

// Default export for convenient imports
export default {
  ResourceNotFoundScenario,
  UnauthorizedResourceAccessScenario,
  createResourceNotFoundScenario,
  createUnauthorizedAccessScenario
};
