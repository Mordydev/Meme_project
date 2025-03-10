import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import { Logger } from 'pino';

/**
 * Service for tracking application metrics
 */
export class MetricsService {
  private redis?: Redis;
  private logger?: Logger;
  private prefix: string;
  
  /**
   * In-memory counters for when Redis is unavailable
   */
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  
  /**
   * Create a new metrics service
   */
  constructor(options: {
    fastify?: FastifyInstance;
    redis?: Redis;
    logger?: Logger;
    prefix?: string;
  } = {}) {
    this.redis = options.redis;
    this.logger = options.logger;
    this.prefix = options.prefix || 'metrics:';
    
    // Try to get Redis from Fastify instance if not provided directly
    if (!this.redis && options.fastify && options.fastify.redis) {
      this.redis = options.fastify.redis;
    }
    
    // Try to get logger from Fastify instance if not provided directly
    if (!this.logger && options.fastify) {
      this.logger = options.fastify.log;
    }
  }
  
  /**
   * Increment a counter
   */
  increment(metric: string, value: number = 1): void {
    // Update in-memory counter
    const currentValue = this.counters.get(metric) || 0;
    this.counters.set(metric, currentValue + value);
    
    // Update in Redis if available
    if (this.redis) {
      const redisKey = `${this.prefix}counter:${metric}`;
      
      this.redis.incrby(redisKey, value).catch((err) => {
        this.logger?.error({ err, metric }, 'Failed to increment counter in Redis');
      });
    }
  }
  
  /**
   * Decrement a counter
   */
  decrement(metric: string, value: number = 1): void {
    // Update in-memory counter
    const currentValue = this.counters.get(metric) || 0;
    this.counters.set(metric, Math.max(0, currentValue - value));
    
    // Update in Redis if available
    if (this.redis) {
      const redisKey = `${this.prefix}counter:${metric}`;
      
      this.redis.decrby(redisKey, value).catch((err) => {
        this.logger?.error({ err, metric }, 'Failed to decrement counter in Redis');
      });
    }
  }
  
  /**
   * Set a gauge value
   */
  gauge(metric: string, value: number): void {
    // Update in-memory gauge
    this.gauges.set(metric, value);
    
    // Update in Redis if available
    if (this.redis) {
      const redisKey = `${this.prefix}gauge:${metric}`;
      
      this.redis.set(redisKey, value.toString()).catch((err) => {
        this.logger?.error({ err, metric }, 'Failed to set gauge in Redis');
      });
    }
  }
  
  /**
   * Record a timing metric
   */
  timing(metric: string, duration: number): void {
    // For timings, we only track in Redis since they're not cumulative
    if (this.redis) {
      const redisKey = `${this.prefix}timing:${metric}`;
      
      // We store timing data in a sorted set with score as timestamp
      const timestamp = Date.now();
      const member = `${timestamp}:${duration}`;
      
      this.redis.zadd(redisKey, timestamp, member).catch((err) => {
        this.logger?.error({ err, metric }, 'Failed to record timing in Redis');
      });
      
      // Only keep the last 1000 timings for each metric
      this.redis.zremrangebyrank(redisKey, 0, -1001).catch((err) => {
        this.logger?.error({ err, metric }, 'Failed to trim timing data in Redis');
      });
    }
  }
  
  /**
   * Track success/failure ratio
   */
  trackOutcome(metric: string, success: boolean): void {
    const outcome = success ? 'success' : 'failure';
    this.increment(`${metric}.${outcome}`);
  }
  
  /**
   * Reset a metric
   */
  reset(metric: string): void {
    // Reset in-memory metric
    this.counters.delete(metric);
    this.gauges.delete(metric);
    
    // Reset in Redis if available
    if (this.redis) {
      const counterKey = `${this.prefix}counter:${metric}`;
      const gaugeKey = `${this.prefix}gauge:${metric}`;
      const timingKey = `${this.prefix}timing:${metric}`;
      
      Promise.all([
        this.redis.del(counterKey),
        this.redis.del(gaugeKey),
        this.redis.del(timingKey)
      ]).catch((err) => {
        this.logger?.error({ err, metric }, 'Failed to reset metric in Redis');
      });
    }
  }
  
  /**
   * Start a timer for measuring operation duration
   */
  startTimer(): () => number {
    const start = process.hrtime();
    
    // Return a function that calculates the duration when called
    return () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      return seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    };
  }
  
  /**
   * Measure the duration of an operation
   */
  async measure<T>(metric: string, fn: () => Promise<T>): Promise<T> {
    const stopTimer = this.startTimer();
    
    try {
      const result = await fn();
      const duration = stopTimer();
      this.timing(metric, duration);
      return result;
    } catch (error) {
      const duration = stopTimer();
      this.timing(`${metric}.error`, duration);
      throw error;
    }
  }
  
  /**
   * Get the current value of a counter
   */
  async getCounter(metric: string): Promise<number> {
    // Try to get from Redis first
    if (this.redis) {
      try {
        const redisKey = `${this.prefix}counter:${metric}`;
        const value = await this.redis.get(redisKey);
        
        if (value !== null) {
          return parseInt(value, 10);
        }
      } catch (err) {
        this.logger?.error({ err, metric }, 'Failed to get counter from Redis');
      }
    }
    
    // Fall back to in-memory counter
    return this.counters.get(metric) || 0;
  }
  
  /**
   * Get the current value of a gauge
   */
  async getGauge(metric: string): Promise<number> {
    // Try to get from Redis first
    if (this.redis) {
      try {
        const redisKey = `${this.prefix}gauge:${metric}`;
        const value = await this.redis.get(redisKey);
        
        if (value !== null) {
          return parseFloat(value);
        }
      } catch (err) {
        this.logger?.error({ err, metric }, 'Failed to get gauge from Redis');
      }
    }
    
    // Fall back to in-memory gauge
    return this.gauges.get(metric) || 0;
  }
  
  /**
   * Get timing statistics for a metric
   */
  async getTimingStats(metric: string): Promise<{
    count: number;
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  } | null> {
    if (!this.redis) {
      return null;
    }
    
    try {
      const redisKey = `${this.prefix}timing:${metric}`;
      const values = await this.redis.zrange(redisKey, 0, -1);
      
      if (values.length === 0) {
        return null;
      }
      
      // Extract durations from stored values
      const durations = values.map(value => {
        const parts = value.split(':');
        return parseFloat(parts[1]);
      }).sort((a, b) => a - b);
      
      const count = durations.length;
      const min = durations[0];
      const max = durations[count - 1];
      const avg = durations.reduce((sum, val) => sum + val, 0) / count;
      
      // Calculate percentiles
      const p95Index = Math.floor(count * 0.95);
      const p99Index = Math.floor(count * 0.99);
      const p95 = durations[p95Index];
      const p99 = durations[p99Index];
      
      return { count, min, max, avg, p95, p99 };
    } catch (err) {
      this.logger?.error({ err, metric }, 'Failed to get timing stats from Redis');
      return null;
    }
  }
}
