/**
 * Error Response Validation
 * 
 * Utilities for validating error responses.
 */

/**
 * Standard error format validation
 * 
 * @param response Response object to validate
 * @param expectedStatus Expected HTTP status code
 * @param expectedErrorCode Expected error code
 * @returns Whether the response matches expected error format
 */
export function validateStandardErrorFormat(
  response: any,
  expectedStatus: number,
  expectedErrorCode?: string
): { 
  valid: boolean; 
  message?: string; 
  errors?: string[];
} {
  const errors: string[] = [];
  
  // Validate status code
  if (response.statusCode !== expectedStatus) {
    errors.push(`Expected status ${expectedStatus} but got ${response.statusCode}`);
  }
  
  // Parse response body
  let body: any;
  try {
    body = typeof response.payload === 'string' 
      ? JSON.parse(response.payload) 
      : response.payload;
  } catch (error) {
    errors.push('Failed to parse response payload as JSON');
    return { 
      valid: false, 
      message: 'Failed to parse response payload', 
      errors 
    };
  }
  
  // Validate error structure
  if (!body.errors || !Array.isArray(body.errors) || body.errors.length === 0) {
    errors.push('Response does not contain errors array');
    return { 
      valid: false, 
      message: 'Invalid error structure', 
      errors 
    };
  }
  
  // Check for specific error code if provided
  if (expectedErrorCode) {
    const error = body.errors[0];
    if (error.code !== expectedErrorCode) {
      errors.push(`Expected error code ${expectedErrorCode} but got ${error.code}`);
    }
  }
  
  // Validate presence of required fields
  const error = body.errors[0];
  if (!error.code) {
    errors.push('Error object is missing code field');
  }
  
  if (!error.message) {
    errors.push('Error object is missing message field');
  }
  
  // Return validation result
  return {
    valid: errors.length === 0,
    message: errors.length > 0 ? errors[0] : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validation error response validation
 * 
 * @param response Response object to validate
 * @param expectedFields Expected fields in validation error
 * @returns Validation result
 */
export function validateValidationErrorFormat(
  response: any,
  expectedFields?: string[]
): { 
  valid: boolean; 
  message?: string; 
  errors?: string[];
} {
  // First check standard error format
  const standardCheck = validateStandardErrorFormat(response, 400, 'VALIDATION_ERROR');
  
  if (!standardCheck.valid) {
    return standardCheck;
  }
  
  // Parse response for deeper validation
  let body: any;
  try {
    body = typeof response.payload === 'string' 
      ? JSON.parse(response.payload) 
      : response.payload;
  } catch (error) {
    return { 
      valid: false, 
      message: 'Failed to parse response payload'
    };
  }
  
  const errors: string[] = [];
  
  // Check for details array in first error
  const error = body.errors[0];
  if (!error.details || !Array.isArray(error.details)) {
    errors.push('Validation error is missing details array');
    return {
      valid: false,
      message: 'Invalid validation error format',
      errors
    };
  }
  
  // If expected fields are provided, check that they are present in the details
  if (expectedFields && expectedFields.length > 0) {
    for (const field of expectedFields) {
      const fieldError = error.details.find((detail: any) => detail.field === field);
      if (!fieldError) {
        errors.push(`Expected validation error for field '${field}' but none found`);
      }
    }
  }
  
  // Return validation result
  return {
    valid: errors.length === 0,
    message: errors.length > 0 ? errors[0] : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Not found error response validation
 * 
 * @param response Response object to validate
 * @param resourceType Expected resource type
 * @returns Validation result
 */
export function validateNotFoundErrorFormat(
  response: any,
  resourceType?: string
): { 
  valid: boolean; 
  message?: string; 
  errors?: string[];
} {
  // First check standard error format
  const standardCheck = validateStandardErrorFormat(response, 404, 'RESOURCE_NOT_FOUND');
  
  if (!standardCheck.valid) {
    return standardCheck;
  }
  
  // If resource type is provided, check that it's mentioned in the error message
  if (resourceType) {
    // Parse response for deeper validation
    let body: any;
    try {
      body = typeof response.payload === 'string' 
        ? JSON.parse(response.payload) 
        : response.payload;
    } catch (error) {
      return { 
        valid: false, 
        message: 'Failed to parse response payload'
      };
    }
    
    const error = body.errors[0];
    if (!error.message.toLowerCase().includes(resourceType.toLowerCase())) {
      return {
        valid: false,
        message: `Error message does not mention the resource type '${resourceType}'`,
        errors: [`Error message does not mention the resource type '${resourceType}'`]
      };
    }
  }
  
  // All checks passed
  return { valid: true };
}

// Export all validation functions
export default {
  validateStandardErrorFormat,
  validateValidationErrorFormat,
  validateNotFoundErrorFormat
};
