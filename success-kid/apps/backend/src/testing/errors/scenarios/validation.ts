/**
 * Validation Error Scenarios
 * 
 * Scenarios for testing validation error handling.
 */
import { ErrorType } from '../index';
import { ErrorScenario, ValidationResult } from './index';

/**
 * Base class for validation error scenarios
 */
export abstract class ValidationErrorScenario implements ErrorScenario {
  name: string;
  description: string;
  targetService: string;
  errorType = ErrorType.VALIDATION_ERROR;
  
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
 * Missing required field scenario
 */
export class MissingRequiredFieldScenario extends ValidationErrorScenario {
  private requestPayload: any;
  private fieldName: string;
  private originalValue: any;
  
  /**
   * Create a scenario for testing missing required field validation
   * 
   * @param fieldName Name of the field to omit
   * @param requestPayload Request payload to modify
   */
  constructor(fieldName: string, requestPayload: any) {
    super(
      `Missing Required Field: ${fieldName}`,
      `Tests API behavior when the required field ${fieldName} is missing`,
      'validation-service'
    );
    
    this.fieldName = fieldName;
    this.requestPayload = requestPayload;
    this.originalValue = undefined;
  }
  
  async setup(): Promise<void> {
    // Store original value if it exists
    if (this.requestPayload && this.fieldName in this.requestPayload) {
      this.originalValue = this.requestPayload[this.fieldName];
    }
  }
  
  async inject(): Promise<void> {
    // Remove the field from the payload
    if (this.requestPayload) {
      delete this.requestPayload[this.fieldName];
    }
  }
  
  async validate(response: any): Promise<ValidationResult> {
    // Validate status code
    if (response.statusCode !== 400) {
      return {
        passed: false,
        message: `Expected status 400 but got ${response.statusCode}`
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
    
    // Check for field-specific error
    const fieldError = body.errors.find((error: any) => 
      error.details && error.details.some((detail: any) => detail.field === this.fieldName)
    );
    
    if (!fieldError) {
      return {
        passed: false,
        message: `No error found for field '${this.fieldName}'`
      };
    }
    
    return { passed: true };
  }
  
  async cleanup(): Promise<void> {
    // Restore original value if it existed
    if (this.originalValue !== undefined) {
      this.requestPayload[this.fieldName] = this.originalValue;
    }
  }
}

/**
 * Invalid field value scenario
 */
export class InvalidFieldValueScenario extends ValidationErrorScenario {
  private requestPayload: any;
  private fieldName: string;
  private invalidValue: any;
  private originalValue: any;
  
  /**
   * Create a scenario for testing invalid field value validation
   * 
   * @param fieldName Name of the field to invalidate
   * @param invalidValue Invalid value to use
   * @param requestPayload Request payload to modify
   */
  constructor(fieldName: string, invalidValue: any, requestPayload: any) {
    super(
      `Invalid Field Value: ${fieldName}`,
      `Tests API behavior when the field ${fieldName} has an invalid value`,
      'validation-service'
    );
    
    this.fieldName = fieldName;
    this.invalidValue = invalidValue;
    this.requestPayload = requestPayload;
    this.originalValue = undefined;
  }
  
  async setup(): Promise<void> {
    // Store original value if it exists
    if (this.requestPayload && this.fieldName in this.requestPayload) {
      this.originalValue = this.requestPayload[this.fieldName];
    }
  }
  
  async inject(): Promise<void> {
    // Set invalid value
    if (this.requestPayload) {
      this.requestPayload[this.fieldName] = this.invalidValue;
    }
  }
  
  async validate(response: any): Promise<ValidationResult> {
    // Validate status code
    if (response.statusCode !== 400) {
      return {
        passed: false,
        message: `Expected status 400 but got ${response.statusCode}`
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
    
    // Check for field-specific error
    const fieldError = body.errors.find((error: any) => 
      error.details && error.details.some((detail: any) => detail.field === this.fieldName)
    );
    
    if (!fieldError) {
      return {
        passed: false,
        message: `No error found for field '${this.fieldName}'`
      };
    }
    
    return { passed: true };
  }
  
  async cleanup(): Promise<void> {
    // Restore original value if it existed
    if (this.originalValue !== undefined) {
      this.requestPayload[this.fieldName] = this.originalValue;
    }
  }
}

/**
 * Create a missing required field scenario
 * 
 * @param fieldName Field name to omit
 * @param requestPayload Request payload to modify
 * @returns Error scenario instance
 */
export function createMissingFieldScenario(fieldName: string, requestPayload: any): ErrorScenario {
  return new MissingRequiredFieldScenario(fieldName, requestPayload);
}

/**
 * Create an invalid field value scenario
 * 
 * @param fieldName Field name to invalidate
 * @param invalidValue Invalid value to use
 * @param requestPayload Request payload to modify
 * @returns Error scenario instance
 */
export function createInvalidValueScenario(
  fieldName: string, 
  invalidValue: any, 
  requestPayload: any
): ErrorScenario {
  return new InvalidFieldValueScenario(fieldName, invalidValue, requestPayload);
}

// Default export for convenient imports
export default {
  MissingRequiredFieldScenario,
  InvalidFieldValueScenario,
  createMissingFieldScenario,
  createInvalidValueScenario
};
