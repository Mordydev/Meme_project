'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useOffline } from './OfflineProvider';

export interface OfflineStorageProps {
  children: ReactNode;
  storageKey: string;
  onQuotaExceeded?: () => void;
  className?: string;
  storageIndicator?: boolean;
  storageWarningThreshold?: number;
  customStorageIndicator?: (storageInfo: { used: number, quota: number, percentage: number }) => ReactNode;
}

/**
 * Component that manages offline data storage and provides visualizations
 * of storage usage and warnings.
 */
export const OfflineStorage: React.FC<OfflineStorageProps> = ({
  children,
  storageKey,
  onQuotaExceeded,
  className,
  storageIndicator = false,
  storageWarningThreshold = 85, // Show warning when storage is 85% full
  customStorageIndicator,
}) => {
  const { storage, storeData, retrieveData, removeData } = useOffline();
  const { available, used, quota, percentage } = storage;
  
  // Show storage warning if usage exceeds threshold
  const showStorageWarning = available && percentage > storageWarningThreshold;
  
  // Format bytes to human-readable size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  return (
    <div className={cn('offline-storage', className)}>
      {/* Storage indicator */}
      {storageIndicator && available && (
        <div>
          {customStorageIndicator ? (
            customStorageIndicator({ used, quota, percentage })
          ) : (
            <div className="mb-4 bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Storage Usage</div>
                <div className="text-sm text-gray-500">
                  {formatBytes(used)} / {formatBytes(quota)} ({percentage.toFixed(1)}%)
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full",
                    percentage > 90 ? "bg-red-500" : 
                    percentage > 75 ? "bg-amber-500" : 
                    "bg-green-500"
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              
              {/* Storage warning */}
              {showStorageWarning && (
                <div className="mt-2 text-xs text-amber-600">
                  <svg className="inline-block h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Storage is nearly full. Some offline features may be limited.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Main content */}
      {children}
    </div>
  );
};

export default OfflineStorage;