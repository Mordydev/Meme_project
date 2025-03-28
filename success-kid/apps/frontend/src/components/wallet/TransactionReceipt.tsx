'use client';

import React, { useRef } from 'react';
import { 
  Check, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Share2,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useWalletContext } from '@/components/providers/WalletProvider';
import { formatRelativeTime } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import html2canvas from 'html2canvas';

interface TransactionReceiptProps {
  transactionHash: string;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  pointsAmount: number;
  tokenAmount: number;
  timestamp: Date;
  completedAt?: Date;
  blockNumber?: number;
  confirmations?: number;
  fee?: string;
  error?: string;
  className?: string;
  onClose?: () => void;
}

export function TransactionReceipt({
  transactionHash,
  status,
  pointsAmount,
  tokenAmount,
  timestamp,
  completedAt,
  blockNumber,
  confirmations,
  fee,
  error,
  className,
  onClose
}: TransactionReceiptProps) {
  const { formatAddress } = useWalletContext();
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const [isCopied, setIsCopied] = React.useState(false);
  
  const handleCopyTransactionHash = () => {
    if (transactionHash) {
      navigator.clipboard.writeText(transactionHash);
      setIsCopied(true);
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };
  
  const handleShare = () => {
    const shareData = {
      title: 'Success Kid Token Transaction',
      text: `I just redeemed ${tokenAmount} SKC tokens on the Success Kid Community Platform!`,
      url: `https://solscan.io/tx/${transactionHash}`
    };
    
    if (navigator.share && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .catch(error => console.error('Error sharing:', error));
    } else {
      // Fallback to clipboard copy
      const shareText = `${shareData.text} ${shareData.url}`;
      navigator.clipboard.writeText(shareText);
      
      toast({
        title: "Copied to clipboard",
        description: "Share link copied to clipboard",
      });
    }
  };
  
  const handleDownload = async () => {
    if (!receiptRef.current) return;
    
    try {
      // Add a class for screenshot mode
      receiptRef.current.classList.add('screenshot-mode');
      
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      // Remove screenshot mode class
      receiptRef.current.classList.remove('screenshot-mode');
      
      // Create download link
      const link = document.createElement('a');
      link.download = `success-kid-receipt-${transactionHash.substring(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: "Receipt Downloaded",
        description: "Your transaction receipt has been downloaded",
      });
    } catch (error) {
      console.error('Error generating receipt image:', error);
      
      toast({
        title: "Download Failed",
        description: "Could not generate receipt image",
        variant: "destructive",
      });
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'pending':
      case 'processing':
        return 'text-amber-500';
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-neutral-600';
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className={cn("h-5 w-5", getStatusColor())} />;
      case 'pending':
      case 'processing':
        return <Clock className={cn("h-5 w-5", getStatusColor())} />;
      case 'failed':
        return <XCircle className={cn("h-5 w-5", getStatusColor())} />;
      default:
        return <AlertCircle className={cn("h-5 w-5", getStatusColor())} />;
    }
  };
  
  const getStatusLabel = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };
  
  const getStatusDescription = () => {
    switch (status) {
      case 'completed':
        return 'Transaction confirmed and tokens transferred';
      case 'pending':
        return 'Waiting for blockchain confirmation';
      case 'processing':
        return 'Transaction is being processed';
      case 'failed':
        return error || 'Transaction failed to complete';
      default:
        return 'Transaction status unknown';
    }
  };
  
  return (
    <Card className={cn("w-full", className)} ref={receiptRef}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">Transaction Receipt</CardTitle>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span className={cn("text-sm font-medium", getStatusColor())}>
              {getStatusLabel()}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-0">
        <div className="flex flex-col gap-4">
          {/* Transaction Amount */}
          <div className="text-center py-4 bg-neutral-50 rounded-md">
            <div className="text-2xl font-semibold">
              {tokenAmount.toLocaleString()} SKC
            </div>
            <div className="text-sm text-neutral-500">
              {pointsAmount.toLocaleString()} Points Redeemed
            </div>
          </div>
          
          {/* Status Information */}
          <div className="bg-neutral-50 p-3 rounded-md text-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">{getStatusLabel()}</span>
            </div>
            <p className="mt-1 text-neutral-600">{getStatusDescription()}</p>
          </div>
          
          {/* Transaction Details */}
          <div>
            <h3 className="font-medium text-sm mb-2">Transaction Details</h3>
            
            <div className="space-y-2 text-sm">
              {/* Transaction Hash */}
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Transaction Hash</span>
                <div className="flex items-center">
                  <code className="bg-neutral-50 px-2 py-1 rounded font-mono text-xs">
                    {formatAddress(transactionHash)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-7 w-7 p-0"
                    onClick={handleCopyTransactionHash}
                  >
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-neutral-500" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Time */}
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Initiated</span>
                <span className="font-medium">
                  {formatRelativeTime(timestamp)}
                </span>
              </div>
              
              {/* Completion Time (if completed) */}
              {completedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Completed</span>
                  <span className="font-medium">
                    {formatRelativeTime(completedAt)}
                  </span>
                </div>
              )}
              
              {/* Block Info (if completed) */}
              {blockNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Block Number</span>
                  <span className="font-medium">{blockNumber.toLocaleString()}</span>
                </div>
              )}
              
              {/* Confirmations (if completed) */}
              {confirmations && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Confirmations</span>
                  <span className="font-medium">{confirmations}</span>
                </div>
              )}
              
              {/* Network Fee (if available) */}
              {fee && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Network Fee</span>
                  <span className="font-medium">{fee} SOL</span>
                </div>
              )}
            </div>
          </div>
          
          {/* View on Explorer */}
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.open(`https://solscan.io/tx/${transactionHash}`, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Solscan
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="pt-5 flex-col gap-2">
        <Separator className="-mx-6 w-auto screenshot-hide" />
        
        <div className="flex justify-between w-full screenshot-hide">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          
          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      </CardFooter>
      
      {/* Only visible in screenshot mode */}
      <div className="hidden screenshot-only">
        <div className="pt-5 text-center text-sm text-neutral-500">
          <p>Success Kid Community Platform</p>
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </Card>
  );
}
