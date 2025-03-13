/**
 * Market data hooks for Success Kid Community Platform
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { 
  PriceDataPoint, 
  MarketStats, 
  MarketTransaction, 
  Milestone,
  NextMilestone,
  TokenAllocation,
  AlertPreferences,
  MarketData
} from '@/types';

/**
 * Hook for fetching and managing price data
 */
export function usePriceData(initialTimeRange: string = '1d') {
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { socket, connected } = useWebSocketContext();

  // Fetch price data based on time range
  const fetchPriceData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<{ 
        prices: PriceDataPoint[],
        basePrice: number,
        priceChange: number,
        priceChangePercent: number 
      }>(`/api/v1/market/price?timeRange=${timeRange}`);
      
      setData(response.data.prices);
      setCurrentPrice(response.data.basePrice);
      setPriceChange(response.data.priceChange);
      setPriceChangePercent(response.data.priceChangePercent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch price data'));
      console.error('Error fetching price data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // Fetch data on initial load and time range change
  useEffect(() => {
    fetchPriceData();
  }, [fetchPriceData]);

  // Listen for real-time price updates
  useEffect(() => {
    if (!socket || !connected) return;

    // Handler for price update events
    const handlePriceUpdate = (data: { 
      price: number,
      priceChange: number,
      priceChangePercent: number,
      timestamp: string 
    }) => {
      setCurrentPrice(data.price);
      setPriceChange(data.priceChange);
      setPriceChangePercent(data.priceChangePercent);
      
      // Add the new data point only if it would be relevant to the current time range
      // This is a simplification - ideally we would handle this more carefully
      if (timeRange === '1h' || timeRange === '1d') {
        setData(prevData => {
          const newData = [...prevData];
          // Add new point or update latest point
          const timestamp = new Date(data.timestamp).getTime();
          
          const lastPoint = newData[newData.length - 1];
          if (lastPoint && timestamp - lastPoint.timestamp < 60000) {
            // Update last point if it's less than a minute old
            newData[newData.length - 1] = { ...lastPoint, price: data.price };
          } else {
            // Add new point
            newData.push({ timestamp, price: data.price });
          }
          
          return newData;
        });
      }
    };

    // Subscribe to price updates
    socket.on('market:price_update', handlePriceUpdate);

    // Cleanup subscription
    return () => {
      socket.off('market:price_update', handlePriceUpdate);
    };
  }, [socket, connected, timeRange]);

  return {
    data,
    currentPrice,
    priceChange,
    priceChangePercent,
    isLoading,
    error,
    timeRange,
    setTimeRange,
    refresh: fetchPriceData
  };
}

/**
 * Hook for fetching and managing milestone data
 */
export function useMilestoneData() {
  const [currentMarketCap, setCurrentMarketCap] = useState(0);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [nextMilestone, setNextMilestone] = useState<NextMilestone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [celebratedMilestone, setCelebratedMilestone] = useState<Milestone | null>(null);
  const { socket, connected } = useWebSocketContext();

  // Fetch milestone data
  const fetchMilestoneData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<{ 
        currentMarketCap: number,
        milestones: Milestone[],
        nextMilestone: NextMilestone
      }>('/api/v1/market/milestones');
      
      setCurrentMarketCap(response.data.currentMarketCap);
      setMilestones(response.data.milestones);
      setNextMilestone(response.data.nextMilestone);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch milestone data'));
      console.error('Error fetching milestone data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on initial load
  useEffect(() => {
    fetchMilestoneData();
  }, [fetchMilestoneData]);

  // Listen for real-time milestone updates
  useEffect(() => {
    if (!socket || !connected) return;

    // Handler for milestone reached events
    const handleMilestoneReached = (data: {
      milestoneId: string,
      value: number,
      label: string,
      description: string,
      achievedAt: string
    }) => {
      // Update milestone data
      setMilestones(prevMilestones => 
        prevMilestones.map(m => 
          m.id === data.milestoneId 
            ? { ...m, achievedAt: data.achievedAt } 
            : m
        )
      );
      
      // Find the next milestone after this one
      const milestone = milestones.find(m => m.id === data.milestoneId);
      if (milestone) {
        setCelebratedMilestone(milestone);
        setIsCelebrating(true);
        
        // Automatically dismiss celebration after 10 seconds
        setTimeout(() => {
          setIsCelebrating(false);
        }, 10000);
      }
      
      // Refresh complete data since the next milestone would have changed
      fetchMilestoneData();
    };

    // Subscribe to milestone updates
    socket.on('market:milestone_reached', handleMilestoneReached);

    // Cleanup subscription
    return () => {
      socket.off('market:milestone_reached', handleMilestoneReached);
    };
  }, [socket, connected, milestones, fetchMilestoneData]);

  return {
    currentMarketCap,
    milestones,
    nextMilestone,
    isLoading,
    error,
    isCelebrating,
    celebratedMilestone,
    dismissCelebration: () => setIsCelebrating(false),
    refresh: fetchMilestoneData
  };
}

/**
 * Hook for fetching and managing transaction feed data
 */
export function useTransactionFeed(initialFilter: string = 'all') {
  const [transactions, setTransactions] = useState<MarketTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState(initialFilter);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const { socket, connected } = useWebSocketContext();

  // Fetch transaction data
  const fetchTransactions = useCallback(async (resetPage: boolean = false) => {
    try {
      const currentPage = resetPage ? 1 : page;
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.get<{ 
        transactions: MarketTransaction[],
        pagination: {
          total: number,
          limit: number,
          offset: number
        }
      }>(`/api/v1/market/transactions?type=${filter}&limit=10&offset=${(currentPage - 1) * 10}`);
      
      if (resetPage) {
        setTransactions(response.data.transactions);
        setPage(1);
      } else {
        setTransactions(prev => [...prev, ...response.data.transactions]);
      }
      
      // Check if there are more transactions to load
      const { total, limit, offset } = response.data.pagination;
      setHasMore(offset + limit < total);
      
      if (!resetPage) {
        setPage(currentPage + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter, page]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
    fetchTransactions(true); // Reset pagination when filter changes
  }, [fetchTransactions]);

  // Load more transactions
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchTransactions();
    }
  }, [fetchTransactions, isLoading, hasMore]);

  // Fetch data on initial load and filter change
  useEffect(() => {
    fetchTransactions(true);
  }, [filter]);

  // Listen for real-time transaction updates
  useEffect(() => {
    if (!socket || !connected) return;

    // Handler for new transaction events
    const handleNewTransaction = (data: MarketTransaction) => {
      // Add transaction to list if it matches the current filter
      if (filter === 'all' || data.type === filter) {
        setTransactions(prev => [data, ...prev]);
      }
    };

    // Subscribe to transaction updates
    socket.on('market:new_transaction', handleNewTransaction);

    // Cleanup subscription
    return () => {
      socket.off('market:new_transaction', handleNewTransaction);
    };
  }, [socket, connected, filter]);

  return {
    transactions,
    isLoading,
    error,
    filter,
    hasMore,
    setFilter: handleFilterChange,
    loadMore,
    refresh: () => fetchTransactions(true)
  };
}

/**
 * Hook for fetching and managing market statistics
 */
export function useMarketStats() {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch market statistics
  const fetchMarketStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<{
        stats: MarketStats,
        lastUpdated: string
      }>('/api/v1/market/stats');
      
      setStats(response.data.stats);
      setLastUpdated(response.data.lastUpdated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch market statistics'));
      console.error('Error fetching market statistics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on initial load
  useEffect(() => {
    fetchMarketStats();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchMarketStats();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [fetchMarketStats]);

  return {
    stats,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchMarketStats
  };
}

/**
 * Hook for fetching and managing token supply data
 */
export function useTokenSupply() {
  const [totalSupply, setTotalSupply] = useState(0);
  const [circulatingSupply, setCirculatingSupply] = useState(0);
  const [burned, setBurned] = useState(0);
  const [allocations, setAllocations] = useState<TokenAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch token supply data
  const fetchTokenSupply = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<{
        totalSupply: number,
        circulatingSupply: number,
        burned: number,
        allocations: TokenAllocation[]
      }>('/api/v1/market/supply');
      
      setTotalSupply(response.data.totalSupply);
      setCirculatingSupply(response.data.circulatingSupply);
      setBurned(response.data.burned);
      setAllocations(response.data.allocations);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch token supply data'));
      console.error('Error fetching token supply data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on initial load
  useEffect(() => {
    fetchTokenSupply();
  }, [fetchTokenSupply]);

  return {
    totalSupply,
    circulatingSupply,
    burned,
    allocations,
    isLoading,
    error,
    refresh: fetchTokenSupply
  };
}

/**
 * Hook for managing market alerts
 */
export function useMarketAlerts() {
  const [preferences, setPreferences] = useState<AlertPreferences>({
    enabledAlerts: ['milestone_reached', 'price_movement'],
    customThresholds: {
      priceMovement: 5, // 5% price movement
      volumeSpike: 50 // 50% volume increase
    },
    notificationMethods: {
      inApp: true,
      email: false,
      push: false
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch alert preferences
  const fetchAlertPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<AlertPreferences>('/api/v1/market/alerts/preferences');
      setPreferences(response.data);
    } catch (err) {
      // If the endpoint doesn't exist yet, use defaults silently
      if (!(err instanceof Error) || !err.message.includes('404')) {
        setError(err instanceof Error ? err : new Error('Failed to fetch alert preferences'));
        console.error('Error fetching alert preferences:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update alert preferences
  const updateAlertPreferences = useCallback(async (newPreferences: Partial<AlertPreferences>) => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.put<{ success: boolean }>('/api/v1/market/alerts/preferences', {
        data: { ...preferences, ...newPreferences }
      });
      setPreferences(prev => ({ ...prev, ...newPreferences }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update alert preferences'));
      console.error('Error updating alert preferences:', err);
      throw err; // Re-throw to allow handling by the caller
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  // Toggle a specific alert type
  const toggleAlert = useCallback(async (alertType: AlertType) => {
    const isEnabled = preferences.enabledAlerts.includes(alertType);
    const newEnabledAlerts = isEnabled
      ? preferences.enabledAlerts.filter(type => type !== alertType)
      : [...preferences.enabledAlerts, alertType];
    
    await updateAlertPreferences({ enabledAlerts: newEnabledAlerts });
  }, [preferences, updateAlertPreferences]);

  // Fetch data on initial load
  useEffect(() => {
    fetchAlertPreferences();
  }, [fetchAlertPreferences]);

  return {
    preferences,
    isLoading,
    error,
    updateAlertPreferences,
    toggleAlert,
    refresh: fetchAlertPreferences
  };
}

/**
 * Hook for fetching all market data in one call
 */
export function useCompleteMarketData() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch complete market data
  const fetchMarketData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<MarketData>('/api/v1/market/data');
      setMarketData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch market data'));
      console.error('Error fetching market data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on initial load
  useEffect(() => {
    fetchMarketData();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchMarketData();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  return {
    marketData,
    isLoading,
    error,
    refresh: fetchMarketData
  };
}
