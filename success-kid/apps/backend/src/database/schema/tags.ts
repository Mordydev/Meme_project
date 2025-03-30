import { pgTable, varchar, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { content } from './content'; // Import content table for foreign key

// Table for tag definitions
export const tags = pgTable('tags', {
  id: varchar('id', { length: 255 }).primaryKey(), // Consider using uuid or serial if preferred
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }), // e.g., '#RRGGBB'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    slugIdx: index('tags_slug_idx').on(table.slug),
}));

// Join table for content and tags (Many-to-Many)
export const contentTags = pgTable('content_tags', {
    contentId: varchar('content_id', { length: 255 }).notNull().references(() => content.id, { onDelete: 'cascade' }),
    tagId: varchar('tag_id', { length: 255 }).notNull().references(() => tags.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.contentId, table.tagId] }),
    contentIdIdx: index('content_tags_content_id_idx').on(table.contentId),
    tagIdIdx: index('content_tags_tag_id_idx').on(table.tagId),
}));


// Type inference
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type ContentTag = typeof contentTags.$inferSelect;
export type NewContentTag = typeof contentTags.$inferInsert;
