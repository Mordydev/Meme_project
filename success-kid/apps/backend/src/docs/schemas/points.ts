/**
 * Points Schemas
 * 
 * OpenAPI schema definitions for points-related endpoints
 */
import { JSONSchema7 } from 'json-schema';

/**
 * Points transaction schema
 */
export const pointsTransactionSchema: JSONSchema7 = {
  $id: 'pointsTransaction',
  type: 'object',
  required: ['id', 'amount', 'source', 'timestamp'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    amount: { type: 'integer' },
    source: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    description: { type: 'string' },
    referenceId: { type: 'string' },
  },
};

/**
 * Points balance schema
 */
export const pointsBalanceSchema: JSONSchema7 = {
  $id: 'pointsBalance',
  type: 'object',
  required: ['balance', 'totalEarned', 'lastUpdated'],
  properties: {
    balance: { type: 'integer', minimum: 0 },
    totalEarned: { type: 'integer', minimum: 0 },
    lastUpdated: { type: 'string', format: 'date-time' },
  },
};

/**
 * Points history schema
 */
export const pointsHistorySchema: JSONSchema7 = {
  $id: 'pointsHistory',
  type: 'object',
  required: ['transactions'],
  properties: {
    transactions: {
      type: 'array',
      items: { $ref: 'pointsTransaction#' },
    },
  },
};

/**
 * Award points request schema
 */
export const awardPointsSchema: JSONSchema7 = {
  $id: 'awardPoints',
  type: 'object',
  required: ['userId', 'amount', 'source'],
  properties: {
    userId: { type: 'string', format: 'uuid' },
    amount: { type: 'integer', minimum: 1 },
    source: { type: 'string' },
    referenceId: { type: 'string' },
    description: { type: 'string' },
  },
};

/**
 * Award points response schema
 */
export const awardPointsResponseSchema: JSONSchema7 = {
  $id: 'awardPointsResponse',
  type: 'object',
  required: ['success', 'amount', 'total'],
  properties: {
    success: { type: 'boolean' },
    amount: { type: 'integer' },
    total: { type: 'integer' },
  },
};

/**
 * Redeem points request schema
 */
export const redeemPointsSchema: JSONSchema7 = {
  $id: 'redeemPoints',
  type: 'object',
  required: ['amount'],
  properties: {
    amount: { type: 'integer', minimum: 1000 },
    walletAddress: { type: 'string' },
  },
};

/**
 * Redeem points response schema
 */
export const redeemPointsResponseSchema: JSONSchema7 = {
  $id: 'redeemPointsResponse',
  type: 'object',
  required: ['success', 'transactionId', 'pointsRedeemed', 'tokensAwarded', 'estimatedProcessingTime'],
  properties: {
    success: { type: 'boolean' },
    transactionId: { type: 'string' },
    pointsRedeemed: { type: 'integer' },
    tokensAwarded: { type: 'number' },
    estimatedProcessingTime: { type: 'string', format: 'date-time' },
  },
};
