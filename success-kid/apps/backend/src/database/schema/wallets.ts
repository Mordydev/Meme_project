import { pgTable, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users'; // Import users table for the foreign key

export const walletConnections = pgTable('wallet_connections', {
  id: varchar('id', { length: 255 }).primaryKey(), // Using varchar consistent with users.ts
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }), // Using varchar and cascade delete
  walletAddress: varchar('wallet_address', { length: 255 }).notNull().unique(), // Wallet addresses should be unique
  isVerified: boolean('is_verified').default(false).notNull(),
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true })
}, (table) => ({
  userIdIdx: index('wallet_connections_user_id_idx').on(table.userId),
}));

// Type inference (optional but good practice)
export type WalletConnection = typeof walletConnections.$inferSelect;
export type NewWalletConnection = typeof walletConnections.$inferInsert;
