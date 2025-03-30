import 'dotenv/config'; // Load environment variables from .env file
// Import necessary Drizzle types
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'; 
// Import sql tag from drizzle-orm main package
import { sql as drizzleSql } from 'drizzle-orm'; 
import { neon, neonConfig, Pool } from '@neondatabase/serverless'; 
import { Logger } from 'pino'; // Assuming pino logger is used as per backend.md
import * as schema from './schema';

// Configure Neon for serverless environment
// neonConfig.fetchConnectionCache = true; // Recommended by Neon docs, enable if needed

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // In a real application, you might want a more robust logger setup
  console.error('DATABASE_URL environment variable is not set.');
  process.exit(1); // Exit if the database URL is essential
}

// Create SQL client for standard queries using neon
const sqlClient = neon(databaseUrl);

// Define the Drizzle configuration (REMOVED namingStrategy)
const drizzleConfig = { 
  schema
};

// Initialize Drizzle with the configuration
// Explicitly type db for better type inference downstream
export const db: NeonHttpDatabase<typeof schema> = drizzle(sqlClient, drizzleConfig);

// Optional: Create a connection pool for high-traffic scenarios or transactions
// Adjust pool settings based on expected load
// const pool = new Pool({ connectionString: databaseUrl, max: 10 });
// export const poolDb = drizzle(pool, drizzleConfig); // Apply config to pool client too if used

// Health check function (using the standard client)
// Assuming a logger instance is available, replace `console` if using pino or similar
export async function checkDatabaseHealth(logger: Logger = console as any) {
  try {
    // Drizzle doesn't have a direct ping, execute a simple query using drizzleSql
    const result = await db.execute(drizzleSql`SELECT 1`); 
    // Check if the query returned at least one row with a result
    if (result && result.rows && result.rows.length > 0) {
        logger.info('Database health check successful.');
        return true;
    } else {
        logger.error('Database health check failed: No result returned.');
        return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Database health check failed: ${errorMessage}`, { error });
    return false;
  }
}

// Example of using the pool for transactions if needed
// export async function withTransaction<T>(callback: (txDb: typeof db) => Promise<T>): Promise<T> {
//   return poolDb.transaction(callback);
// }
