import { pgTable, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users'; // Import users table for the foreign key

export const content = pgTable('content', {
  id: varchar('id', { length: 255 }).primaryKey(), // Using varchar consistent with users.ts
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }), // Using varchar and cascade delete
  type: text('type').notNull(), // Consider using pgEnum if types are fixed and known
  contentText: text('content_text'),
  mediaUrls: jsonb('media_urls'), // Assuming array of URLs or structured data
  metadata: jsonb('metadata'), // Flexible field for additional data
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  status: text('status').notNull().default('active') // Consider pgEnum if statuses are fixed
});

// Type inference (optional but good practice)
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
