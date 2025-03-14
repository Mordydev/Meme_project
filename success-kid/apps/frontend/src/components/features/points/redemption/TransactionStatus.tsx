'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TransactionDetails {
  transactionId: string;
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

interface TransactionStatusProps {
  transactionId: string;
  onStatusChange?: (status: TransactionStatus) => void;
  autoRefresh?: boolean;
  initialData?: TransactionDetails;
  className?: string;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  transactionId,
  onStatusChange,
  autoRefresh = true,
  initialData,
  className,
}) => {
  const [transaction, setTransaction] = useState<TransactionDetails | null>(initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isPolling, setIsPolling] = useState<boolean>(autoRefresh);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch transaction status
  const fetchTransactionStatus = async () => {
    try {
      setIsLoading(true);
      
      // This would be a real API call in production
      // const response = await apiClient.get(`/api/v1/redemption/transactions/${transactionId}`);
      // const data = response.data;
      
      // Mock implementation with staged status changes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let mockData: TransactionDetails;
      
      if (transaction) {
        // Simulate transaction progress
        const currentStatus = transaction.status;
        let newStatus: TransactionStatus = currentStatus;
        
        if (elapsedTime < 5) {
          newStatus = 'pending';
        } else if (elapsedTime < 10) {
          newStatus = 'processing';
        } else if (elapsedTime < 15) {
          newStatus = 'completed';
        }
        
        // Simulate steps progress
        const steps = {
          verification: elapsedTime >= 3 ? 'completed' : 'pending',
          tokenTransfer: elapsedTime >= 7 ? 'completed' : elapsedTime >= 5 ? 'processing' : 'pending',
          confirmation: elapsedTime >= 12 ? 'completed' : elapsedTime >= 10 ? 'processing' : 'pending',
        } as TransactionDetails['steps'];
        
        // Build updated transaction data
        mockData = {
          ...transaction,
          status: newStatus,
          steps,
          updatedAt: new Date().toISOString(),
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
          transactionHash: newStatus === 'completed' ? '4qL9pWzD6RbJKFGvTfQnAZ5uXr3vNP5BnmKRwxJVdYtP8DgSJs2ZARXLKJe1RYqHnVhymgrD76iucN2N6xFUymAP' : undefined,
        };
      } else {
        // Initial data if not provided
        mockData = {
          transactionId,
          pointsAmount: 2500,
          tokenAmount: 25,
          recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
          status: 'pending',
          createdAt: new Date(Date.now() - 60000).toISOString(),
          updatedAt: new Date().toISOString(),
          steps: {
            verification: 'pending',
            tokenTransfer: 'pending',
            confirmation: 'pending',
          },
        };
      }
      
      setTransaction(mockData);
      
      // Call the status change callback if status changed
      if (onStatusChange && transaction?.status !== mockData.status) {
        onStatusChange(mockData.status);
      }
      
      // Stop polling if transaction is complete or failed
      if (mockData.status === 'completed' || mockData.status === 'failed') {
        setIsPolling(false);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching transaction status:', err);
      setError('Failed to fetch transaction status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up polling for transaction status
  useEffect(() => {
    // Initial fetch
    fetchTransactionStatus();
    
    let timer: number | undefined;
    let elapsed: number | undefined;
    
    if (isPolling) {
      // Set up polling interval (every 3 seconds)
      timer = window.setInterval(fetchTransactionStatus, 3000);
      
      // Set up elapsed time counter (every second)
      elapsed = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      // Clean up intervals on unmount
      if (timer) clearInterval(timer);
      if (elapsed) clearInterval(elapsed);
    };
  }, [isPolling, transactionId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Helper function to format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Function to format address for display
  const formatWalletAddress = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  if (isLoading && !transaction) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-neutral-500">Loading transaction details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-alert">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => {
                setError(null);
                setIsPolling(true);
                fetchTransactionStatus();
              }}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!transaction) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-neutral-500">
            <p>Transaction not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Transaction Status</CardTitle>
        <CardDescription>
          Track the status of your points redemption transaction
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            transaction.status === 'completed'
              ? 'bg-success-100 text-success-500'
              : transaction.status === 'failed'
              ? 'bg-alert-100 text-alert-500'
              : transaction.status === 'processing'
              ? 'bg-primary-100 text-primary-500'
              : 'bg-neutral-100 text-neutral-500'
          }`}>
            {transaction.status === 'completed' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : transaction.status === 'failed' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          
          <div>
            <h3 className="font-medium">
              {transaction.status === 'completed'
                ? 'Transaction Complete'
                : transaction.status === 'failed'
                ? 'Transaction Failed'
                : transaction.status === 'processing'
                ? 'Processing Transaction'
                : 'Pending Transaction'}
            </h3>
            <p className="text-sm text-neutral-500">
              {transaction.status === 'completed'
                ? `Completed at ${new Date(transaction.completedAt || '').toLocaleString()}`
                : transaction.status === 'failed'
                ? `Failed at ${new Date(transaction.updatedAt).toLocaleString()}`
                : `Started at ${new Date(transaction.createdAt).toLocaleString()} (${formatTime(elapsedTime)} elapsed)`}
            </p>
          </div>
        </div>
        
        {/* Transaction details */}
        <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-neutral-600">Transaction ID:</span>
            <span className="font-medium">{transaction.transactionId.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-neutral-600">Points Amount:</span>
            <span className="font-medium">{transaction.pointsAmount} SP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-neutral-600">Token Amount:</span>
            <span className="font-medium">{transaction.tokenAmount} SKC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-neutral-600">Recipient Wallet:</span>
            <span className="font-medium">{formatWalletAddress(transaction.recipientAddress)}</span>
          </div>
          {transaction.transactionHash && (
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Blockchain TX:</span>
              <a 
                href={`https://solscan.io/tx/${transaction.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                View on Explorer
              </a>
            </div>
          )}
        </div>
        
        {/* Processing steps */}
        {transaction.steps && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Processing Steps</h3>
            <ul className="space-y-4">
              {/* Verification step */}
              <li className="flex items-start">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                  transaction.steps.verification === 'completed'
                    ? 'bg-success-100 text-success-700'
                    : transaction.steps.verification === 'failed'
                    ? 'bg-alert-100 text-alert-700'
                    : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {transaction.steps.verification === 'completed' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : transaction.steps.verification === 'failed' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  ) : (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="font-medium">Verification</div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Verifying eligibility and points balance
                  </p>
                </div>
              </li>
              
              {/* Token Transfer step */}
              <li className="flex items-start">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                  transaction.steps.tokenTransfer === 'completed'
                    ? 'bg-success-100 text-success-700'
                    : transaction.steps.tokenTransfer === 'failed'
                    ? 'bg-alert-100 text-alert-700'
                    : transaction.steps.tokenTransfer === 'pending' && transaction.steps.verification !== 'completed'
                    ? 'bg-neutral-100 text-neutral-400'
                    : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {transaction.steps.tokenTransfer === 'completed' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : transaction.steps.tokenTransfer === 'failed' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  ) : transaction.steps.tokenTransfer === 'pending' && transaction.steps.verification !== 'completed' ? (
                    <span className="text-xs">2</span>
                  ) : (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="font-medium">Token Transfer</div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Transferring SKC tokens to your wallet
                  </p>
                </div>
              </li>
              
              {/* Confirmation step */}
              <li className="flex items-start">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                  transaction.steps.confirmation === 'completed'
                    ? 'bg-success-100 text-success-700'
                    : transaction.steps.confirmation === 'failed'
                    ? 'bg-alert-100 text-alert-700'
                    : transaction.steps.confirmation === 'pending' && transaction.steps.tokenTransfer !== 'completed'
                    ? 'bg-neutral-100 text-neutral-400'
                    : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {transaction.steps.confirmation === 'completed' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : transaction.steps.confirmation === 'failed' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  ) : transaction.steps.confirmation === 'pending' && transaction.steps.tokenTransfer !== 'completed' ? (
                    <span className="text-xs">3</span>
                  ) : (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="font-medium">Confirmation</div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Confirming transaction on the blockchain
                  </p>
                </div>
              </li>
            </ul>
          </div>
        )}
        
        {/* Error message if transaction failed */}
        {transaction.status === 'failed' && transaction.errorMessage && (
          <div className="bg-alert-50 border border-alert-200 p-4 rounded-lg">
            <h3 className="font-medium text-alert-700 mb-1">Error Details</h3>
            <p className="text-sm text-alert-600">{transaction.errorMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
