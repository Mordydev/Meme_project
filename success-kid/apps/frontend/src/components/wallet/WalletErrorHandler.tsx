'use client';

import React, { useEffect, useState } from 'react';
import { useWalletContext } from '@/components/providers/WalletProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Wallet,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WalletErrorHandlerProps {
  className?: string;
  compact?: boolean;
  showTroubleshooting?: boolean;
}

export function WalletErrorHandler({ 
  className,
  compact = false,
  showTroubleshooting = true
}: WalletErrorHandlerProps) {
  const { error, clearError, connectWallet, isConnecting, wallet } = useWalletContext();
  const [showDetails, setShowDetails] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Auto-hide details on mobile
  useEffect(() => {
    if (isMobile) {
      setShowDetails(false);
    }
  }, [isMobile]);
  
  // Parse and categorize error
  const getErrorType = (): 'connection' | 'verification' | 'transaction' | 'generic' => {
    if (!error) return 'generic';
    
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('connect') || 
        lowerError.includes('phantom') || 
        lowerError.includes('wallet') && lowerError.includes('not found')) {
      return 'connection';
    }
    
    if (lowerError.includes('sign') || 
        lowerError.includes('verif') || 
        lowerError.includes('signature')) {
      return 'verification';
    }
    
    if (lowerError.includes('transaction') || 
        lowerError.includes('transfer') || 
        lowerError.includes('redemption')) {
      return 'transaction';
    }
    
    return 'generic';
  };
  
  // Get error title
  const getErrorTitle = (): string => {
    const errorType = getErrorType();
    
    switch (errorType) {
      case 'connection':
        return 'Wallet Connection Error';
      case 'verification':
        return 'Wallet Verification Error';
      case 'transaction':
        return 'Transaction Error';
      default:
        return 'Wallet Error';
    }
  };
  
  // Get common solutions
  const getCommonSolutions = (): { title: string; description: string; }[] => {
    const errorType = getErrorType();
    
    switch (errorType) {
      case 'connection':
        return [
          {
            title: 'Check Wallet Extension',
            description: 'Ensure your wallet extension is installed and unlocked.'
          },
          {
            title: 'Browser Compatibility',
            description: 'Some wallets work better in Chrome or Firefox. Try switching browsers.'
          },
          {
            title: 'Update Extension',
            description: 'Make sure your wallet extension is updated to the latest version.'
          },
          {
            title: 'Clear Browser Cache',
            description: 'Clearing your browser cache may resolve connection issues.'
          }
        ];
      case 'verification':
        return [
          {
            title: 'Check Signature Request',
            description: 'Make sure to approve the signature request in your wallet popup.'
          },
          {
            title: 'Wallet Unlocked',
            description: 'Ensure your wallet is unlocked when signing the verification message.'
          },
          {
            title: 'Try Different Device',
            description: 'If on mobile, try from a desktop browser or vice versa.'
          }
        ];
      case 'transaction':
        return [
          {
            title: 'Check Gas Fees',
            description: 'Ensure your wallet has enough balance to cover transaction fees.'
          },
          {
            title: 'Network Congestion',
            description: 'The network might be congested. Try again later.'
          },
          {
            title: 'Transaction Limits',
            description: 'Check if your transaction exceeds any wallet-imposed limits.'
          }
        ];
      default:
        return [
          {
            title: 'Refresh the Page',
            description: 'Try refreshing the page and connecting again.'
          },
          {
            title: 'Check Wallet Status',
            description: 'Ensure your wallet is unlocked and properly connected.'
          },
          {
            title: 'Try Again Later',
            description: 'If the issue persists, wait a few minutes and try again.'
          }
        ];
    }
  };
  
  if (!error) return null;
  
  // Compact version for inline use
  if (compact) {
    return (
      <Alert variant="destructive" className={cn("mb-4", className)}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{getErrorTitle()}</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{error}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                clearError();
                if (wallet?.isConnected) {
                  // Action depends on error type
                  if (getErrorType() === 'verification') {
                    // TODO: Add verification retry handler
                  } else {
                    // Default to reconnect
                    connectWallet();
                  }
                } else {
                  connectWallet();
                }
              }}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Try Again'
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearError()}
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Full version with troubleshooting
  return (
    <div className={cn("rounded-md border p-4", className)}>
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-red-600 mb-1">
            {getErrorTitle()}
          </h3>
          
          <p className="text-neutral-800 mb-3">
            {error}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Button 
              onClick={() => {
                clearError();
                if (wallet?.isConnected) {
                  // Action depends on error type
                  if (getErrorType() === 'verification') {
                    // TODO: Add verification retry handler
                  } else {
                    // Default to reconnect
                    connectWallet();
                  }
                } else {
                  connectWallet();
                }
              }}
              disabled={isConnecting}
              size="sm"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearError()}
            >
              Dismiss
            </Button>
            
            {(getErrorType() === 'connection' || getErrorType() === 'verification') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://phantom.app/learn/troubleshooting-guide', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Phantom Help
              </Button>
            )}
          </div>
          
          {showTroubleshooting && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="mb-2 -ml-2 text-neutral-600"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Troubleshooting
                {showDetails ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Button>
              
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <Accordion type="single" collapsible className="w-full">
                      {getCommonSolutions().map((solution, index) => (
                        <AccordionItem 
                          key={index} 
                          value={`solution-${index}`}
                          className="border-b-0 last:border-b"
                        >
                          <AccordionTrigger className="py-2 text-sm hover:no-underline">
                            {solution.title}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-neutral-600 pb-3">
                            {solution.description}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                    
                    <div className="bg-neutral-50 p-3 rounded-md mt-2 border text-sm text-neutral-600">
                      <p className="font-medium mb-1 flex items-center">
                        <Wallet className="mr-1.5 h-4 w-4" />
                        Still having problems?
                      </p>
                      <p>
                        Visit the <a 
                          href="https://phantom.app/learn/troubleshooting-guide" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Phantom troubleshooting guide
                        </a> or try again later.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
