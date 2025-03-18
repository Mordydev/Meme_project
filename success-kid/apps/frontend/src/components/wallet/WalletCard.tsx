'use client';

import React, { useState } from 'react';
import { useWalletContext } from '@/components/providers/WalletProvider';
import { VerificationPrompt } from './VerificationPrompt';
import { ConnectWalletButton } from './ConnectWalletButton';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatRelativeTime } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export interface WalletCardProps {
  className?: string;
  showActions?: boolean;
  showBalance?: boolean;
  onConnected?: () => void;
  onVerified?: () => void;
}

export function WalletCard({ 
  className, 
  showActions = true,
  showBalance = true,
  onConnected,
  onVerified
}: WalletCardProps) {
  const { 
    wallet, 
    isConnecting, 
    formatAddress, 
    refreshBalance,
    error
  } = useWalletContext();
  
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  const handleRefreshBalance = async () => {
    if (!wallet) return;
    
    setIsUpdatingBalance(true);
    try {
      await refreshBalance();
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setIsUpdatingBalance(false);
    }
  };
  
  const handleCopyAddress = () => {
    if (!wallet) return;
    
    navigator.clipboard.writeText(wallet.account.address);
    setIsCopied(true);
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  const handleVerificationComplete = (success: boolean) => {
    if (success && onVerified) {
      onVerified();
    }
  };
  
  const handleConnectSuccess = () => {
    if (onConnected) {
      onConnected();
    }
  };
  
  // Not connected state
  if (!wallet || !wallet.isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Connect your wallet to view balance and redeem points
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-neutral-600 mb-4">
            Connecting your wallet enables you to:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start gap-2 text-sm">
              <svg className="mt-1 h-3.5 w-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Track your token balance</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <svg className="mt-1 h-3.5 w-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>View transaction history</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <svg className="mt-1 h-3.5 w-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Redeem Success Points for tokens</span>
            </li>
          </ul>
          
          {error && (
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </CardContent>
        <CardFooter>
          <ConnectWalletButton
            onSuccess={handleConnectSuccess}
            size="lg"
            className="w-full"
          />
        </CardFooter>
      </Card>
    );
  }
  
  // Connected but not verified
  if (!wallet.isVerified) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connected Wallet</span>
            {showActions && (
              <ConnectWalletButton 
                variant="ghost" 
                size="sm"
                label="Disconnect"
                showIcon={false}
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center mb-4">
            <Wallet className="mr-2 h-5 w-5 text-neutral-500" />
            <div className="flex items-center">
              <span className="font-mono text-sm">{formatAddress(wallet.account.address)}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 ml-2"
                      onClick={handleCopyAddress}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4 text-neutral-500" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isCopied ? 'Copied!' : 'Copy Address'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <VerificationPrompt 
            onComplete={handleVerificationComplete}
            className="mb-4"
          />
          
          {showBalance && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                <span>Token Balance</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleRefreshBalance}
                        disabled={isUpdatingBalance}
                      >
                        {isUpdatingBalance ? (
                          <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                        ) : (
                          <RefreshCw className="h-4 w-4 text-neutral-500" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh Balance</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              <div className="bg-neutral-50 p-3 rounded-md">
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-mono font-semibold">
                    {wallet.balance?.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                  <span className="text-sm text-neutral-500 mb-1">SKC</span>
                </div>
                {wallet.balance?.usdValue !== undefined && (
                  <div className="text-sm text-neutral-500 mt-1">
                    ≈ ${wallet.balance.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                )}
                <div className="text-xs text-neutral-400 mt-1">
                  Last updated {formatRelativeTime(wallet.balance?.lastUpdated || new Date())}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Connected and verified
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Connected Wallet</span>
          {showActions && (
            <ConnectWalletButton 
              variant="ghost" 
              size="sm"
              label="Disconnect"
              showIcon={false}
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Wallet className="mr-2 h-5 w-5 text-neutral-500" />
          <div className="flex items-center">
            <span className="font-mono text-sm">{formatAddress(wallet.account.address)}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 ml-2"
                    onClick={handleCopyAddress}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 text-neutral-500" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isCopied ? 'Copied!' : 'Copy Address'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <a
              href={`https://solscan.io/account/${wallet.account.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-4 w-4 text-neutral-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View on Solscan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </a>
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          <VerificationPrompt compact />
        </div>
        
        {showBalance && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
              <span>Token Balance</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={handleRefreshBalance}
                      disabled={isUpdatingBalance}
                    >
                      {isUpdatingBalance ? (
                        <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                      ) : (
                        <RefreshCw className="h-4 w-4 text-neutral-500" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh Balance</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <div className="bg-neutral-50 p-3 rounded-md">
              <div className="flex items-end gap-2">
                <span className="text-2xl font-mono font-semibold">
                  {wallet.balance?.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </span>
                <span className="text-sm text-neutral-500 mb-1">SKC</span>
              </div>
              {wallet.balance?.usdValue !== undefined && (
                <div className="text-sm text-neutral-500 mt-1">
                  ≈ ${wallet.balance.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </div>
              )}
              <div className="text-xs text-neutral-400 mt-1">
                Last updated {formatRelativeTime(wallet.balance?.lastUpdated || new Date())}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
