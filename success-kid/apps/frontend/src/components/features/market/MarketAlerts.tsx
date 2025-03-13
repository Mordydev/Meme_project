'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketData } from '@/components/providers/market';
import { format, formatDistanceToNow } from 'date-fns';

interface MarketAlertsProps {
  className?: string;
  maxVisible?: number;
}

export default function MarketAlerts({ className = '', maxVisible = 3 }: MarketAlertsProps) {
  const { alerts, dismissAlert, clearAllAlerts } = useMarketData();
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Auto-dismiss alerts after 10 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    alerts.forEach(alert => {
      const timer = setTimeout(() => {
        dismissAlert(alert.id);
      }, 10000);
      
      timers.push(timer);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [alerts, dismissAlert]);
  
  // No alerts to show
  if (alerts.length === 0) {
    return null;
  }
  
  // Format relative time for alerts
  const formatAlertTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'just now';
    }
  };
  
  // Get icon based on alert type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'price':
        return '📈';
      case 'milestone':
        return '🎉';
      case 'transaction':
        return '💰';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };
  
  // Get color based on alert type
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'price':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'milestone':
        return 'border-green-500 bg-green-50 dark:bg-green-900/10';
      case 'transaction':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-900/10';
      case 'system':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/10';
    }
  };
  
  // Visible alerts
  const visibleAlerts = isMinimized ? alerts.slice(0, 1) : alerts.slice(0, maxVisible);
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}>
      <AnimatePresence>
        {visibleAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              delay: 0.1 * index
            }}
            className={`mb-2 p-4 rounded-lg shadow-lg border-l-4 ${getAlertColor(alert.type)}`}
          >
            <div className="flex items-start">
              <div className="mr-3 text-2xl">{getAlertIcon(alert.type)}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{alert.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">{formatAlertTime(alert.timestamp)}</p>
              </div>
              <button 
                onClick={() => dismissAlert(alert.id)}
                className="ml-2 text-gray-500 hover:text-gray-700"
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Controls */}
      {alerts.length > 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-end mt-2"
        >
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="mr-2 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded px-2 py-1"
          >
            {isMinimized ? 'Show All' : 'Minimize'}
          </button>
          <button
            onClick={clearAllAlerts}
            className="text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded px-2 py-1"
          >
            Clear All
          </button>
        </motion.div>
      )}
    </div>
  );
}
