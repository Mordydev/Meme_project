/**
 * Database Client Tests
 */
import { getPgPool, getRedisClient, closeConnections } from './db-client';

describe('Database Client', () => {
  // Clean up after tests
  afterAll(async () => {
    await closeConnections();
  });

  describe('PostgreSQL Client', () => {
    it('should return a PostgreSQL pool instance', () => {
      const pool = getPgPool();
      expect(pool).toBeDefined();
      expect(typeof pool.query).toBe('function');
    });

    it('should be able to execute a simple query', async () => {
      const pool = getPgPool();
      const result = await pool.query('SELECT NOW() as now');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].now).toBeDefined();
    });
  });

  describe('Redis Client', () => {
    it('should return a Redis client instance', () => {
      const redis = getRedisClient();
      expect(redis).toBeDefined();
      expect(typeof redis.get).toBe('function');
    });

    it('should be able to set and get a value', async () => {
      const redis = getRedisClient();
      const testKey = 'test:db-client';
      const testValue = 'test-value';
      
      await redis.set(testKey, testValue);
      const result = await redis.get(testKey);
      
      expect(result).toBe(testValue);
      
      // Clean up
      await redis.del(testKey);
    });
  });
});