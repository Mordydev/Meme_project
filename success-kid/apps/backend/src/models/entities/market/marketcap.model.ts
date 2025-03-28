/**
 * Market Cap Model
 * 
 * This module defines the data models for market capitalization information.
 */

/**
 * Market cap data model
 */
export interface MarketCapData {
  id?: string;
  symbol: string;
  marketCap: string;         // Big number as string
  fullyDilutedMarketCap: string;
  circulatingSupply: string;
  totalSupply: string;
  price: number;
  lastUpdated: Date;
}

/**
 * Historical market cap data point
 */
export interface MarketCapDataPoint {
  timestamp: Date;
  marketCap: string;         // Big number as string
  price: number;
  circulatingSupply?: string;
}

/**
 * Market cap update event data
 */
export interface MarketCapUpdateEvent {
  symbol: string;
  marketCap: string;
  previousMarketCap: string;
  changePercent: number;
  timestamp: Date;
}

/**
 * Market cap comparison data
 */
export interface MarketCapComparison {
  symbol: string;
  marketCap: string;
  rank: number;
  compareToSymbol: string;
  compareToMarketCap: string;
  compareToRank: number;
  ratio: number; // How many times larger/smaller
  timestamp: Date;
}
