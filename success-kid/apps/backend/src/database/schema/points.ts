import { pgTable, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users'; // Import users table for the foreign key

export const userPoints = pgTable('user_points', {
  id: varchar('id', { length: 255 }).primaryKey(), // Using varchar consistent with users.ts
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }), // Using varchar and cascade delete
  amount: integer('amount').notNull(),
  source: text('source').notNull(),
  referenceId: text('reference_id'), // Optional reference to related entity (e.g., content ID, achievement ID)
  description: text('description'), // Optional description for the transaction
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// Type inference (optional but good practice)
export type UserPoints = typeof userPoints.$inferSelect;
export type NewUserPoints = typeof userPoints.$inferInsert;
