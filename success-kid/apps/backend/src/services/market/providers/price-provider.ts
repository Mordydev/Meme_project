import axios, { AxiosInstance } from 'axios';
import { logger } from '../../../lib/logger';
import { AppError, ErrorCode } from '../../../lib/errors';

// TODO: Add API keys/base URLs to environment variables
const DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest/dex';
// const BIRDEYE_API_URL = '...'; // Add if using Birdeye as fallback

interface DexScreenerPairResponse {
    pairs: {
        priceUsd?: string;
        priceChange?: { h24?: number };
        volume?: { h24?: number };
        marketCap?: number; // Note: DexScreener might use fdv (fully diluted valuation) instead of marketCap directly
        fdv?: number;
        pairCreatedAt?: number;
    }[];
}

export interface PriceData { // Export interface
    price: number;
    priceChange24h: number;
}

export interface StatsData { // Export interface
    volume24h: number;
    marketCap: number; // Or FDV depending on source
}

// TODO: Define structure for historical data if needed
export interface PriceDataPoint { // Export interface
    timestamp: number; // Unix timestamp
    price: number;
}

export class PriceProvider {
    private axiosInstance: AxiosInstance;
    // private birdeyeAxiosInstance: AxiosInstance; // If using fallback

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: DEXSCREENER_API_URL,
            timeout: 10000, // 10 second timeout
        });
        // Initialize fallback instance if needed
    }

    /**
     * Fetches the current price and 24h change.
     * @param pairAddress The token pair address (e.g., on Raydium). Needs to be configured.
     */
    async getCurrentPrice(pairAddress: string): Promise<PriceData | null> {
        logger.debug(`Fetching current price for pair: ${pairAddress}`);
        try {
            const response = await this.axiosInstance.get<DexScreenerPairResponse>(`/pairs/solana/${pairAddress}`);
            const pairData = response.data.pairs?.[0];

            if (!pairData?.priceUsd) {
                logger.warn(`Price data not found for pair ${pairAddress} on DexScreener`);
                return null; // Or try fallback
            }

            return {
                price: parseFloat(pairData.priceUsd),
                priceChange24h: pairData.priceChange?.h24 ?? 0,
            };
        } catch (error: any) {
            logger.error(`Failed to fetch current price from DexScreener for ${pairAddress}`, { error: error.message });
            // TODO: Implement fallback logic here if needed
            // Skipping ErrorCode.EXTERNAL_API_ERROR for now
            throw new AppError('Failed to fetch current price data', 'EXTERNAL_API_ERROR', 503); 
        }
    }

    /**
     * Fetches 24h volume and market cap/FDV.
     * @param pairAddress The token pair address.
     */
    async getStats(pairAddress: string): Promise<StatsData | null> {
         logger.debug(`Fetching stats for pair: ${pairAddress}`);
         try {
            const response = await this.axiosInstance.get<DexScreenerPairResponse>(`/pairs/solana/${pairAddress}`);
            const pairData = response.data.pairs?.[0];

            if (!pairData) {
                logger.warn(`Stats data not found for pair ${pairAddress} on DexScreener`);
                return null; // Or try fallback
            }

            // Use FDV as marketCap if marketCap field isn't directly available
            const marketCap = pairData.marketCap ?? pairData.fdv ?? 0;

            return {
                volume24h: pairData.volume?.h24 ?? 0,
                marketCap: marketCap,
            };
        } catch (error: any) {
            logger.error(`Failed to fetch stats from DexScreener for ${pairAddress}`, { error: error.message });
            // TODO: Implement fallback logic here if needed
             // Skipping ErrorCode.EXTERNAL_API_ERROR for now
            throw new AppError('Failed to fetch market stats data', 'EXTERNAL_API_ERROR', 503);
        }
    }

    /**
     * Fetches historical price data.
     * Placeholder - DexScreener free API might not offer extensive history.
     * May need a different provider (Birdeye, TradingView) or paid API.
     */
    async getHistoricalPrice(pairAddress: string, period: '1h' | '24h' | '7d' | '30d'): Promise<PriceDataPoint[]> {
        logger.debug(`Fetching historical price for ${period} for pair ${pairAddress}`);
        // DexScreener free API has limited historical data. Using search endpoint as a proxy.
        // A dedicated historical data provider might be better.
        // Example: Get recent trades and derive approximate history. This is NOT ideal.
        try {
             // Use search endpoint to get recent trades (adjust query as needed)
             const response = await this.axiosInstance.get(`/dex/search`, { params: { q: pairAddress } });
             const pairData = response.data.pairs?.[0];

             if (!pairData) {
                 logger.warn(`Historical data proxy failed for pair ${pairAddress}`);
                 return [];
             }

             // This is a very rough approximation based on current data, NOT real history.
             const now = Date.now() / 1000;
             const currentPrice = parseFloat(pairData.priceUsd ?? '0');
             const change24h = pairData.priceChange?.h24 ?? 0;
             const price24hAgo = currentPrice / (1 + (change24h / 100));

             let history: PriceDataPoint[] = [];
             switch (period) {
                 case '1h':
                     // Highly approximate - just return current and slightly older point
                     history = [
                         { timestamp: now - 3600, price: currentPrice * 0.995 }, // Fake 1h ago price
                         { timestamp: now, price: currentPrice }
                     ];
                     break;
                 case '24h':
                      history = [
                         { timestamp: now - 86400, price: price24hAgo },
                         { timestamp: now, price: currentPrice }
                     ];
                     break;
                 // Add rough approximations for 7d/30d if needed, or return empty
                 default:
                     history = [];
             }
             return history;

        } catch (error: any) {
            logger.error(`Failed to fetch historical price proxy from DexScreener for ${pairAddress}`, { error: error.message });
            // Skipping ErrorCode.EXTERNAL_API_ERROR for now
            // throw new AppError('Failed to fetch historical price data', 'EXTERNAL_API_ERROR', 503);
            return []; // Return empty on error
        }
    }
}

// Export a singleton instance (or handle instantiation in services/index.ts)
export const priceProvider = new PriceProvider();
