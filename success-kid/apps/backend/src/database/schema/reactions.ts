import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { content } from './content'; // Assuming content schema is in content.ts
import { users } from './users'; // Assuming users schema is in users.ts

export const reactions = pgTable('reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  reactionType: text('reaction_type').notNull(), // e.g., 'like', 'love', 'celebrate', 'insightful', 'funny'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Ensure a user can only add one reaction of a specific type per content item
    userContentReactionUniqueIdx: uniqueIndex('user_content_reaction_unique_idx')
      .on(table.userId, table.contentId, table.reactionType),
  };
});

export type Reaction = typeof reactions.$inferSelect;
export type NewReaction = typeof reactions.$inferInsert;
