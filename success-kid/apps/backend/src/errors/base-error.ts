/**
 * Base Error Class
 * 
 * Extends the standard Error class with additional properties
 */
import { ErrorCode } from './error-codes';

/**
 * BaseError
 * Base class for all application errors
 */
export class BaseError extends Error {
  /**
   * Error code
   */
  code: ErrorCode;
  
  /**
   * HTTP status code
   */
  statusCode: number;
  
  /**
   * Additional error details
   */
  details?: any;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: string;
  
  /**
   * Create a new BaseError
   * @param message Error message
   * @param code Error code
   * @param statusCode HTTP status code
   * @param details Additional error details
   */
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SERVER_ERROR,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    
    // Set name to the class name
    this.name = this.constructor.name;
    
    // Assign properties
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Convert error to JSON
   * @returns JSON representation of the error
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: process.env.NODE_ENV !== 'production' ? this.stack : undefined
    };
  }
  
  /**
   * Convert error to API response format
   * @returns API response error format
   */
  toAPIResponse(): Record<string, any> {
    return {
      data: null,
      meta: {
        timestamp: this.timestamp
      },
      errors: [
        {
          code: this.code,
          message: this.message,
          details: this.details
        }
      ]
    };
  }
}
