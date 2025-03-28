import { pgTable, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users'; // Import users table for the foreign key

// Basic schema for tracking user activities
export const activities = pgTable('activities', {
  id: varchar('id', { length: 255 }).primaryKey(), // Using varchar consistent with other tables
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }), // Link to the user performing the activity
  type: text('type').notNull(), // Type of activity (e.g., 'content_created', 'comment_added', 'points_redeemed')
  details: jsonb('details'), // Flexible field for activity-specific details (e.g., content ID, points amount)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// Type inference (optional but good practice)
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
