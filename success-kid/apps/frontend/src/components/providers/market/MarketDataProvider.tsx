'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  usePriceData, 
  useMarketStats, 
  useMilestoneData,
  PriceData,
  MarketStats,
  MilestoneData
} from '@/hooks/useMarketData';
import { format } from 'date-fns';

interface MarketAlert {
  id: string;
  type: 'price' | 'milestone' | 'transaction' | 'system';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
  isRead: boolean;
}

interface MarketDataContextType {
  // Real-time updates
  currentPrice: number | null;
  priceChange24h: number | null;
  priceChangePercent24h: number | null;
  lastUpdated: string | null;
  
  // Market alerts
  alerts: MarketAlert[];
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;
  
  // Connection status
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  
  // Formatting utilities
  formatPrice: (price: number) => string;
  formatNumber: (num: number) => string;
  formatPercentage: (percentage: number) => string;
}

// Create context with default values
const MarketDataContext = createContext<MarketDataContextType>({
  currentPrice: null,
  priceChange24h: null,
  priceChangePercent24h: null,
  lastUpdated: null,
  
  alerts: [],
  dismissAlert: () => {},
  clearAllAlerts: () => {},
  
  isConnected: false,
  connectionStatus: 'disconnected',
  
  formatPrice: () => '',
  formatNumber: () => '',
  formatPercentage: () => '',
});

interface MarketDataProviderProps {
  children: ReactNode;
}

export const MarketDataProvider: React.FC<MarketDataProviderProps> = ({ children }) => {
  // Fetch initial data
  const { data: priceData } = usePriceData();
  const { data: marketStats } = useMarketStats();
  const { data: milestoneData } = useMilestoneData();
  
  // State for real-time data
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [priceChangePercent24h, setPriceChangePercent24h] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // State for alerts
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  
  // WebSocket state
  const { isConnected, connectionStatus, lastMessage } = useWebSocket('/api/ws/market');
  
  // Update state when initial data is loaded
  useEffect(() => {
    if (priceData?.data) {
      setCurrentPrice(priceData.data.basePrice);
      setPriceChange24h(priceData.data.priceChange);
      setPriceChangePercent24h(priceData.data.priceChangePercent);
      setLastUpdated(priceData.data.lastUpdated);
    }
  }, [priceData]);
  
  // Handle real-time updates from WebSocket
  useEffect(() => {
    if (lastMessage && typeof lastMessage === 'string') {
      try {
        const data = JSON.parse(lastMessage);
        
        // Handle different message types
        if (data.type === 'market:price_update') {
          setCurrentPrice(data.data.price);
          setPriceChange24h(data.data.priceChange);
          setPriceChangePercent24h(data.data.priceChangePercent);
          setLastUpdated(data.data.timestamp);
          
          // Add alert for significant price changes (more than 5%)
          if (Math.abs(data.data.priceChangePercent) > 5) {
            const direction = data.data.priceChangePercent > 0 ? 'up' : 'down';
            addAlert({
              type: 'price',
              title: `Price ${direction === 'up' ? 'Surge' : 'Drop'} Alert`,
              message: `SKC price moved ${direction} by ${Math.abs(data.data.priceChangePercent).toFixed(2)}% in the last 24 hours`,
              data: {
                price: data.data.price,
                changePercent: data.data.priceChangePercent
              }
            });
          }
        } 
        else if (data.type === 'market:milestone_reached') {
          // Add milestone reached alert
          addAlert({
            type: 'milestone',
            title: 'Market Cap Milestone Reached!',
            message: `We've just reached the ${data.data.label} milestone with a market cap of $${formatNumber(data.data.value)}`,
            data: data.data
          });
        }
        else if (data.type === 'market:new_transaction') {
          // Only alert for significant transactions
          if (data.data.isSignificant) {
            const txType = data.data.type.charAt(0).toUpperCase() + data.data.type.slice(1);
            const formattedAmount = formatNumber(data.data.amount);
            addAlert({
              type: 'transaction',
              title: `Significant ${txType} Transaction`,
              message: `${txType} transaction of ${formattedAmount} SKC detected`,
              data: data.data
            });
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);
  
  // Add a new alert
  const addAlert = (alert: Omit<MarketAlert, 'id' | 'timestamp' | 'isRead'>) => {
    const newAlert: MarketAlert = {
      ...alert,
      id: `alert_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    setAlerts(prev => [newAlert, ...prev].slice(0, 10)); // Keep only the last 10 alerts
  };
  
  // Dismiss an alert
  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isRead: true } : alert
    ));
  };
  
  // Clear all alerts
  const clearAllAlerts = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  };
  
  // Formatting utilities
  const formatPrice = (price: number) => {
    if (price < 0.00001) return price.toFixed(8);
    if (price < 0.0001) return price.toFixed(7);
    if (price < 0.001) return price.toFixed(6);
    if (price < 0.01) return price.toFixed(5);
    if (price < 0.1) return price.toFixed(4);
    if (price < 1) return price.toFixed(3);
    return price.toFixed(2);
  };
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };
  
  // Context value
  const contextValue: MarketDataContextType = {
    // Real-time data
    currentPrice,
    priceChange24h,
    priceChangePercent24h,
    lastUpdated,
    
    // Alerts
    alerts: alerts.filter(alert => !alert.isRead),
    dismissAlert,
    clearAllAlerts,
    
    // Connection
    isConnected,
    connectionStatus,
    
    // Formatting utilities
    formatPrice,
    formatNumber,
    formatPercentage,
  };
  
  return (
    <MarketDataContext.Provider value={contextValue}>
      {children}
    </MarketDataContext.Provider>
  );
};

// Hook for using the market data context
export const useMarketData = () => useContext(MarketDataContext);
