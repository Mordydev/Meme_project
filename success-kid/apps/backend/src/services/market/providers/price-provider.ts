import axios from 'axios';
import { logger } from '../../../lib/logger';
// TODO: Add types for API responses

/**
 * Interface for standardized price data.
 */
interface PriceData {
    price: number;
    // Add other relevant fields like timestamp, source API, etc.
}

/**
 * Interface for standardized market stats data.
 */
interface StatsData {
     priceChange24h: number; // Percentage
     volume24h: number;
     marketCap: number;
      // Add other relevant fields like liquidity, supply, etc.
}

// Define PriceDataPoint here as well, or move all interfaces to a types file
interface PriceDataPoint {
    timestamp: number; // Unix timestamp
    price: number;
}


/**
 * Provides market price and statistics data by fetching from external APIs
 * like DexScreener and Birdeye, with built-in redundancy.
 */
export class PriceProvider {
    private readonly DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens/';
    private readonly BIRDEYE_API = 'https://public-api.birdeye.so/public/'; // Base URL
    private readonly TOKEN_ADDRESS = process.env.SKC_TOKEN_ADDRESS; // Get token address from env
    private readonly BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY; // Get Birdeye API key

    constructor() {
        if (!this.TOKEN_ADDRESS) {
            logger.warn('SKC_TOKEN_ADDRESS environment variable is not set. Price provider may not function correctly.');
        }
         if (!this.BIRDEYE_API_KEY) {
            logger.warn('BIRDEYE_API_KEY environment variable is not set. Birdeye provider will be skipped.');
        }
    }

    /**
     * Get the current price, trying DexScreener first, then Birdeye as fallback.
     */
    async getCurrentPrice(): Promise<PriceData | null> {
        if (!this.TOKEN_ADDRESS) return null;

        try {
            // Try DexScreener first
            const dexScreenerUrl = `${this.DEXSCREENER_API}${this.TOKEN_ADDRESS}`;
            logger.debug('Fetching price from DexScreener', { url: dexScreenerUrl });
            const response = await axios.get(dexScreenerUrl);

            // TODO: Add proper type checking for response.data
            if (response.data?.pairs?.[0]?.priceUsd) {
                logger.info('Successfully fetched price from DexScreener');
                return { price: parseFloat(response.data.pairs[0].priceUsd) };
            }
            logger.warn('Could not extract price from DexScreener response', { data: response.data });

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Error fetching price from DexScreener', { error: errorMessage });
        }

        // Fallback to Birdeye if DexScreener failed and API key exists
        if (this.BIRDEYE_API_KEY) {
             try {
                const birdeyeUrl = `${this.BIRDEYE_API}price?address=${this.TOKEN_ADDRESS}`;
                logger.debug('Fetching price from Birdeye (fallback)', { url: birdeyeUrl });
                const response = await axios.get(birdeyeUrl, { headers: { 'X-API-KEY': this.BIRDEYE_API_KEY } });

                // TODO: Add proper type checking for response.data
                if (response.data?.data?.value) {
                     logger.info('Successfully fetched price from Birdeye (fallback)');
                     return { price: response.data.data.value };
                }
                 logger.warn('Could not extract price from Birdeye response', { data: response.data });

             } catch (error: unknown) {
                 const errorMessage = error instanceof Error ? error.message : String(error);
                 logger.error('Error fetching price from Birdeye (fallback)', { error: errorMessage });
             }
        }

        logger.error('Failed to fetch price from all providers.');
        return null;
    }

    /**
     * Get current market stats (volume, market cap, price change).
     * Tries DexScreener first, then Birdeye.
     */
    async getStats(): Promise<StatsData | null> {
         if (!this.TOKEN_ADDRESS) return null;

         // TODO: Implement fetching stats from DexScreener and/or Birdeye
         // DexScreener provides h24 volume, priceChange. Market cap needs calculation (price * supply).
         // Birdeye provides mc (market cap), v24hUSD (volume), priceChange24hPercent.

         logger.warn('PriceProvider getStats() is not fully implemented.');
         // Placeholder: Fetch price and calculate MC based on fixed supply
         const priceData = await this.getCurrentPrice();
         if (priceData) {
             const totalSupply = 7_000_000_000; // 7 Billion
             return {
                 priceChange24h: 0, // Placeholder
                 volume24h: 0, // Placeholder
                 marketCap: priceData.price * totalSupply
             };
         }

         return null;
    }

    /**
     * Get historical price data.
     * TODO: Implement fetching from DexScreener or Birdeye historical endpoints.
     */
    async getHistoricalPrice(period: '1h' | '24h' | '7d' | '30d'): Promise<PriceDataPoint[]> {
        logger.warn('PriceProvider getHistoricalPrice() is not implemented.');
        return []; // Placeholder
    }
}
