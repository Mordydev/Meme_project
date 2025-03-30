import { pgTable, text, timestamp, uuid, varchar, foreignKey } from 'drizzle-orm/pg-core'; // Import foreignKey
import { users } from './users';
import { content } from './content';
import { relations } from 'drizzle-orm'; // Import relations

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Ensure consistent camelCase for properties, snake_case for column names
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'), // Define column first
  commentText: text('comment_text').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'), // e.g., active, deleted, flagged
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Define the self-referencing foreign key constraint using foreignKey()
  parentFk: foreignKey({
     columns: [table.parentId],
     foreignColumns: [table.id], // Reference own table's id
     name: 'comments_parent_id_fk' // Optional constraint name
  }).onDelete('cascade'), // Optional: specify delete behavior
}));


// Define relations for easier querying (optional but recommended)
export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  content: one(content, { fields: [comments.contentId], references: [content.id] }),
  parentComment: one(comments, { // Relation to parent
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'parentComment', // Explicit relation name
  }),
  replies: many(comments, { // Relation to replies
    relationName: 'replies', // Explicit relation name
  }),
}));


// Types inferred from the schema will have camelCase properties
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert; // This defines the type for inserts
