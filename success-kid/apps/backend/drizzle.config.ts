import 'dotenv/config'; // Load environment variables
import type { Config } from 'drizzle-kit';

// Ensure the DATABASE_URL is loaded correctly
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set or loaded correctly.');
}

export default {
  schema: './src/database/schema/*.ts', // Path to your schema files
  out: './src/database/migrations',    // Output directory for migrations
  dialect: 'postgresql',               // Specify the SQL dialect
  dbCredentials: {
    url: databaseUrl,                  // Use 'url' instead of 'connectionString' for PostgreSQL dialect
  },
  verbose: true,                       // Enable verbose logging
  strict: true,                        // Enable strict mode
} satisfies Config;
