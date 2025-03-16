/**
 * Repository for historical market data
 */
import { Pool } from 'pg';
import { logger } from '../../lib/logger';

/**
 * Historical market data repository interface
 */
export interface IHistoricalRepository {
  storePriceDataPoint(symbol: string, timestamp: Date, price: number, volume?: number): Promise<void>;
  storeMarketCapDataPoint(symbol: string, timestamp: Date, marketCap: string, price: number): Promise<void>;
  getPriceDataPoints(symbol: string, startDate: Date, endDate: Date): Promise<any[]>;
  getMarketCapDataPoints(symbol: string, startDate: Date, endDate: Date): Promise<any[]>;
  pruneHistoricalData(olderThan: Date): Promise<number>;
}

/**
 * Historical market data repository implementation
 */
export class HistoricalRepository implements IHistoricalRepository {
  /**
   * Create a new historical repository
   * @param db Database connection pool
   */
  constructor(private db: Pool) {}
  
  /**
   * Store a price data point
   * @param symbol Token symbol
   * @param timestamp Timestamp
   * @param price Price in USD
   * @param volume Optional volume in USD
   */
  async storePriceDataPoint(
    symbol: string,
    timestamp: Date,
    price: number,
    volume?: number
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO historical_prices (symbol, timestamp, price, volume)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (symbol, timestamp)
         DO UPDATE SET price = $3, volume = $4`,
        [symbol, timestamp, price, volume || null]
      );
    } catch (error) {
      logger.error('Failed to store price data point', {
        symbol,
        timestamp,
        price,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Store a market cap data point
   * @param symbol Token symbol
   * @param timestamp Timestamp
   * @param marketCap Market cap as string (for precision)
   * @param price Price in USD
   */
  async storeMarketCapDataPoint(
    symbol: string,
    timestamp: Date,
    marketCap: string,
    price: number
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO historical_market_cap (symbol, timestamp, market_cap, price)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (symbol, timestamp)
         DO UPDATE SET market_cap = $3, price = $4`,
        [symbol, timestamp, marketCap, price]
      );
    } catch (error) {
      logger.error('Failed to store market cap data point', {
        symbol,
        timestamp,
        marketCap,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Get price data points for a time range
   * @param symbol Token symbol
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of price data points
   */
  async getPriceDataPoints(
    symbol: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT timestamp, price, volume
         FROM historical_prices
         WHERE symbol = $1 AND timestamp >= $2 AND timestamp <= $3
         ORDER BY timestamp ASC`,
        [symbol, startDate, endDate]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to get price data points', {
        symbol,
        startDate,
        endDate,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Get market cap data points for a time range
   * @param symbol Token symbol
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of market cap data points
   */
  async getMarketCapDataPoints(
    symbol: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT timestamp, market_cap as "marketCap", price
         FROM historical_market_cap
         WHERE symbol = $1 AND timestamp >= $2 AND timestamp <= $3
         ORDER BY timestamp ASC`,
        [symbol, startDate, endDate]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to get market cap data points', {
        symbol,
        startDate,
        endDate,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Prune historical data older than a certain date
   * @param olderThan Date threshold
   * @returns Number of records deleted
   */
  async pruneHistoricalData(olderThan: Date): Promise<number> {
    try {
      // Start a transaction
      const client = await this.db.connect();
      
      try {
        await client.query('BEGIN');
        
        // Delete old price data
        const priceResult = await client.query(
          `DELETE FROM historical_prices
           WHERE timestamp < $1
           RETURNING id`,
          [olderThan]
        );
        
        // Delete old market cap data
        const marketCapResult = await client.query(
          `DELETE FROM historical_market_cap
           WHERE timestamp < $1
           RETURNING id`,
          [olderThan]
        );
        
        await client.query('COMMIT');
        
        const totalDeleted = priceResult.rowCount + marketCapResult.rowCount;
        
        logger.info('Pruned historical data', {
          priceRecords: priceResult.rowCount,
          marketCapRecords: marketCapResult.rowCount,
          olderThan
        });
        
        return totalDeleted;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Failed to prune historical data', {
        olderThan,
        error: error.message
      });
      throw error;
    }
  }
}
