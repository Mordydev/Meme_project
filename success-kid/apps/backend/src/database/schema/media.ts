import { pgTable, varchar, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users'; // Import users table for the foreign key

export const media = pgTable('media', {
  id: varchar('id', { length: 255 }).primaryKey(), // Using varchar consistent with other tables
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  originalName: text('original_name').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(), // Size in bytes
  blobUrl: text('blob_url').notNull().unique(), // URL from Vercel Blob
  blobPath: text('blob_path').notNull().unique(), // Store the path used in Vercel Blob for potential management
  metadata: jsonb('metadata').default({}), // Flexible field for dimensions, duration, etc.
  status: varchar('status', { length: 50 }).notNull().default('active'), // e.g., 'active', 'pending_deletion', 'deleted'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type inference
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

// Define input type based on repository example (excluding auto-generated fields)
export interface NewMediaInput {
    id: string;
    userId: string;
    originalName: string;
    mimeType: string;
    size: number;
    blobUrl: string;
    blobPath: string; // Added path
    metadata?: Record<string, any>;
}
