'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber, getValueColorClass } from '@/lib/format';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, Clipboard, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface WalletSummaryProps {
  balance: number;
  value: number;
  profitLoss: number;
  profitLossPercentage: number;
  walletAddress: string;
  className?: string;
}

/**
 * WalletSummary Component
 * 
 * Displays a summary of wallet holdings and performance.
 */
export default function WalletSummary({
  balance,
  value,
  profitLoss,
  profitLossPercentage,
  walletAddress,
  className
}: WalletSummaryProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Format wallet address for display
  const displayAddress = walletAddress.length > 12
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : walletAddress;
  
  // Handle copy wallet address
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: 'Address copied',
      description: 'Your wallet address has been copied to the clipboard',
      variant: 'success',
      duration: 3000,
    });
  };
  
  // Handle view on explorer
  const handleViewOnExplorer = () => {
    window.open(`https://solscan.io/address/${walletAddress}`, '_blank');
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Wallet Address */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm text-neutral-500 mr-2">Wallet:</span>
          <span className="font-mono text-sm">{displayAddress}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-1 h-6 w-6 p-0" 
            onClick={handleCopyAddress}
            aria-label="Copy address"
          >
            <Clipboard className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-1 h-6 w-6 p-0" 
            onClick={handleViewOnExplorer}
            aria-label="View on explorer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary-600 hover:bg-primary-100"
          onClick={() => window.location.href = '/rewards'}
        >
          Redeem Points
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Token Balance */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 mb-1">Token Balance</h3>
          <motion.div 
            className="text-2xl font-bold"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {formatNumber(balance)} SKC
          </motion.div>
        </Card>
        
        {/* Current Value */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 mb-1">Current Value</h3>
          <motion.div 
            className="text-2xl font-bold"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {formatCurrency(value)}
          </motion.div>
        </Card>
        
        {/* Profit/Loss */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 mb-1">Profit/Loss</h3>
          <motion.div 
            className={cn(
              "text-2xl font-bold flex items-center",
              getValueColorClass(profitLoss)
            )}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {profitLoss >= 0 ? (
              <ArrowUpRight className="mr-1 h-5 w-5" />
            ) : (
              <ArrowDownRight className="mr-1 h-5 w-5" />
            )}
            {formatCurrency(Math.abs(profitLoss))}
            <span className="text-base ml-2">
              ({profitLoss >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%)
            </span>
          </motion.div>
        </Card>
      </div>
    </div>
  );
}
