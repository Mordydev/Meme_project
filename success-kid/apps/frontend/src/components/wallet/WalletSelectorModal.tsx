'use client';

import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WalletProvider as WalletProviderType } from '@/types/wallet';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface WalletSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
}

export function WalletSelectorModal({ isOpen, onClose, onSelect }: WalletSelectorModalProps) {
  const { isInstalled } = useWallet();
  const prefersReducedMotion = useReducedMotion();
  
  // Sample list of supported wallets
  const wallets: WalletProviderType[] = [
    {
      name: 'Phantom',
      type: 'phantom',
      icon: '/images/wallets/phantom.svg',
      url: 'https://phantom.app/',
      mobile: 'https://phantom.app/download'
    },
    {
      name: 'Solflare',
      type: 'other',
      icon: '/images/wallets/solflare.svg',
      url: 'https://solflare.com/',
      mobile: 'https://solflare.com/download'
    },
    // More wallets can be added here
  ];
  
  // Handle wallet selection
  const handleSelectWallet = (walletType: string) => {
    if (walletType === 'phantom') {
      if (!isInstalled) {
        window.open('https://phantom.app/', '_blank');
      } else {
        onSelect();
      }
    } else {
      // For now, we only support Phantom
      window.open(wallets.find(w => w.type === walletType)?.url || 'https://phantom.app/', '_blank');
    }
  };
  
  const animationProps = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.15, staggerChildren: 0.05 }
      };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your wallet to track tokens, view transaction history, and redeem points.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <motion.div 
            className="flex flex-col space-y-3"
            {...animationProps}
          >
            {wallets.map((wallet) => (
              <motion.div key={wallet.type} {...animationProps}>
                <Button
                  variant="outline"
                  className="w-full flex justify-between items-center p-3 h-auto"
                  onClick={() => handleSelectWallet(wallet.type)}
                >
                  <div className="flex items-center">
                    <div className="bg-white/90 rounded-full p-1 mr-3 h-8 w-8 flex items-center justify-center">
                      {wallet.icon ? (
                        <Image
                          src={wallet.icon}
                          alt={wallet.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="h-6 w-6 bg-neutral-200 rounded-full" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{wallet.name}</h3>
                      {wallet.type === 'phantom' && !isInstalled && (
                        <p className="text-xs text-amber-600">Not installed</p>
                      )}
                    </div>
                  </div>
                  
                  {wallet.type === 'phantom' && !isInstalled && (
                    <ExternalLink className="h-4 w-4 text-neutral-400" />
                  )}
                </Button>
              </motion.div>
            ))}
          </motion.div>
          
          <div className="mt-6 text-xs text-center text-neutral-500">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
