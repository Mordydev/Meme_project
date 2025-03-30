// --- Response Types ---

// Structure for basic market stats
export interface MarketStats {
    currentPrice: number;
    change24h: number; // Percentage change
    marketCap: number;
    volume24h?: number; // Optional
    // Add other relevant stats as needed
}

// Structure for historical price data point
export interface PriceDataPoint {
    timestamp: number; // Unix timestamp (seconds or ms)
    price: number;
}

// Structure for market milestones
export interface MarketMilestone {
    id: string;
    name: string;
    description?: string;
    targetMarketCap: number;
    achievedAt?: Date | string | null;
}

// Structure for milestone progress
export interface MilestoneProgress {
    currentMarketCap: number;
    nextMilestone: MarketMilestone | null; // The next upcoming milestone
    progressPercentage: number; // Progress towards the next milestone
    achievedMilestones: MarketMilestone[]; // List of already achieved milestones
}

// Structure for on-chain transaction feed item
export interface MarketTransaction {
    id: string; // Transaction hash
    timestamp: number; // Unix timestamp
    type: 'buy' | 'sell' | 'transfer'; // Simplified type
    amountSKC: number;
    amountQuote: number; // e.g., amount in SOL or USDC
    pricePerSKC: number;
    makerAddress: string;
    // Add other relevant fields like DEX source if available
}

// --- Request Query Params ---

export interface MarketHistoryQuery {
    period?: '1h' | '24h' | '7d' | '30d' | 'all'; // Time period for historical data
    interval?: string; // Optional interval for data points (e.g., '5m', '1h')
}

export interface MarketTransactionsQuery {
    limit?: number;
    beforeId?: string; // For cursor pagination based on transaction ID/hash
    type?: 'buy' | 'sell' | 'transfer'; // Filter by type
}
