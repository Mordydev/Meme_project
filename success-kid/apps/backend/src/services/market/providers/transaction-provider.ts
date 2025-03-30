import axios from 'axios';
import { logger } from '../../../lib/logger';
// TODO: Add types for API responses

/**
 * Interface for standardized transaction data (defined in market-service.ts for now).
 */
// Re-using interface from market-service.ts for now
interface TransactionData {
    hash: string;
    timestamp: number;
    from: string;
    to: string;
    amount: number;
    // Add other relevant transaction details
}

/**
 * Provides transaction data by fetching from external blockchain explorers like SolScan.
 */
export class TransactionProvider {
    private readonly SOLSCAN_API = 'https://public-api.solscan.io/'; // Base URL
    private readonly TOKEN_ADDRESS = process.env.SKC_TOKEN_ADDRESS; // Get token address from env
    // SolScan public API might not require a key for basic token transfers, but check their docs.
    // private readonly SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY; 

    constructor() {
        if (!this.TOKEN_ADDRESS) {
            logger.warn('SKC_TOKEN_ADDRESS environment variable is not set. Transaction provider may not function correctly.');
        }
    }

    /**
     * Get recent transactions involving the token address.
     * @param limit Max number of transactions to return.
     */
    async getRecentTransactions(limit: number = 20): Promise<TransactionData[]> {
        if (!this.TOKEN_ADDRESS) return [];

        try {
            // Example: Fetch token transfers from SolScan
            const url = `${this.SOLSCAN_API}account/splTransfers?account=${this.TOKEN_ADDRESS}&limit=${limit}`;
            logger.debug('Fetching recent transactions from SolScan', { url });
            const response = await axios.get(url);

            // TODO: Add proper type checking and data mapping for SolScan response
            if (Array.isArray(response.data?.data)) {
                logger.info(`Successfully fetched ${response.data.data.length} transactions from SolScan`);
                // Map the SolScan response structure to TransactionData interface
                return response.data.data.map((tx: any) => ({
                    hash: tx.txHash,
                    timestamp: tx.blockTime,
                    from: tx.source_owner ?? tx.owner, // Adjust based on actual API response field names
                    to: tx.destination_owner ?? tx.owner, // Adjust based on actual API response field names
                    amount: parseFloat(tx.changeAmount) // Ensure amount is a number
                    // Map other relevant fields
                }));
            }
            logger.warn('Could not extract transactions from SolScan response', { data: response.data });
            return [];

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Error fetching transactions from SolScan', { error: errorMessage });
            return [];
        }
    }
}
