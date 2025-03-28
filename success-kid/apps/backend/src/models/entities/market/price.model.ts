/**
 * Price Model
 * 
 * This module defines the data models for token price information.
 */

/**
 * Token price data model
 */
export interface TokenPrice {
  id?: string;
  symbol: string;
  priceUsd: number;
  priceChange24h: number;
  priceChange7d?: number;
  volume24h: number;
  lastUpdated: Date;
  source: string;
}

/**
 * Historical price data point
 */
export interface PricePoint {
  timestamp: Date;
  price: number;
  volume?: number;
}

/**
 * Time period for historical data
 */
export enum TimePeriod {
  HOUR_1 = '1h',
  DAY_1 = '1d',
  WEEK_1 = '1w',
  MONTH_1 = '1m',
  ALL = 'all'
}

/**
 * Data resolution for aggregated data
 */
export enum DataResolution {
  MINUTE_1 = '1m',
  MINUTE_5 = '5m',
  MINUTE_15 = '15m',
  HOUR_1 = '1h',
  HOUR_4 = '4h',
  DAY_1 = '1d',
  WEEK_1 = '1w'
}

/**
 * Price update event data
 */
export interface PriceUpdateEvent {
  symbol: string;
  newPrice: number;
  oldPrice: number;
  changePercent: number;
  timestamp: Date;
}

/**
 * Price conversion
 */
export interface PriceConversion {
  fromSymbol: string;
  toSymbol: string;
  rate: number;
  amount: number;
  convertedAmount: number;
  timestamp: Date;
}
