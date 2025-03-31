import { pgTable, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users'; // Import users table for the foreign key

export const drafts = pgTable('drafts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'text', 'image', 'link', 'poll'
  contentText: text('content_text'),
  mediaUrls: jsonb('media_urls').default([]),
  metadata: jsonb('metadata').default({}), // For additional data like pollOptions, linkUrl, etc.
  lastSaved: timestamp('last_saved', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type inference
export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;

// For API/service layer
export interface DraftResponseDto extends Draft {
  tags?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  }[];
}
