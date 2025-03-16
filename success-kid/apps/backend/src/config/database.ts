/**
 * Database Configuration
 * 
 * Provides configuration for the database connection
 */
import 'dotenv/config';

// Database configuration defaults with environment variable overrides
export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'success_kid',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true',
  
  // Connection pool configuration
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMs: parseInt(process.env.DB_CONN_TIMEOUT_MS || '5000', 10),
  statementTimeoutMs: parseInt(process.env.DB_STMT_TIMEOUT_MS || '30000', 10),
  
  // Query logging
  logQueries: process.env.DB_LOG_QUERIES === 'true',
  logQueryThresholdMs: parseInt(process.env.DB_LOG_QUERY_THRESHOLD_MS || '500', 10),
  
  // Migration configuration
  migrationsTable: 'migrations',
  migrationsDirectory: process.env.DB_MIGRATIONS_DIR || './migrations'
};

/**
 * Get database connection string
 */
export function getDatabaseUrl(): string {
  const {
    host,
    port,
    database,
    user,
    password,
    ssl
  } = databaseConfig;
  
  const sslParam = ssl ? '?sslmode=require' : '';
  return `postgres://${user}:${password}@${host}:${port}/${database}${sslParam}`;
}

/**
 * Validate database configuration
 * Throws error if configuration is invalid
 */
export function validateDatabaseConfig(): void {
  const { host, port, database, user, password } = databaseConfig;
  
  if (!host) throw new Error('Database host not configured');
  if (!port || isNaN(port)) throw new Error('Database port not configured or invalid');
  if (!database) throw new Error('Database name not configured');
  if (!user) throw new Error('Database user not configured');
  if (!password) throw new Error('Database password not configured');
}
