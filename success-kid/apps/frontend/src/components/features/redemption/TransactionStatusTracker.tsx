'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { formatWalletAddress, getTransactionExplorerUrl } from '@/lib/walletService';
import { timeAgo } from '@/lib/utils';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface TransactionDetails {
  id: string;
  pointsAmount: number;
  tokenAmount: number;
  recipientAddress: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  transactionHash?: string;
  errorMessage?: string;
  steps?: {
    verification: 'pending' | 'completed' | 'failed';
    tokenTransfer: 'pending' | 'completed' | 'failed';
    confirmation: 'pending' | 'completed' | 'failed';
  };
}

export interface TransactionStatusTrackerProps {
  transactionId: string;
  onStatusChange?: (status: TransactionStatus) => void;
  autoRefresh?: boolean;
  pollingInterval?: number;
  onClose?: () => void;
  initialData?: TransactionDetails;
}

export function TransactionStatusTracker({
  transactionId,
  onStatusChange,
  autoRefresh = true,
  pollingInterval = 5000, // 5 seconds
  onClose,
  initialData
}: TransactionStatusTrackerProps) {
  const [details, setDetails] = useState<TransactionDetails | null>(initialData || null);
  const [isPolling, setIsPolling] = useState<boolean>(autoRefresh);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch status from API
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // In production, this would be a real API call
      // For now, simulate response with different statuses based on elapsed time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock statuses for demonstration
      let mockStatus: TransactionStatus = 'pending';
      let mockHash: string | undefined = undefined;
      let mockSteps = {
        verification: 'pending' as const,
        tokenTransfer: 'pending' as const,
        confirmation: 'pending' as const
      };
      
      if (elapsedTime > 3000) {
        mockStatus = 'processing';
        mockSteps.verification = 'completed';
        mockSteps.tokenTransfer = 'processing';
      }
      
      if (elapsedTime > 15000) {
        mockStatus = 'completed';
        mockSteps.verification = 'completed';
        mockSteps.tokenTransfer = 'completed';
        mockSteps.confirmation = 'completed';
        mockHash = '3xR7vKpC4WjXKDBSEedrGQNaqzQXfZJnRGpSKQLxmLPGbpQ4AZ8QJTkVMBQpnqoK1bHUGEWjvYKGNMoFRZtPrw5d';
      }
      
      // Small chance of failure for demo purposes
      if (Math.random() < 0.01) {
        mockStatus = 'failed';
        mockSteps.verification = 'completed';
        mockSteps.tokenTransfer = 'failed';
      }
      
      const mockData: TransactionDetails = {
        id: transactionId,
        pointsAmount: initialData?.pointsAmount || 1000,
        tokenAmount: initialData?.tokenAmount || 10,
        recipientAddress: initialData?.recipientAddress || '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
        status: mockStatus,
        createdAt: initialData?.createdAt || new Date(Date.now() - elapsedTime).toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: mockStatus === 'completed' ? new Date().toISOString() : undefined,
        transactionHash: mockHash,
        errorMessage: mockStatus === 'failed' ? 'Transaction failed due to network congestion.' : undefined,
        steps: mockSteps
      };
      
      setDetails(mockData);
      
      // Notify of status change
      if (onStatusChange && mockData.status !== details?.status) {
        onStatusChange(mockData.status);
      }
      
      // Stop polling if in final state
      if (mockData.status === 'completed' || mockData.status === 'failed') {
        setIsPolling(false);
      }
      
      setIsLoading(false);
      setError(null);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction status');
      
      // Exponential backoff for retries could be implemented here
      console.error('Error fetching transaction status:', err);
    }
  }, [transactionId, elapsedTime, details?.status, onStatusChange, initialData]);
  
  // Set up polling
  useEffect(() => {
    if (isPolling) {
      const intervalId = setInterval(() => {
        fetchStatus();
        setElapsedTime(prev => prev + pollingInterval);
      }, pollingInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [isPolling, fetchStatus, pollingInterval]);
  
  // Initial fetch
  useEffect(() => {
    if (!initialData) {
      fetchStatus();
    }
    
    // Start elapsed time counter from 0
    setElapsedTime(0);
    
    // Cleanup
    return () => setIsPolling(false);
  }, [transactionId, fetchStatus, initialData]);
  
  // Format time elapsed for display
  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${seconds} seconds`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Get steps for display
  const getProcessingSteps = (): ProcessingStep[] => {
    if (!details || !details.steps) return [];
    
    return [
      {
        id: 'verification',
        label: 'Verification',
        status: details.steps.verification
      },
      {
        id: 'tokenTransfer',
        label: 'Token Transfer',
        status: details.steps.tokenTransfer
      },
      {
        id: 'confirmation',
        label: 'Confirmation',
        status: details.steps.confirmation
      }
    ];
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    fetchStatus();
  };
  
  // Render transaction detail row
  const renderDetailRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span>{value}</span>
    </div>
  );
  
  // Loading state
  if (isLoading && !details) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex h-40 items-center justify-center">
            <div className="text-center">
              <Spinner size="lg" className="mx-auto mb-4" />
              <p className="text-muted-foreground">Loading transaction details...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error && !details) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <div className="rounded-full bg-red-50 p-3 text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-4 text-red-500">Error: {error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!details) {
    return null;
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Transaction Status</CardTitle>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Status Banner */}
          <div className={`rounded-lg border p-4 ${
            details.status === 'completed' ? 'border-success bg-success/5' 
              : details.status === 'failed' ? 'border-red-200 bg-red-50'
              : 'border-amber-200 bg-amber-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${
                details.status === 'completed' ? 'bg-success/20 text-success' 
                  : details.status === 'failed' ? 'bg-red-100 text-red-500'
                  : 'bg-amber-100 text-amber-600'
              }`}>
                {details.status === 'completed' ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : details.status === 'failed' ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <Spinner size="sm" className="h-5 w-5" />
                )}
              </div>
              
              <div>
                <h3 className="font-medium">
                  {details.status === 'completed' ? 'Transaction Complete' 
                    : details.status === 'failed' ? 'Transaction Failed'
                    : details.status === 'processing' ? 'Processing Transaction'
                    : 'Pending Transaction'
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  {details.status === 'completed' ? `Completed ${timeAgo(new Date(details.completedAt!))}` 
                    : details.status === 'failed' ? details.errorMessage || 'Transaction could not be completed.'
                    : details.status === 'processing' ? `Processing for ${formatElapsedTime(elapsedTime)}`
                    : 'Waiting to be processed'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Processing Steps (only show if not complete or failed) */}
          {(details.status === 'pending' || details.status === 'processing') && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Processing Steps</h3>
              
              <div className="space-y-3">
                {getProcessingSteps().map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      step.status === 'completed' ? 'bg-success text-white' 
                        : step.status === 'processing' ? 'bg-primary text-white'
                        : step.status === 'failed' ? 'bg-red-500 text-white'
                        : 'bg-neutral-200 text-neutral-500'
                    }`}>
                      {step.status === 'completed' ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : step.status === 'processing' ? (
                        <Spinner size="sm" className="h-3 w-3" />
                      ) : step.status === 'failed' ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{step.label}</span>
                        <span className={`text-xs ${
                          step.status === 'completed' ? 'text-success' 
                            : step.status === 'processing' ? 'text-primary'
                            : step.status === 'failed' ? 'text-red-500'
                            : 'text-neutral-500'
                        }`}>
                          {step.status === 'completed' ? 'Complete' 
                            : step.status === 'processing' ? 'Processing...'
                            : step.status === 'failed' ? 'Failed'
                            : 'Pending'
                          }
                        </span>
                      </div>
                      
                      {index < getProcessingSteps().length - 1 && (
                        <div className="ml-3 mt-1 h-4 border-l-2 border-neutral-200"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Started {timeAgo(new Date(details.createdAt))}</span>
                <span>Elapsed: {formatElapsedTime(elapsedTime)}</span>
              </div>
            </div>
          )}
          
          {/* Transaction Details */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Transaction Details</h3>
            <div className="rounded-lg border p-4 text-sm">
              {renderDetailRow("Transaction ID", <span className="font-mono">{details.id}</span>)}
              {renderDetailRow("Points Amount", <span className="font-mono">{details.pointsAmount} SP</span>)}
              {renderDetailRow("Token Amount", <span className="font-mono">{details.tokenAmount} SKC</span>)}
              {renderDetailRow("Recipient", <span className="font-mono">{formatWalletAddress(details.recipientAddress)}</span>)}
              
              {details.transactionHash && renderDetailRow(
                "Transaction Hash", 
                <a 
                  href={getTransactionExplorerUrl(details.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:text-primary-600"
                >
                  View
                  <svg className="ml-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
              )}
              
              {renderDetailRow(
                "Created", 
                <span>{new Date(details.createdAt).toLocaleString()}</span>
              )}
              
              {details.completedAt && renderDetailRow(
                "Completed", 
                <span>{new Date(details.completedAt).toLocaleString()}</span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3">
            {(details.status === 'pending' || details.status === 'processing') && (
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Refresh Status
              </Button>
            )}
            
            {details.status === 'failed' && (
              <Button variant="outline" onClick={onClose} size="sm">
                Close
              </Button>
            )}
            
            {details.transactionHash && (
              <Button
                as="a"
                href={getTransactionExplorerUrl(details.transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="sm"
              >
                View on Explorer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
