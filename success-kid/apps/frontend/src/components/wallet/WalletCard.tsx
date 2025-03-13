'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { 
  formatWalletAddress, 
  formatTokenAmount, 
  formatUSDAmount,
  getAddressExplorerUrl
} from '@/lib/walletService';
import { Button } from '@/components/ui/button';
import { TransactionHistory } from './TransactionHistory';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletCardProps {
  showBalance?: boolean;
  showActions?: boolean;
  showTransactions?: boolean;
  maxTransactions?: number;
}

export function WalletCard({
  showBalance = true,
  showActions = true,
  showTransactions = true,
  maxTransactions = 3,
}: WalletCardProps) {
  const { 
    wallet, 
    isConnected, 
    isVerified,
    isHolder,
    disconnect, 
    getTransactions,
    transactions,
    isLoadingTransactions
  } = useWallet();
  
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };
  
  const toggleTransactionsView = () => {
    setShowAllTransactions(!showAllTransactions);
    
    // Load transactions if we haven't already
    if (!transactions.length && !isLoadingTransactions) {
      getTransactions();
    }
  };
  
  const handleCopyAddress = () => {
    if (wallet?.account.address) {
      navigator.clipboard.writeText(wallet.account.address);
      setIsCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };
  
  const handleViewInExplorer = () => {
    if (wallet?.account.address) {
      window.open(getAddressExplorerUrl(wallet.account.address), '_blank');
    }
  };
  
  const handleDisconnect = async () => {
    await disconnect();
  };
  
  if (!isConnected || !wallet) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto mb-3 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="mb-1 text-lg font-medium text-gray-900">No Wallet Connected</h3>
            <p className="mb-4 text-sm text-gray-500">Connect your wallet to see your balance and transactions.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Your Wallet</h3>
        
        {isHolder && (
          <div className="rounded-full bg-success-50 px-3 py-1 text-sm font-medium text-success-700">
            Token Holder
          </div>
        )}
      </div>
      
      {/* Wallet Address */}
      <div className="mb-5 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
            <svg className="h-5 w-5 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center">
              <p className="font-mono text-sm text-gray-600">
                {formatWalletAddress(wallet.account.address)}
              </p>
              <button
                onClick={handleCopyAddress}
                className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Copy address"
              >
                {isCopied ? (
                  <svg className="h-4 w-4 text-success-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {isVerified ? 'Verified wallet' : 'Connected'}
            </p>
          </div>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={handleViewInExplorer}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="View in explorer"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Balance */}
      {showBalance && (
        <div className="mb-5 rounded-lg border border-gray-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Balance</h4>
            <button
              onClick={toggleBalanceVisibility}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label={isBalanceHidden ? 'Show balance' : 'Hide balance'}
            >
              {isBalanceHidden ? (
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-2xl font-semibold text-gray-900">
              {isBalanceHidden ? '••••••' : formatTokenAmount(wallet.balance.tokenAmount)} SKC
            </span>
            {wallet.balance.usdValue !== undefined && !isBalanceHidden && (
              <span className="text-sm text-gray-500">
                ({formatUSDAmount(wallet.balance.usdValue)})
              </span>
            )}
          </div>
          
          <p className="mt-1 text-xs text-gray-500">
            Last updated: {wallet.balance.lastUpdated.toLocaleString()}
          </p>
        </div>
      )}
      
      {/* Transactions */}
      {showTransactions && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Transactions</h4>
            <button
              onClick={toggleTransactionsView}
              className="text-xs font-medium text-primary hover:text-primary-600"
            >
              {showAllTransactions ? 'Show Less' : 'View All'}
            </button>
          </div>
          
          <AnimatePresence>
            {showAllTransactions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <TransactionHistory 
                  compact={false} 
                  maxTransactions={maxTransactions} 
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {!showAllTransactions && (
            <TransactionHistory 
              compact={true} 
              maxTransactions={maxTransactions} 
            />
          )}
        </div>
      )}
      
      {/* Actions */}
      {showActions && (
        <div className="mt-6 flex space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDisconnect}
            className="flex-1"
          >
            Disconnect Wallet
          </Button>
          <Button 
            size="sm" 
            onClick={handleViewInExplorer}
            className="flex-1"
          >
            View in Explorer
          </Button>
        </div>
      )}
    </div>
  );
}
