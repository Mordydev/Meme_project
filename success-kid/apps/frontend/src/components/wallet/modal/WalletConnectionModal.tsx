'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  ChevronRight, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Info
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useWalletContext } from '@/components/providers/WalletProvider';
import { useToast } from '@/components/ui/use-toast';
import { WalletProvider as WalletProviderType } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = ['select', 'connect', 'verify', 'success'];

export function WalletConnectionModal({ isOpen, onClose }: WalletConnectionModalProps) {
  const { 
    wallet, 
    isConnecting, 
    isVerifying,
    error, 
    connectWallet, 
    verifyWallet, 
    clearError 
  } = useWalletContext();
  
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  
  // State
  const [currentStep, setCurrentStep] = useState<string>('select');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [connectionStarted, setConnectionStarted] = useState<boolean>(false);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select');
      setSelectedProvider(null);
      setConnectionStarted(false);
      clearError();
    }
  }, [isOpen, clearError]);
  
  // Update step based on wallet state
  useEffect(() => {
    if (!connectionStarted) return;
    
    if (error) {
      // Stay on current step but show error
    } else if (isVerifying) {
      setCurrentStep('verify');
    } else if (isConnecting) {
      setCurrentStep('connect');
    } else if (wallet?.isVerified) {
      setCurrentStep('success');
      
      // Show success toast
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been successfully connected and verified.",
      });
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } else if (wallet?.isConnected) {
      setCurrentStep('verify');
      
      // Automatically initiate verification if connected
      if (!isVerifying) {
        verifyWallet();
      }
    }
  }, [wallet, isConnecting, isVerifying, error, connectionStarted, verifyWallet, toast, onClose]);
  
  // Sample wallet providers
  const walletProviders: WalletProviderType[] = [
    {
      name: 'Phantom',
      type: 'phantom',
      icon: '/images/wallets/phantom.svg', 
      url: 'https://phantom.app/',
      mobile: 'https://phantom.app/download',
      description: 'The most popular Solana wallet with a seamless user experience'
    },
    {
      name: 'Solflare',
      type: 'solflare',
      icon: '/images/wallets/solflare.svg',
      url: 'https://solflare.com/',
      mobile: 'https://solflare.com/download',
      description: 'Full-featured Solana wallet with staking and NFT support'
    }
  ];
  
  // Handle wallet selection
  const handleSelectWallet = (type: string) => {
    setSelectedProvider(type);
    setConnectionStarted(true);
    handleConnect();
  };
  
  // Handle connect
  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection error:', error);
    }
  };
  
  // Handle verification
  const handleVerify = async () => {
    try {
      await verifyWallet();
    } catch (error) {
      console.error('Verification error:', error);
    }
  };
  
  // Handle retry
  const handleRetry = () => {
    clearError();
    
    if (currentStep === 'connect') {
      handleConnect();
    } else if (currentStep === 'verify') {
      handleVerify();
    } else {
      setCurrentStep('select');
      setConnectionStarted(false);
    }
  };
  
  // Animation properties
  const animationProps = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.2 }
      };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Progress indicator */}
        <div className="relative h-1 bg-neutral-100">
          <div 
            className="absolute h-1 bg-primary transition-all duration-500 ease-in-out"
            style={{ 
              width: `${
                currentStep === 'select' ? '25%' : 
                currentStep === 'connect' ? '50%' : 
                currentStep === 'verify' ? '75%' : 
                '100%'
              }` 
            }}
          />
        </div>
        
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-center sm:text-left">
              {currentStep === 'select' && 'Connect Your Wallet'}
              {currentStep === 'connect' && 'Connecting Wallet'}
              {currentStep === 'verify' && 'Verify Wallet Ownership'}
              {currentStep === 'success' && 'Wallet Connected!'}
            </DialogTitle>
            <DialogDescription className="text-center sm:text-left">
              {currentStep === 'select' && 'Connect your wallet to unlock token features and enable points redemption'}
              {currentStep === 'connect' && 'Please approve the connection request in your wallet'}
              {currentStep === 'verify' && 'Sign a message to verify you own this wallet'}
              {currentStep === 'success' && 'Your wallet has been successfully connected and verified'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Select Wallet */}
              {currentStep === 'select' && (
                <motion.div key="select" {...animationProps}>
                  <div className="flex flex-col space-y-3">
                    {walletProviders.map((provider) => (
                      <Button
                        key={provider.type}
                        variant="outline"
                        className="w-full flex justify-between items-center p-3 h-auto"
                        onClick={() => handleSelectWallet(provider.type)}
                      >
                        <div className="flex items-center">
                          <div className="bg-white/90 rounded-full p-1 mr-3 h-8 w-8 flex items-center justify-center">
                            {provider.icon ? (
                              <Image
                                src={provider.icon}
                                alt={provider.name}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="h-6 w-6 bg-neutral-200 rounded-full" />
                            )}
                          </div>
                          
                          <div className="text-left">
                            <h3 className="font-medium">{provider.name}</h3>
                            <p className="text-xs text-neutral-500">{provider.description}</p>
                          </div>
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-neutral-400" />
                      </Button>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Security Assurance</h4>
                        <p className="text-sm text-neutral-600">
                          We never store private keys or seed phrases. Your wallet connects using industry-standard 
                          signature verification.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-center text-neutral-500">
                    <p>New to crypto wallets?</p>
                    <a
                      href="https://phantom.app/learn/beginner-guide"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center"
                    >
                      Learn about wallets
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </motion.div>
              )}
              
              {/* Step 2: Connecting */}
              {currentStep === 'connect' && (
                <motion.div key="connect" {...animationProps}>
                  <div className="flex flex-col items-center justify-center py-4">
                    {error ? (
                      <div className="text-center">
                        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Connection Failed</h3>
                        <p className="text-neutral-600 mb-6 max-w-xs mx-auto">
                          {error || "We couldn't connect to your wallet. Please try again."}
                        </p>
                        <Button onClick={handleRetry}>
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-6">
                          <div className="flex justify-center mb-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                              <div className="relative bg-white p-2 rounded-full">
                                <Image
                                  src={walletProviders.find(p => p.type === selectedProvider)?.icon || '/images/wallets/phantom.svg'}
                                  alt="Wallet"
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-medium text-center mb-2">
                            Requesting Connection
                          </h3>
                          <p className="text-neutral-600 text-center">
                            Check your wallet extension or app to approve the connection request
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Waiting for approval...</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!error && (
                    <div className="mt-6 border-t pt-4">
                      <div className="flex items-start gap-2 text-sm">
                        <Info className="h-4 w-4 text-neutral-500 mt-0.5" />
                        <p className="text-neutral-600">
                          If your wallet didn't open, please click the extension icon in your browser or open your wallet app.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              
              {/* Step 3: Verification */}
              {currentStep === 'verify' && (
                <motion.div key="verify" {...animationProps}>
                  <div className="flex flex-col items-center justify-center py-4">
                    {error ? (
                      <div className="text-center">
                        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Verification Failed</h3>
                        <p className="text-neutral-600 mb-6 max-w-xs mx-auto">
                          {error || "We couldn't verify your wallet ownership. Please try again."}
                        </p>
                        <Button onClick={handleRetry}>
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-6">
                          <div className="flex justify-center mb-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                              <Shield className="h-8 w-8 text-primary" />
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-medium text-center mb-2">
                            Verify Wallet Ownership
                          </h3>
                          <p className="text-neutral-600 text-center mb-4">
                            Please sign a message in your wallet to verify ownership. This won't cost any fees.
                          </p>
                          
                          <div className="bg-neutral-50 rounded-lg p-4 text-sm mb-6">
                            <p className="text-neutral-600 mb-2 font-medium">You're signing:</p>
                            <p className="text-neutral-800 font-mono bg-white p-2 rounded border">
                              I confirm that I own this wallet address and am connecting to Success Kid Platform.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Waiting for signature...</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!error && (
                    <div className="mt-6 border-t pt-4">
                      <div className="flex items-start gap-2 text-sm">
                        <Info className="h-4 w-4 text-neutral-500 mt-0.5" />
                        <p className="text-neutral-600">
                          Signing this message proves you own this wallet without giving us any control over your assets.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              
              {/* Step 4: Success */}
              {currentStep === 'success' && (
                <motion.div key="success" {...animationProps}>
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="mb-6">
                      <div className="flex justify-center mb-4">
                        <div className="bg-green-100 p-3 rounded-full">
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium text-center mb-2">
                        Wallet Successfully Connected
                      </h3>
                      
                      {wallet && (
                        <div className="bg-neutral-50 rounded-lg p-4 mt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-neutral-600">Address:</span>
                            <code className="bg-white px-2 py-1 rounded text-xs">
                              {wallet.account.address.substring(0, 6)}...{wallet.account.address.substring(wallet.account.address.length - 4)}
                            </code>
                          </div>
                          
                          {wallet.balance && (
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-neutral-600">Balance:</span>
                              <span className="font-medium">
                                {wallet.balance.tokenAmount.toLocaleString()} SKC
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-6 text-neutral-600 text-center">
                        <p>You can now redeem points for tokens and access holder-only features.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className={cn(
          "p-4 bg-neutral-50 flex items-center justify-between",
          currentStep === 'connect' || currentStep === 'verify' ? "hidden" : ""
        )}>
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isConnecting || isVerifying}
          >
            Cancel
          </Button>
          
          {currentStep === 'success' && (
            <Button onClick={onClose}>
              Continue to Platform
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
