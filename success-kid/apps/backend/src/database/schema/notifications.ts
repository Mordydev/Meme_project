import { pgTable, varchar, text, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users'; // Import users table for the foreign key

// Enum for notification status
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'read', 'archived', 'failed']);
// Enum for notification priority
export const notificationPriorityEnum = pgEnum('notification_priority', ['high', 'normal', 'low']);

export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 255 }).primaryKey(), // Using varchar consistent with other tables
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 100 }).notNull(), // e.g., 'new_comment', 'achievement_unlocked', 'system_message'
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data').default({}), // Optional payload for context (e.g., contentId, achievementId)
  status: notificationStatusEnum('status').default('pending').notNull(),
  priority: notificationPriorityEnum('priority').default('normal').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  readAt: timestamp('read_at', { withTimezone: true }), // Timestamp when the user marked it as read
  sentAt: timestamp('sent_at', { withTimezone: true }) // Timestamp when it was actually sent via WebSocket/Push
});

// Type inference
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
