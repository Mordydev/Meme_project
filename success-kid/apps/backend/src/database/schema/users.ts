import { pgTable, varchar, timestamp, text, integer, jsonb, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(), // Assuming ID is varchar based on example, adjust if UUID or other type
  email: varchar('email', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  authProvider: varchar('auth_provider', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  status: varchar('status', { length: 50 }).notNull().default('active')
}, (table) => ({
  statusIdx: index('users_status_idx').on(table.status),
}));

export const profiles = pgTable('profiles', {
  userId: varchar('user_id', { length: 255 }) // Assuming ID is varchar based on example
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  level: integer('level').notNull().default(1),
  title: varchar('title', { length: 255 }),
  socialLinks: jsonb('social_links').default({}),
  preferences: jsonb('preferences').default({})
}, (table) => ({
  levelIdx: index('profiles_level_idx').on(table.level),
}));

// Type inference (optional but good practice)
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
