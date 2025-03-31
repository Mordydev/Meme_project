import axios, { AxiosInstance } from 'axios';
import { logger } from '../../../lib/logger';
import { AppError, ErrorCode } from '../../../lib/errors'; // Use InternalServerError if needed

// TODO: Add SolScan API URL and potentially API Key to environment variables
const SOLSCAN_API_URL = 'https://public-api.solscan.io';

// Interface for the expected transaction data structure from SolScan (adjust based on actual API response)
interface SolScanTx {
    slot: number;
    txHash: string;
    blockTime: number; // Unix timestamp
    signer: string[]; // Array of signers
    // Add other relevant fields like token transfers, instructions etc.
}

// Interface for the normalized transaction data we want to return
export interface TransactionData { // Export interface
    hash: string;
    timestamp: number;
    from: string; // Primary signer or source address
    to: string; // Destination address (might need logic to determine)
    amount: number; // Amount transferred (might need logic to parse instructions)
}

export class TransactionProvider {
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: SOLSCAN_API_URL,
            timeout: 15000, // 15 second timeout
            // headers: { 'Authorization': `Bearer ${process.env.SOLSCAN_API_KEY}` } // If API key is needed
        });
    }

    /**
     * Fetches recent transactions related to a specific token address.
     * @param tokenAddress The address of the token (e.g., SKC token address).
     * @param limit The maximum number of transactions to fetch.
     */
    async getRecentTransactions(tokenAddress: string, limit: number = 20): Promise<TransactionData[]> {
        logger.debug(`Fetching recent transactions for token: ${tokenAddress}, limit: ${limit}`);
        try {
            // TODO: Verify the correct SolScan endpoint and parameters for token transactions
            // This is a placeholder endpoint, likely needs adjustment
            const response = await this.axiosInstance.get<{ data: SolScanTx[] }>(`/token/transactions`, {
                params: {
                    tokenAddress: tokenAddress,
                    limit: limit,
                    // offset might also be needed depending on the API
                }
            });

            if (!response.data || !response.data.data) {
                logger.warn(`No transaction data found for token ${tokenAddress} on SolScan`);
                return [];
            }

            // Map the SolScan response to our internal TransactionData structure
            // This mapping logic is highly dependent on the actual SolScan response structure
            // and might require parsing transaction instructions to get 'from', 'to', 'amount'.
            const transactions = response.data.data.map((tx): TransactionData | null => {
                // Placeholder mapping - needs actual logic based on SolScan response
                const fromAddress = tx.signer?.[0] ?? 'unknown';
                const toAddress = 'unknown'; // Requires parsing instructions
                const transferAmount = 0; // Requires parsing instructions

                if (!tx.txHash || !tx.blockTime) return null; // Skip invalid entries

                return {
                    hash: tx.txHash,
                    timestamp: tx.blockTime,
                    from: fromAddress,
                    to: toAddress,
                    amount: transferAmount,
                };
            }).filter((tx): tx is TransactionData => tx !== null); // Filter out any null results

            return transactions;

        } catch (error: any) {
            logger.error(`Failed to fetch recent transactions from SolScan for ${tokenAddress}`, { error: error.message });
            // Consider not throwing an error but returning empty array or cached data if available
            // throw new AppError('Failed to fetch recent transaction data', 'EXTERNAL_API_ERROR', 503); // Skipping ErrorCode for now
             return []; // Return empty array on error for now
        }
    }
}

// Export a singleton instance (or handle instantiation in services/index.ts)
export const transactionProvider = new TransactionProvider();
