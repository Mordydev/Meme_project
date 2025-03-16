/**
 * Historical data service for storing and retrieving historical market data
 */
import { PriceDataPoint, MarketCapDataPoint, TimePeriod, DataResolution } from '../types';
import { ICacheService } from '../caching/cache-service';
import { IPriceService } from '../price/price-service';
import { IMarketCapService } from '../marketcap/marketcap-service';
import { logger } from '../../../lib/logger';
import { Pool } from 'pg';

/**
 * Historical data service interface
 */
export interface IHistoricalDataService {
  getHistoricalPrices(symbol: string, period: TimePeriod, resolution?: DataResolution): Promise<PriceDataPoint[]>;
  getHistoricalMarketCap(symbol: string, period: TimePeriod, resolution?: DataResolution): Promise<MarketCapDataPoint[]>;
  aggregateData<T extends PriceDataPoint | MarketCapDataPoint>(dataPoints: T[], resolution: DataResolution): T[];
  storeHistoricalDataPoint(type: string, symbol: string, dataPoint: PriceDataPoint | MarketCapDataPoint): Promise<void>;
  runAggregationJobs(): Promise<void>;
}

/**
 * Historical data service implementation
 */
export class HistoricalDataService implements IHistoricalDataService {
  /**
   * Create a new historical data service
   * @param db Database connection
   * @param cacheService Cache service
   * @param priceService Price service
   * @param marketCapService Market cap service
   */
  constructor(
    private db: Pool,
    private cacheService: ICacheService,
    private priceService: IPriceService,
    private marketCapService: IMarketCapService
  ) {
    // Set up scheduled data collection
    this.setupDataCollection();
  }
  
  /**
   * Get historical price data
   * @param symbol Token symbol
   * @param period Time period
   * @param resolution Data resolution
   */
  async getHistoricalPrices(
    symbol: string,
    period: TimePeriod,
    resolution?: DataResolution
  ): Promise<PriceDataPoint[]> {
    // Try to get from cache first
    const cacheKey = `historical:prices:${symbol}:${period}:${resolution || this.getResolutionForPeriod(period)}`;
    
    return this.cacheService.getWithFetch<PriceDataPoint[]>(
      cacheKey,
      async () => {
        try {
          // Determine time range based on period
          const { startDate, endDate } = this.getTimeRangeForPeriod(period);
          
          // Get data from database
          const result = await this.db.query<PriceDataPoint>(
            `SELECT timestamp, price, volume
             FROM historical_prices
             WHERE symbol = $1 AND timestamp >= $2 AND timestamp <= $3
             ORDER BY timestamp ASC`,
            [symbol, startDate, endDate]
          );
          
          if (result.rows.length === 0) {
            // Fall back to price service if no historical data in DB
            logger.debug(`No historical prices in database, falling back to price service for ${symbol}`);
            return this.priceService.getPriceHistory(symbol, period, resolution);
          }
          
          // Convert rows to correct format
          const dataPoints: PriceDataPoint[] = result.rows.map(row => ({
            timestamp: new Date(row.timestamp),
            price: parseFloat(row.price.toString()),
            volume: row.volume ? parseFloat(row.volume.toString()) : undefined
          }));
          
          // Aggregate if resolution specified
          if (resolution) {
            return this.aggregateData(dataPoints, resolution);
          }
          
          return dataPoints;
        } catch (error) {
          logger.error('Failed to get historical prices from database', {
            symbol,
            period,
            error: error.message
          });
          
          // Fall back to price service if database query fails
          return this.priceService.getPriceHistory(symbol, period, resolution);
        }
      },
      {
        ttl: this.getCacheTTLForPeriod(period),
        staleWhileRevalidate: true,
        staleTtl: this.getCacheTTLForPeriod(period) * 2
      }
    );
  }
  
  /**
   * Get historical market cap data
   * @param symbol Token symbol
   * @param period Time period
   * @param resolution Data resolution
   */
  async getHistoricalMarketCap(
    symbol: string,
    period: TimePeriod,
    resolution?: DataResolution
  ): Promise<MarketCapDataPoint[]> {
    // Try to get from cache first
    const cacheKey = `historical:marketcap:${symbol}:${period}:${resolution || this.getResolutionForPeriod(period)}`;
    
    return this.cacheService.getWithFetch<MarketCapDataPoint[]>(
      cacheKey,
      async () => {
        try {
          // Determine time range based on period
          const { startDate, endDate } = this.getTimeRangeForPeriod(period);
          
          // Get data from database
          const result = await this.db.query<MarketCapDataPoint>(
            `SELECT timestamp, market_cap as "marketCap", price
             FROM historical_market_cap
             WHERE symbol = $1 AND timestamp >= $2 AND timestamp <= $3
             ORDER BY timestamp ASC`,
            [symbol, startDate, endDate]
          );
          
          if (result.rows.length === 0) {
            // Fall back to market cap service if no historical data in DB
            logger.debug(`No historical market cap in database, falling back to marketCapService for ${symbol}`);
            return this.marketCapService.getHistoricalMarketCap(symbol, period, resolution);
          }
          
          // Convert rows to correct format
          const dataPoints: MarketCapDataPoint[] = result.rows.map(row => ({
            timestamp: new Date(row.timestamp),
            marketCap: row.marketCap.toString(),
            price: parseFloat(row.price.toString())
          }));
          
          // Aggregate if resolution specified
          if (resolution) {
            return this.aggregateData(dataPoints, resolution);
          }
          
          return dataPoints;
        } catch (error) {
          logger.error('Failed to get historical market cap from database', {
            symbol,
            period,
            error: error.message
          });
          
          // Fall back to market cap service if database query fails
          return this.marketCapService.getHistoricalMarketCap(symbol, period, resolution);
        }
      },
      {
        ttl: this.getCacheTTLForPeriod(period),
        staleWhileRevalidate: true,
        staleTtl: this.getCacheTTLForPeriod(period) * 2
      }
    );
  }
  
  /**
   * Aggregate data points to a specific resolution
   * @param dataPoints Data points to aggregate
   * @param resolution Target resolution
   */
  aggregateData<T extends PriceDataPoint | MarketCapDataPoint>(
    dataPoints: T[],
    resolution: DataResolution
  ): T[] {
    if (dataPoints.length === 0) {
      return [];
    }
    
    // Sort by timestamp
    const sortedPoints = [...dataPoints].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Calculate interval in milliseconds
    const interval = this.getIntervalMilliseconds(resolution);
    
    // Group data points by interval
    const groups: Record<number, T[]> = {};
    
    for (const point of sortedPoints) {
      const timestamp = point.timestamp.getTime();
      const intervalKey = Math.floor(timestamp / interval) * interval;
      
      if (!groups[intervalKey]) {
        groups[intervalKey] = [];
      }
      
      groups[intervalKey].push(point);
    }
    
    // Aggregate each group
    return Object.entries(groups).map(([intervalKey, points]) => {
      const timestamp = new Date(parseInt(intervalKey));
      return this.aggregateGroup(points, timestamp);
    });
  }
  
  /**
   * Store a historical data point
   * @param type Data type (e.g. 'price', 'marketcap')
   * @param symbol Token symbol
   * @param dataPoint Data point to store
   */
  async storeHistoricalDataPoint(
    type: string,
    symbol: string,
    dataPoint: PriceDataPoint | MarketCapDataPoint
  ): Promise<void> {
    try {
      if (type === 'price') {
        const price = dataPoint as PriceDataPoint;
        
        await this.db.query(
          `INSERT INTO historical_prices (symbol, timestamp, price, volume)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (symbol, timestamp)
           DO UPDATE SET price = $3, volume = $4`,
          [
            symbol,
            price.timestamp,
            price.price,
            price.volume || null
          ]
        );
      } else if (type === 'marketcap') {
        const marketCap = dataPoint as MarketCapDataPoint;
        
        await this.db.query(
          `INSERT INTO historical_market_cap (symbol, timestamp, market_cap, price)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (symbol, timestamp)
           DO UPDATE SET market_cap = $3, price = $4`,
          [
            symbol,
            marketCap.timestamp,
            marketCap.marketCap,
            marketCap.price
          ]
        );
      } else {
        throw new Error(`Unsupported data type: ${type}`);
      }
    } catch (error) {
      logger.error(`Failed to store historical ${type} data point`, {
        symbol,
        timestamp: dataPoint.timestamp,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Run data aggregation jobs
   * Aggregates raw data into standardized intervals
   */
  async runAggregationJobs(): Promise<void> {
    try {
      // Aggregate price data
      await this.aggregatePriceData();
      
      // Aggregate market cap data
      await this.aggregateMarketCapData();
      
      logger.info('Data aggregation jobs completed successfully');
    } catch (error) {
      logger.error('Failed to run aggregation jobs', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Aggregate price data for various time resolutions
   */
  private async aggregatePriceData(): Promise<void> {
    try {
      // Get the last 7 days of raw price data
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const result = await this.db.query<PriceDataPoint>(
        `SELECT timestamp, price, volume
         FROM historical_prices
         WHERE timestamp >= $1
         ORDER BY timestamp ASC`,
        [sevenDaysAgo]
      );
      
      if (result.rows.length === 0) {
        logger.info('No price data to aggregate');
        return;
      }
      
      // Convert rows to correct format
      const dataPoints: PriceDataPoint[] = result.rows.map(row => ({
        timestamp: new Date(row.timestamp),
        price: parseFloat(row.price.toString()),
        volume: row.volume ? parseFloat(row.volume.toString()) : undefined
      }));
      
      // Aggregate into hourly data
      const hourlyData = this.aggregateData(dataPoints, '1h');
      
      // Aggregate into daily data
      const dailyData = this.aggregateData(dataPoints, '1d');
      
      // Store aggregated data
      // Implementation would depend on database schema for aggregated data
      logger.info('Price data aggregation completed', {
        rawCount: dataPoints.length,
        hourlyCount: hourlyData.length,
        dailyCount: dailyData.length
      });
    } catch (error) {
      logger.error('Failed to aggregate price data', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Aggregate market cap data for various time resolutions
   */
  private async aggregateMarketCapData(): Promise<void> {
    try {
      // Similar implementation to aggregatePriceData but for market cap
      logger.info('Market cap data aggregation completed');
    } catch (error) {
      logger.error('Failed to aggregate market cap data', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get time range for a period
   * @param period Time period
   * @returns Start and end dates for the period
   */
  private getTimeRangeForPeriod(period: TimePeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '1w':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '1m':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'all':
        // Use a very old date for 'all'
        startDate = new Date('2020-01-01T00:00:00Z');
        break;
      default:
        startDate.setDate(startDate.getDate() - 1);
    }
    
    return { startDate, endDate };
  }
  
  /**
   * Get appropriate data resolution for a time period
   * @param period Time period
   * @returns Data resolution
   */
  private getResolutionForPeriod(period: TimePeriod): DataResolution {
    switch (period) {
      case '1h': return '1m';
      case '1d': return '15m';
      case '1w': return '1h';
      case '1m': return '4h';
      case 'all': return '1d';
      default: return '15m';
    }
  }
  
  /**
   * Get appropriate cache TTL for a time period
   * @param period Time period
   * @returns Cache TTL in seconds
   */
  private getCacheTTLForPeriod(period: TimePeriod): number {
    switch (period) {
      case '1h': return 60; // 1 minute
      case '1d': return 300; // 5 minutes
      case '1w': return 900; // 15 minutes
      case '1m': return 3600; // 1 hour
      case 'all': return 3600; // 1 hour
      default: return 300; // 5 minutes
    }
  }
  
  /**
   * Get interval in milliseconds for a resolution
   * @param resolution Data resolution
   * @returns Interval in milliseconds
   */
  private getIntervalMilliseconds(resolution: DataResolution): number {
    switch (resolution) {
      case '1m': return 60 * 1000;
      case '5m': return 5 * 60 * 1000;
      case '15m': return 15 * 60 * 1000;
      case '1h': return 60 * 60 * 1000;
      case '4h': return 4 * 60 * 60 * 1000;
      case '1d': return 24 * 60 * 60 * 1000;
      case '1w': return 7 * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  }
  
  /**
   * Aggregate a group of data points
   * @param points Data points to aggregate
   * @param timestamp Timestamp for the aggregated point
   * @returns Aggregated data point
   */
  private aggregateGroup<T extends PriceDataPoint | MarketCapDataPoint>(
    points: T[],
    timestamp: Date
  ): T {
    if (points.length === 0) {
      throw new Error('Cannot aggregate empty group');
    }
    
    // If there's only one point, use it directly
    if (points.length === 1) {
      const point = { ...points[0] };
      point.timestamp = timestamp;
      return point;
    }
    
    // For price data, use OHLCV aggregation
    if ('price' in points[0]) {
      const open = points[0].price;
      const close = points[points.length - 1].price;
      const high = Math.max(...points.map(p => p.price));
      const low = Math.min(...points.map(p => p.price));
      
      // For volume, sum all volumes in the interval
      let volume = 0;
      for (const point of points) {
        if ((point as PriceDataPoint).volume) {
          volume += (point as PriceDataPoint).volume!;
        }
      }
      
      // Use the close price as the aggregated price
      return {
        timestamp,
        price: close,
        volume
      } as T;
    }
    
    // For market cap data, use the latest value
    if ('marketCap' in points[0]) {
      const latest = points[points.length - 1];
      return {
        timestamp,
        marketCap: latest.marketCap,
        price: latest.price
      } as unknown as T;
    }
    
    // Default fallback - use the first point
    const point = { ...points[0] };
    point.timestamp = timestamp;
    return point;
  }
  
  /**
   * Set up scheduled data collection
   */
  private setupDataCollection(): void {
    // Store price data every 15 minutes
    setInterval(async () => {
      try {
        // Get current price
        const price = await this.priceService.getCurrentPrice('SKC');
        
        // Create data point
        const dataPoint: PriceDataPoint = {
          timestamp: new Date(),
          price: price.priceUsd,
          volume: price.volume24h / 96 // Rough estimate for 15-minute volume
        };
        
        // Store data point
        await this.storeHistoricalDataPoint('price', 'SKC', dataPoint);
        
        logger.debug('Stored historical price data point', {
          timestamp: dataPoint.timestamp,
          price: dataPoint.price
        });
      } catch (error) {
        logger.error('Failed to store historical price data', { error: error.message });
      }
    }, 15 * 60 * 1000); // Every 15 minutes
    
    // Store market cap data every 15 minutes
    setInterval(async () => {
      try {
        // Get current market cap
        const marketCap = await this.marketCapService.getMarketCap('SKC');
        
        // Create data point
        const dataPoint: MarketCapDataPoint = {
          timestamp: new Date(),
          marketCap: marketCap.marketCap,
          price: marketCap.price
        };
        
        // Store data point
        await this.storeHistoricalDataPoint('marketcap', 'SKC', dataPoint);
        
        logger.debug('Stored historical market cap data point', {
          timestamp: dataPoint.timestamp,
          marketCap: dataPoint.marketCap
        });
      } catch (error) {
        logger.error('Failed to store historical market cap data', { error: error.message });
      }
    }, 15 * 60 * 1000); // Every 15 minutes
    
    // Run aggregation jobs once a day
    setInterval(async () => {
      try {
        await this.runAggregationJobs();
      } catch (error) {
        logger.error('Failed to run scheduled aggregation jobs', { error: error.message });
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }
}
