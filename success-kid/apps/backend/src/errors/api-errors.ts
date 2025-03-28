/**
 * API-specific error types
 * 
 * This module defines specialized error types for API-related concerns.
 */
import { AppError } from './base-error';

/**
 * Points System Errors
 */
export class PointsLimitExceededError extends AppError {
  constructor(message: string = 'Daily points limit has been reached') {
    super(message, 'POINTS_LIMIT_EXCEEDED', 400);
  }
}

export class InsufficientPointsError extends AppError {
  constructor(message: string = 'Insufficient points balance') {
    super(message, 'INSUFFICIENT_POINTS', 400);
  }
}

export class PointsTransferFailedError extends AppError {
  constructor(message: string = 'Points transfer failed', details?: any) {
    super(message, 'POINTS_TRANSFER_FAILED', 500, details);
  }
}

export class SuspiciousActivityError extends AppError {
  constructor(message: string = 'Suspicious activity detected', details?: any) {
    super(message, 'SUSPICIOUS_ACTIVITY', 403, details);
  }
}

export class RedemptionFailedError extends AppError {
  constructor(message: string = 'Token redemption failed', details?: any) {
    super(message, 'REDEMPTION_FAILED', 500, details);
  }
}

/**
 * Wallet Integration Errors
 */
export class WalletConnectionError extends AppError {
  constructor(message: string = 'Failed to connect wallet', details?: any) {
    super(message, 'WALLET_CONNECTION_ERROR', 400, details);
  }
}

export class WalletVerificationFailedError extends AppError {
  constructor(message: string = 'Wallet verification failed', details?: any) {
    super(message, 'WALLET_VERIFICATION_FAILED', 400, details);
  }
}

export class WalletAlreadyConnectedError extends AppError {
  constructor(message: string = 'Wallet already connected to another account') {
    super(message, 'WALLET_ALREADY_CONNECTED', 409);
  }
}

export class BlockchainError extends AppError {
  constructor(message: string = 'Blockchain operation failed', details?: any) {
    super(message, 'BLOCKCHAIN_ERROR', 500, details);
  }
}

export class TransactionFailedError extends AppError {
  constructor(message: string = 'Transaction failed', details?: any) {
    super(message, 'TRANSACTION_FAILED', 500, details);
  }
}

/**
 * Content Management Errors
 */
export class ContentCreationFailedError extends AppError {
  constructor(message: string = 'Content creation failed', details?: any) {
    super(message, 'CONTENT_CREATION_FAILED', 500, details);
  }
}

export class ContentModerationRequiredError extends AppError {
  constructor(message: string = 'Content requires moderation before publishing') {
    super(message, 'CONTENT_MODERATION_REQUIRED', 403);
  }
}

export class ContentTypeUnsupportedError extends AppError {
  constructor(message: string = 'Content type is not supported') {
    super(message, 'CONTENT_TYPE_UNSUPPORTED', 400);
  }
}

/**
 * User Management Errors
 */
export class UserAlreadyExistsError extends AppError {
  constructor(message: string = 'User already exists') {
    super(message, 'USER_ALREADY_EXISTS', 409);
  }
}

export class ProfileUpdateFailedError extends AppError {
  constructor(message: string = 'Profile update failed', details?: any) {
    super(message, 'PROFILE_UPDATE_FAILED', 500, details);
  }
}

export class AchievementCriteriaUnmetError extends AppError {
  constructor(message: string = 'Achievement criteria not met') {
    super(message, 'ACHIEVEMENT_CRITERIA_UNMET', 400);
  }
}
