/**
 * Wallet Model
 * 
 * Defines the Wallet entity, validation schemas, and related data transfer objects.
 * Wallets connect users to their blockchain addresses.
 */
import { z } from 'zod';

// Wallet Type Enum
export const WalletTypeEnum = z.enum([
  'phantom',      // Phantom Wallet (Solana)
  'metamask',     // MetaMask (Ethereum)
  'coinbase',     // Coinbase Wallet
  'walletconnect', // WalletConnect
  'other'         // Other wallet types
]);

export type WalletType = z.infer<typeof WalletTypeEnum>;

// Wallet Zod Schema
export const walletConnectionSchema = z.object({
  id: z.string().uuid({ message: 'Invalid wallet connection ID format' }),
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  wallet_address: z.string()
    .min(20, { message: 'Wallet address is too short' })
    .max(255, { message: 'Wallet address is too long' })
    .regex(/^[a-zA-Z0-9]+$/, { message: 'Wallet address must contain only alphanumeric characters' }),
  wallet_type: WalletTypeEnum.default('phantom'),
  is_verified: z.boolean().default(false),
  connected_at: z.coerce.date(),
  last_verified_at: z.coerce.date().nullable(),
  
  // Additional metadata
  display_name: z.string().max(100).optional(),
  is_primary: z.boolean().default(false),
  metadata: z.record(z.string(), z.any()).default({})
});

// TypeScript Wallet Connection Type derived from Zod schema
export type WalletConnection = z.infer<typeof walletConnectionSchema>;

// Create Wallet Connection Input Schema
export const createWalletConnectionSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  wallet_address: z.string()
    .min(20, { message: 'Wallet address is too short' })
    .max(255, { message: 'Wallet address is too long' })
    .regex(/^[a-zA-Z0-9]+$/, { message: 'Wallet address must contain only alphanumeric characters' }),
  wallet_type: WalletTypeEnum.default('phantom'),
  is_verified: z.boolean().default(false),
  display_name: z.string().max(100).optional(),
  is_primary: z.boolean().default(false),
  metadata: z.record(z.string(), z.any()).optional()
});

// Create Wallet Connection DTO Type
export type CreateWalletConnectionDto = z.infer<typeof createWalletConnectionSchema>;

// Update Wallet Connection Input Schema
export const updateWalletConnectionSchema = z.object({
  is_verified: z.boolean().optional(),
  display_name: z.string().max(100).optional(),
  is_primary: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Update Wallet Connection DTO Type
export type UpdateWalletConnectionDto = z.infer<typeof updateWalletConnectionSchema>;

// Wallet Verification Input Schema
export const walletVerificationSchema = z.object({
  wallet_address: z.string()
    .min(20, { message: 'Wallet address is too short' })
    .max(255, { message: 'Wallet address is too long' })
    .regex(/^[a-zA-Z0-9]+$/, { message: 'Wallet address must contain only alphanumeric characters' }),
  message: z.string(),
  signature: z.string()
});

// Wallet Verification DTO Type
export type WalletVerificationDto = z.infer<typeof walletVerificationSchema>;

// Token Transaction Schema (for tracking on-chain transactions)
export const tokenTransactionSchema = z.object({
  id: z.string().uuid(),
  wallet_address: z.string(),
  user_id: z.string().uuid().optional(),
  transaction_hash: z.string(),
  amount: z.number(),
  token_symbol: z.string().default('SKC'),
  transaction_type: z.enum(['in', 'out']),
  timestamp: z.coerce.date(),
  status: z.enum(['pending', 'confirmed', 'failed']).default('pending'),
  block_number: z.number().int().optional(),
  metadata: z.record(z.string(), z.any()).default({})
});

// Token Transaction Type
export type TokenTransaction = z.infer<typeof tokenTransactionSchema>;

// Token Balance Schema
export const tokenBalanceSchema = z.object({
  wallet_address: z.string(),
  token_symbol: z.string().default('SKC'),
  balance: z.number(),
  usd_value: z.number().optional(),
  last_updated: z.coerce.date()
});

// Token Balance Type
export type TokenBalance = z.infer<typeof tokenBalanceSchema>;
