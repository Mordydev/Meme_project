import { pgTable, varchar, text, timestamp, integer, boolean, uniqueIndex, index, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users'; // Import users table for foreign key

// Table to store the definitions of achievements
export const achievements = pgTable('achievements', {
  id: varchar('id', { length: 255 }).primaryKey(), // Unique ID for the achievement
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(), // e.g., 'engagement', 'creation', 'milestone'
  criteriaType: varchar('criteria_type', { length: 50 }).notNull(), // e.g., 'count', 'streak', 'milestone', 'collection', 'one-time'
  criteriaThreshold: integer('criteria_threshold'), // e.g., number of posts, days in streak
  pointsAwarded: integer('points_awarded').notNull().default(0),
  iconUrl: text('icon_url'),
  isSecret: boolean('is_secret').notNull().default(false), // Added isSecret field
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Table to track user progress and unlocked achievements
export const userAchievements = pgTable('user_achievements', {
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: varchar('achievement_id', { length: 255 }).notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  progress: integer('progress').notNull().default(0), // Current progress towards the achievement
  isUnlocked: boolean('is_unlocked').notNull().default(false),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }),
  notified: boolean('notified').notNull().default(false), // Track if notification was sent
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.achievementId] }), // Composite primary key
  userIdAchievementIdIdx: index('user_achievements_user_id_achievement_id_idx').on(table.userId, table.achievementId), // Required index
  userIdUnlockedIdx: index('user_achievements_user_id_unlocked_idx').on(table.userId, table.isUnlocked), // Index for querying user's unlocked achievements
}));

// Type inference
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
