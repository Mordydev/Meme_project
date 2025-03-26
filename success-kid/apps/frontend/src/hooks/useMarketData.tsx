/**
 * Market Data hooks for Success Kid Community Platform
 * 
 * This file provides hooks for accessing market data in the platform.
 */
'use client';

import { useState, useEffect } from 'react';
import { PriceDataPoint, MarketStats, MarketTransaction, Milestone, NextMilestone } from '@/types';

// Mock data for development - replace with actual API calls in production
const MOCK_PRICE_DATA: PriceDataPoint[] = Array.from({ length: 24 }, (_, i) => {
  const timestamp = Date.now() - (23 - i) * 3600 * 1000;
  const basePrice = 0.00043;
  const randomFactor = 0.95 + Math.random() * 0.1; // Random value between 0.95 and 1.05
  return {
    timestamp,
    price: basePrice * randomFactor
  };
});

const MOCK_MARKET_STATS: MarketStats = {
  marketCap: 450000,
  volume24h: 52000,
  volume7d: 342000,
  liquidity: 180000,
  holders: 3250,
  trades24h: 187,
  price: 0.00045,
  priceChange24h: 0.000023,
  priceChangePercent24h: 5.4,
  allTimeHigh: {
    price: 0.00052,
    date: '2022-10-15T14:30:00.000Z'
  }
};

const MOCK_TRANSACTIONS: MarketTransaction[] = Array.from({ length: 15 }, (_, i) => {
  const timestamp = new Date(Date.now() - i * 900000).toISOString();
  const isEven = i % 2 === 0;
  return {
    hash: `0x${Math.random().toString(16).substring(2, 42)}`,
    type: isEven ? 'buy' : (i % 3 === 0 ? 'sell' : 'transfer'),
    amount: Math.floor(Math.random() * 50000) + 10000,
    price: 0.00043 + (Math.random() * 0.00004 - 0.00002),
    value: Math.floor(Math.random() * 1000) + 100,
    timestamp,
    fromAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
    toAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
    isSignificant: i === 0 || i === 5
  };
});

const MOCK_MILESTONES: Milestone[] = [
  {
    id: 'milestone-1',
    value: 100000,
    label: '$100K',
    description: 'Initial market establishment',
    achievedAt: '2022-08-01T12:00:00.000Z'
  },
  {
    id: 'milestone-2',
    value: 250000,
    label: '$250K',
    description: 'Community growth milestone',
    achievedAt: '2023-01-15T10:30:00.000Z'
  },
  {
    id: 'milestone-3',
    value: 500000,
    label: '$500K',
    description: 'Expansion phase target'
  },
  {
    id: 'milestone-4',
    value: 1000000,
    label: '$1M',
    description: 'Major market validation'
  },
  {
    id: 'milestone-5',
    value: 5000000,
    label: '$5M',
    description: 'Significant market presence'
  }
];

const MOCK_NEXT_MILESTONE: NextMilestone = {
  id: 'milestone-3',
  value: 500000,
  label: '$500K',
  description: 'Expansion phase target',
  progress: 70.5
};

/**
 * Hook for accessing milestone data
 */
export function useMilestoneData() {
  const [currentMarketCap, setCurrentMarketCap] = useState(450000);
  const [milestones, setMilestones] = useState<Milestone[]>(MOCK_MILESTONES);
  const [nextMilestone, setNextMilestone] = useState<NextMilestone>(MOCK_NEXT_MILESTONE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return {
    currentMarketCap,
    milestones,
    nextMilestone,
    isLoading
  };
}

/**
 * Hook for accessing market data
 */
export function useMarketData() {
  const [priceData, setPriceData] = useState<PriceDataPoint[]>(MOCK_PRICE_DATA);
  const [marketStats, setMarketStats] = useState<MarketStats>(MOCK_MARKET_STATS);
  const [transactions, setTransactions] = useState<MarketTransaction[]>(MOCK_TRANSACTIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return {
    priceData,
    marketStats,
    transactions,
    isLoading
  };
}
