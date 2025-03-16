/**
 * Wallet Connection Model
 * Represents a user's connected cryptocurrency wallet
 */
import { z } from 'zod';

// Wallet connection schema with validation
export const walletConnectionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  wallet_address: z.string().min(30).max(255),
  is_verified: z.boolean(),
  connected_at: z.coerce.date(),
  last_verified_at: z.coerce.date().nullable()
});

// TypeScript type derived from schema
export type WalletConnection = z.infer<typeof walletConnectionSchema>;

// Input DTOs with validation
export const createWalletConnectionSchema = z.object({
  user_id: z.string(),
  wallet_address: z.string().min(30).max(255),
  is_verified: z.boolean().optional()
});

export type CreateWalletConnectionDto = z.infer<typeof createWalletConnectionSchema>;

export const updateWalletConnectionSchema = z.object({
  is_verified: z.boolean().optional(),
  last_verified_at: z.coerce.date().optional()
});

export type UpdateWalletConnectionDto = z.infer<typeof updateWalletConnectionSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const walletConnectionDbMapping = {
  id: 'id',
  user_id: 'user_id',
  wallet_address: 'wallet_address',
  is_verified: 'is_verified',
  connected_at: 'connected_at',
  last_verified_at: 'last_verified_at'
};
