import * as usersSchema from './users';
import * as contentSchema from './content';
import * as pointsSchema from './points';
import * as walletsSchema from './wallets';
import * as activitiesSchema from './activities';
import * as mediaSchema from './media';
import * as notificationsSchema from './notifications'; // Import the new notifications schema
import * as redemptionsSchema from './redemptions'; // Import the new redemptions schema
import * as reactionsSchema from './reactions'; // Import the new reactions schema
import * as commentsSchema from './comments'; // Import the new comments schema

// Export all schemas combined
export const schema = {
  ...usersSchema,
  ...contentSchema,
  ...pointsSchema,
  ...walletsSchema,
  ...activitiesSchema,
  ...mediaSchema,
  ...notificationsSchema, // Add notifications schema to the combined export
  ...redemptionsSchema, // Add redemptions schema to the combined export
  ...reactionsSchema, // Add reactions schema to the combined export
  ...commentsSchema, // Add comments schema to the combined export
};

// Optionally, export individual schemas if needed elsewhere
export * from './users';
export * from './content';
export * from './points';
export * from './wallets';
export * from './activities';
export * from './media';
export * from './notifications'; // Export notifications schema types
export * from './redemptions'; // Export redemptions schema types
export * from './reactions'; // Export reactions schema types
export * from './comments'; // Export comments schema types
