/**
 * Database Connection Manager
 * 
 * Manages database connections and provides convenient access to repositories
 */
import { Pool, PoolConfig } from 'pg';
import { config } from '../config';
import { logger } from './logger';

// Import repositories
import { UserRepository } from '../repositories/user-repository';
import { ProfileRepository } from '../repositories/profile-repository';
import { ContentRepository } from '../repositories/content-repository';
import { CommentRepository } from '../repositories/comment-repository';
import { UserPointsRepository } from '../repositories/user-points/user-points-repository';
import { WalletConnectionRepository } from '../repositories/wallet-connection-repository';
import { AchievementRepository } from '../repositories/achievement-repository';
import { OrganizationRepository } from '../repositories/organization-repository';
import { RoleRepository } from '../repositories/role-repository';
import { CategoryRepository } from '../repositories/category-repository';
import { TagRepository } from '../repositories/tag-repository';
import { ContentReportRepository } from '../repositories/content-report-repository';

export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
  statementTimeoutMs: number;
}

export interface DbRepositories {
  users: UserRepository;
  profiles: ProfileRepository;
  content: ContentRepository;
  comments: CommentRepository;
  userPoints: UserPointsRepository;
  walletConnections: WalletConnectionRepository;
  achievements: AchievementRepository;
  organizations: OrganizationRepository;
  roles: RoleRepository;
  categories: CategoryRepository;
  tags: TagRepository;
  contentReports: ContentReportRepository;
}

class Database {
  private _pool: Pool;
  private _repositories: DbRepositories;
  private _connected: boolean = false;

  // Lazy initialize the pool
  get pool(): Pool {
    if (!this._pool) {
      this._pool = this.createPool();
    }
    return this._pool;
  }

  // Get repositories for data access
  get repositories(): DbRepositories {
    if (!this._repositories) {
      this._repositories = this.initializeRepositories();
    }
    return this._repositories;
  }

  // Check if database is connected
  get isConnected(): boolean {
    return this._connected;
  }

  /**
   * Create the database connection pool
   */
  private createPool(): Pool {
    const { 
      host, 
      port, 
      database, 
      user, 
      password, 
      ssl,
      maxConnections,
      idleTimeoutMs,
      connectionTimeoutMs,
      statementTimeoutMs
    } = config.database;

    const poolConfig: PoolConfig = {
      host,
      port,
      database,
      user,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      max: maxConnections,
      idleTimeoutMillis: idleTimeoutMs,
      connectionTimeoutMillis: connectionTimeoutMs,
      statement_timeout: statementTimeoutMs
    };

    logger.info('Creating database connection pool', { 
      host, 
      database, 
      maxConnections 
    });

    const pool = new Pool(poolConfig);

    // Set up event handlers
    pool.on('connect', () => {
      this._connected = true;
      logger.info('Database connection established');
    });

    pool.on('acquire', () => {
      logger.debug('Database connection acquired from pool');
    });

    pool.on('remove', () => {
      logger.debug('Database connection removed from pool');
    });

    pool.on('error', (err) => {
      this._connected = false;
      logger.error('Unexpected error on idle client', { error: err.message });
    });

    return pool;
  }

  /**
   * Initialize all repositories with the connection pool
   */
  private initializeRepositories(): DbRepositories {
    return {
      users: new UserRepository(this.pool),
      profiles: new ProfileRepository(this.pool),
      content: new ContentRepository(this.pool),
      comments: new CommentRepository(this.pool),
      userPoints: new UserPointsRepository(this.pool),
      walletConnections: new WalletConnectionRepository(this.pool),
      achievements: new AchievementRepository(this.pool),
      organizations: new OrganizationRepository(this.pool),
      roles: new RoleRepository(this.pool),
      categories: new CategoryRepository(this.pool),
      tags: new TagRepository(this.pool),
      contentReports: new ContentReportRepository(this.pool)
    };
  }

  /**
   * Verify the database connection is working
   */
  async checkConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        this._connected = true;
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      this._connected = false;
      logger.error('Database connection check failed', { error });
      return false;
    }
  }

  /**
   * Close all database connections
   */
  async close(): Promise<void> {
    if (this._pool) {
      logger.info('Closing database connection pool');
      await this._pool.end();
      this._connected = false;
    }
  }

  /**
   * Get current pool statistics
   */
  async getPoolStats(): Promise<any> {
    if (!this._pool) {
      return {
        status: 'not_initialized'
      };
    }

    try {
      // Get actual statistics from pool object
      const stats = {
        status: this._connected ? 'connected' : 'disconnected',
        totalCount: this._pool.totalCount,
        idleCount: this._pool.idleCount,
        waitingCount: this._pool.waitingCount,
        max: this._pool.options.max
      };

      // Get additional connection information from database
      const client = await this._pool.connect();
      try {
        // Get active connections
        const activeConnResult = await client.query(`
          SELECT count(*) as count FROM pg_stat_activity 
          WHERE datname = $1
        `, [config.database.database]);
        
        stats['activeConnections'] = parseInt(activeConnResult.rows[0].count, 10);
        
        return stats;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting pool stats', { error });
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

// Export a singleton instance
export const db = new Database();
