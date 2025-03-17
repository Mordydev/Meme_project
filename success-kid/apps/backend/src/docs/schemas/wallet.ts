/**
 * Wallet Schemas
 * 
 * OpenAPI schema definitions for wallet-related endpoints
 */
import { JSONSchema7 } from 'json-schema';

/**
 * Wallet connection schema
 */
export const walletConnectionSchema: JSONSchema7 = {
  $id: 'walletConnection',
  type: 'object',
  required: ['address', 'isVerified', 'connectedAt'],
  properties: {
    address: { type: 'string' },
    isVerified: { type: 'boolean' },
    connectedAt: { type: 'string', format: 'date-time' },
    balance: { type: 'number' },
  },
};

/**
 * Connect wallet request schema
 */
export const connectWalletSchema: JSONSchema7 = {
  $id: 'connectWallet',
  type: 'object',
  required: ['walletAddress', 'signature', 'message'],
  properties: {
    walletAddress: { type: 'string' },
    signature: { type: 'string' },
    message: { type: 'string' },
  },
};

/**
 * Verify wallet request schema
 */
export const verifyWalletSchema: JSONSchema7 = {
  $id: 'verifyWallet',
  type: 'object',
  required: ['walletAddress', 'signature', 'message'],
  properties: {
    walletAddress: { type: 'string' },
    signature: { type: 'string' },
    message: { type: 'string' },
  },
};

/**
 * Verify wallet response schema
 */
export const verifyWalletResponseSchema: JSONSchema7 = {
  $id: 'verifyWalletResponse',
  type: 'object',
  required: ['verified', 'address'],
  properties: {
    verified: { type: 'boolean' },
    address: { type: 'string' },
  },
};
