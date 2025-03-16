/**
 * Wallet-Specific Error Classes
 * 
 * Specialized error classes for wallet-related operations.
 */
import { AppError } from './base-error';
import { ErrorCode } from './error-codes';

/**
 * Wallet Connection Error
 * Used when wallet connection fails
 */
export class WalletConnectionError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.WALLET_CONNECTION_ERROR, 400, details);
  }
}

/**
 * Wallet Verification Error
 * Used when wallet verification fails
 */
export class WalletVerificationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.WALLET_VERIFICATION_FAILED, 400, details);
  }
}

/**
 * Wallet Already Connected Error
 * Used when a wallet is already connected to another account
 */
export class WalletAlreadyConnectedError extends AppError {
  constructor(message: string = 'Wallet is already connected to another account', details?: any) {
    super(message, ErrorCode.WALLET_ALREADY_CONNECTED, 409, details);
  }
}

/**
 * Blockchain Error
 * Used when blockchain operations fail
 */
export class BlockchainError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.BLOCKCHAIN_ERROR, 502, details);
  }
}

/**
 * Transaction Error
 * Used when blockchain transactions fail
 */
export class TransactionError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.TRANSACTION_FAILED, 500, details);
  }
}
