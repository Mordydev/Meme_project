import { pgTable, varchar, text, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core'; // Import pgEnum
import { users } from './users'; // Import users table for the foreign key

// Define Enums for type and status
export const contentTypeEnum = pgEnum('content_type_enum', ['text', 'image', 'link', 'poll']);
export const contentStatusEnum = pgEnum('content_status_enum', ['active', 'deleted', 'flagged', 'pending_review']);

export const content = pgTable('content', {
  id: varchar('id', { length: 255 }).primaryKey(), // Using varchar consistent with users.ts
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }), // Using varchar and cascade delete
  type: contentTypeEnum('type').notNull(), // Use pgEnum
  contentText: text('content_text'),
  mediaUrls: jsonb('media_urls'), // Assuming array of URLs or structured data
  metadata: jsonb('metadata'), // Flexible field for additional data
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  status: contentStatusEnum('status').default('active').notNull() // Use pgEnum
}, (table) => ({
  userIdCreatedAtIdx: index('content_user_id_created_at_idx').on(table.userId, table.createdAt),
}));

// Type inference (optional but good practice)
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
