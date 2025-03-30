import { pgTable, varchar, integer, text, timestamp, uuid, uniqueIndex, boolean, doublePrecision } from 'drizzle-orm/pg-core';
import { users } from './users'; // Import users table for the foreign key
import { userPoints } from './points'; // Import points table for potential foreign key

// Redemption Status Enum (matches model)
// Note: Drizzle doesn't have first-class enum support like this, 
// usually you'd use pgEnum or text constraints. Using text for simplicity here.
// Ensure the values match RedemptionStatusEnum in the model.
const redemptionStatus = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const;

export const redemptions = pgTable('redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  pointsAmount: integer('points_amount').notNull(),
  tokenAmount: doublePrecision('token_amount').notNull(), // Use doublePrecision for token amounts
  walletAddress: text('wallet_address').notNull(),
  status: text('status', { enum: redemptionStatus }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  transactionHash: text('transaction_hash'),
  pointsTransactionId: uuid('points_transaction_id').references(() => userPoints.id, { onDelete: 'set null' }), // Optional link to points deduction
  errorMessage: text('error_message'),
  batchId: uuid('batch_id').references(() => redemptionBatches.id, { onDelete: 'set null' }) // Link to batch
}, (table) => {
  return {
    userIdx: uniqueIndex('redemptions_user_id_idx').on(table.userId), // Index on user_id
    statusIdx: uniqueIndex('redemptions_status_idx').on(table.status), // Index on status
    batchIdx: uniqueIndex('redemptions_batch_id_idx').on(table.batchId), // Index on batchId
  };
});

export const redemptionBatches = pgTable('redemption_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: text('status', { enum: redemptionStatus }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  redemptionCount: integer('redemption_count').notNull(),
  totalPoints: integer('total_points').notNull(),
  totalTokens: doublePrecision('total_tokens').notNull(), // Use doublePrecision
}, (table) => {
  return {
    statusIdx: uniqueIndex('redemption_batches_status_idx').on(table.status), // Index on status
  };
});

// Type inference
// Type inference for redemptions and batches
export type RedemptionSchema = typeof redemptions.$inferSelect;
export type NewRedemptionSchema = typeof redemptions.$inferInsert;
export type RedemptionBatchSchema = typeof redemptionBatches.$inferSelect;
export type NewRedemptionBatchSchema = typeof redemptionBatches.$inferInsert;

// --- Redemption Transactions Table ---
// Assumed schema for tracking processing steps/attempts for a redemption
export const redemptionTransactions = pgTable('redemption_transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    redemptionId: uuid('redemption_id').notNull().references(() => redemptions.id, { onDelete: 'cascade' }),
    status: text('status').notNull(), // e.g., 'queued', 'submitted', 'confirmed', 'failed'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    transactionHash: text('transaction_hash'), // Blockchain transaction hash
    errorMessage: text('error_message'),
}, (table) => {
    return {
        redemptionIdx: uniqueIndex('redemption_transactions_redemption_id_idx').on(table.redemptionId),
    };
});

// Type inference for redemption transactions
export type RedemptionTransactionSchema = typeof redemptionTransactions.$inferSelect;
export type NewRedemptionTransactionSchema = typeof redemptionTransactions.$inferInsert;
