'use client';

import React from 'react';
import { DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { MarketTransaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

interface ExportControlsProps {
  transactions: MarketTransaction[];
  disabled?: boolean;
}

/**
 * ExportControls Component
 * 
 * Provides transaction export functionality in various formats.
 */
export default function ExportControls({ transactions, disabled }: ExportControlsProps) {
  
  // Export as CSV
  const exportCSV = () => {
    if (transactions.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no transactions to export.',
        variant: 'default',
        duration: 3000,
      });
      return;
    }
    
    try {
      // CSV header
      const headers = [
        'Date',
        'Type',
        'Amount',
        'Price',
        'Value',
        'From',
        'To',
        'Transaction Hash'
      ];
      
      // Format rows
      const rows = transactions.map(tx => [
        formatDate(tx.timestamp),
        tx.type,
        tx.amount.toString(),
        tx.price.toString(),
        (tx.amount * tx.price).toString(),
        tx.fromAddress,
        tx.toAddress,
        tx.txHash
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions-${formatDate(new Date().toISOString(), 'file')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export successful',
        description: 'Your transactions have been exported as CSV.',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your transactions.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };
  
  // Export as JSON
  const exportJSON = () => {
    if (transactions.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no transactions to export.',
        variant: 'default',
        duration: 3000,
      });
      return;
    }
    
    try {
      // Format data (exclude certain fields if needed)
      const data = transactions.map(tx => ({
        date: tx.timestamp,
        type: tx.type,
        amount: tx.amount,
        price: tx.price,
        value: tx.amount * tx.price,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        txHash: tx.txHash
      }));
      
      // Create download
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions-${formatDate(new Date().toISOString(), 'file')}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export successful',
        description: 'Your transactions have been exported as JSON.',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error exporting JSON:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your transactions.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };
  
  // Export for tax reporting
  const exportTaxReport = () => {
    if (transactions.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no transactions to generate a tax report.',
        variant: 'default',
        duration: 3000,
      });
      return;
    }
    
    try {
      // Headers for tax reporting
      const headers = [
        'Date',
        'Type',
        'Amount',
        'Price',
        'Value (USD)',
        'Fee (USD)',
        'Transaction Hash'
      ];
      
      // Format rows for tax reporting
      const rows = transactions.map(tx => [
        formatDate(tx.timestamp),
        tx.type.toUpperCase(),
        tx.amount.toString(),
        tx.price.toString(),
        (tx.amount * tx.price).toString(),
        tx.fee ? tx.fee.toString() : '0',
        tx.txHash
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `tax-report-${formatDate(new Date().toISOString(), 'file')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Tax report exported',
        description: 'Your tax report has been generated successfully.',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error exporting tax report:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error generating your tax report.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          disabled={disabled || transactions.length === 0}
        >
          <DownloadIcon className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportCSV}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON}>
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportTaxReport}>
          Generate Tax Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
