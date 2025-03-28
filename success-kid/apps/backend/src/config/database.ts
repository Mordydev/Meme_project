/**
 * PostgreSQL database configuration
 */
import { env } from './environment';

export const databaseConfig = {
  // Connection string from environment
  connectionString: env.DATABASE_URL,
  
  // Connection pool configuration
  pool: {
    max: process.env.DATABASE_POOL_SIZE ? parseInt(process.env.DATABASE_POOL_SIZE, 10) : 20,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  // Statement timeout (30 seconds)
  statement_timeout: 30000,
  
  // SSL configuration for production environments
  ssl: env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
};

export default databaseConfig;