import * as usersSchema from './users';
import * as contentSchema from './content';
import * as pointsSchema from './points';
import * as walletsSchema from './wallets';
import * as activitiesSchema from './activities';
import * as mediaSchema from './media';
import * as notificationsSchema from './notifications'; // Import the new notifications schema

// Export all schemas combined
export const schema = {
  ...usersSchema,
  ...contentSchema,
  ...pointsSchema,
  ...walletsSchema,
  ...activitiesSchema,
  ...mediaSchema,
  ...notificationsSchema, // Add notifications schema to the combined export
};

// Optionally, export individual schemas if needed elsewhere
export * from './users';
export * from './content';
export * from './points';
export * from './wallets';
export * from './activities';
export * from './media';
export * from './notifications'; // Export notifications schema types
