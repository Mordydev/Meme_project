'use client';

import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clipboard, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MarketTransaction } from '@/types';
import { formatCurrency, formatNumber, getRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motion } from 'framer-motion';

interface TransactionModalProps {
  transaction: MarketTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

interface AddressDisplayProps {
  address: string;
  label?: string;
  className?: string;
}

/**
 * AddressDisplay Component
 * 
 * Displays a blockchain address with copy and link functionality.
 */
function AddressDisplay({ address, label, className }: AddressDisplayProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: 'Address copied',
      description: 'The address has been copied to your clipboard',
      variant: 'success',
      duration: 3000,
    });
  };
  
  const handleExplore = () => {
    window.open(`https://solscan.io/address/${address}`, '_blank');
  };
  
  // Format address for display (abbreviated)
  const displayAddress = address.length > 12
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;
  
  return (
    <div className={cn("flex flex-col", className)}>
      {label && (
        <span className="text-sm text-neutral-500 mb-1">{label}</span>
      )}
      <div className="flex items-center">
        <span className="font-mono text-sm">{displayAddress}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-1 h-6 w-6 p-0" 
          onClick={handleCopy}
          aria-label="Copy address"
        >
          <Clipboard className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-1 h-6 w-6 p-0" 
          onClick={handleExplore}
          aria-label="View on explorer"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * TransactionModal Component
 * 
 * Displays detailed transaction information in a modal dialog.
 */
export default function TransactionModal({ transaction, isOpen, onClose }: TransactionModalProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Calculate transaction value in USD
  const getTransactionValue = () => {
    if (!transaction) return '$0.00';
    return formatCurrency(transaction.amount * transaction.price);
  };
  
  // Generate transaction type badge
  const getTransactionBadge = () => {
    if (!transaction) return null;
    
    const isBuy = transaction.type === 'buy';
    const color = isBuy ? 'accent' : 'destructive';
    const icon = isBuy ? ArrowDownRight : ArrowUpRight;
    
    return (
      <Badge variant={color as any} className="px-2 py-1 text-white gap-1">
        {!prefersReducedMotion && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {icon && React.createElement(icon, { className: "h-3.5 w-3.5" })}
          </motion.span>
        )}
        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
      </Badge>
    );
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Transaction Details</DialogTitle>
            {getTransactionBadge()}
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          {/* Transaction Summary */}
          <div className="flex flex-col gap-1 border-b pb-4">
            <div className="text-2xl font-bold">
              {formatNumber(transaction.amount)} SKC
            </div>
            <div className="text-neutral-500">
              {getTransactionValue()} • {getRelativeTime(transaction.timestamp)}
            </div>
          </div>
          
          {/* Transaction Details */}
          <div className="space-y-4">
            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AddressDisplay 
                address={transaction.fromAddress} 
                label="From" 
              />
              <AddressDisplay 
                address={transaction.toAddress} 
                label="To" 
              />
            </div>
            
            {/* Price & Fee Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b py-4">
              <div>
                <span className="text-sm text-neutral-500">Price</span>
                <div className="font-medium">{formatCurrency(transaction.price)}</div>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Network Fee</span>
                <div className="font-medium">{formatCurrency(transaction.fee || 0.0005)} SOL</div>
              </div>
            </div>
            
            {/* Transaction Hash */}
            <div>
              <span className="text-sm text-neutral-500">Transaction Hash</span>
              <AddressDisplay 
                address={transaction.txHash} 
                className="mt-1"
              />
            </div>
            
            {/* Block Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-neutral-500">Block</span>
                <div className="font-medium">{formatNumber(transaction.blockNumber || 0)}</div>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Confirmations</span>
                <div className="font-medium">{formatNumber(transaction.confirmations || 0)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={() => window.open(`https://solscan.io/tx/${transaction.txHash}`, '_blank')}
          >
            View on Explorer
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
