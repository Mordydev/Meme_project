/**
 * API Error Classes
 * 
 * Specialized error classes for API-related errors.
 * These extend the base error classes and add specific details.
 */
import { 
  AppError, 
  NotFoundError as BaseNotFoundError,
  ValidationError as BaseValidationError,
  ForbiddenError as BaseForbiddenError,
  AuthorizationError
} from './base-error';
import { ErrorCode } from './error-codes';

/**
 * Not Found Error
 * Used when a requested resource cannot be found
 */
export class NotFoundError extends BaseNotFoundError {
  constructor(resource: string, id?: string) {
    super(resource, id);
  }
}

/**
 * Validation Error
 * Used when input validation fails
 */
export class ValidationError extends BaseValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

/**
 * Forbidden Error
 * Used when a user is authenticated but not allowed to access a resource
 */
export class ForbiddenError extends BaseForbiddenError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(message);
  }
}

/**
 * Content Error
 * Specialized error for content-related operations
 */
export class ContentError extends AppError {
  constructor(message: string, code: string = ErrorCode.CONTENT_OPERATION_FAILED) {
    super(message, code, 400);
  }
}

/**
 * Comment Error
 * Specialized error for comment-related operations
 */
export class CommentError extends AppError {
  constructor(message: string, code: string = ErrorCode.COMMENT_OPERATION_FAILED) {
    super(message, code, 400);
  }
}

/**
 * Moderation Error
 * Specialized error for moderation-related operations
 */
export class ModerationError extends AppError {
  constructor(message: string, code: string = ErrorCode.MODERATION_OPERATION_FAILED) {
    super(message, code, 400);
  }
}

/**
 * Category Error
 * Specialized error for category-related operations
 */
export class CategoryError extends AppError {
  constructor(message: string, code: string = ErrorCode.CATEGORY_OPERATION_FAILED) {
    super(message, code, 400);
  }
}

/**
 * Tag Error
 * Specialized error for tag-related operations
 */
export class TagError extends AppError {
  constructor(message: string, code: string = ErrorCode.TAG_OPERATION_FAILED) {
    super(message, code, 400);
  }
}
