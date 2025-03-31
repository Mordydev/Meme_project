/**
 * Tags schema
 */
import { pgTable, varchar, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';

// Import references to other tables
import { content } from './content';
import { drafts } from './drafts';

// Main tags table
export const tags = pgTable('tags', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }), // HEX color code
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Content-tags join table
export const contentTags = pgTable('content_tags', {
  contentId: varchar('content_id', { length: 255 }).notNull().references(() => content.id, { onDelete: 'cascade' }),
  tagId: varchar('tag_id', { length: 255 }).notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.contentId, table.tagId] }),
  };
});

// Draft-tags join table
export const draftTags = pgTable('draft_tags', {
  draftId: varchar('draft_id', { length: 255 }).notNull().references(() => drafts.id, { onDelete: 'cascade' }),
  tagId: varchar('tag_id', { length: 255 }).notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.draftId, table.tagId] }),
  };
});

// Export types
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
