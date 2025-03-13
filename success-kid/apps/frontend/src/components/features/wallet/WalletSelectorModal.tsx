'use client';

import { WalletType } from '@/store/useWalletStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface WalletOption {
  id: WalletType;
  name: string;
  icon: string;
  description: string;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '/images/wallets/phantom.svg', // This is a placeholder path
    description: 'Connect to Phantom Wallet, the most popular Solana wallet'
  },
  {
    id: 'solflare',
    name: 'Solflare',
    icon: '/images/wallets/solflare.svg', // This is a placeholder path
    description: 'Connect to Solflare, a Solana wallet built for DeFi & NFTs'
  },
  {
    id: 'slope',
    name: 'Slope',
    icon: '/images/wallets/slope.svg', // This is a placeholder path
    description: 'Connect to Slope Wallet, a Solana wallet for traders'
  }
];

interface WalletSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (provider: WalletType) => void;
  availableProviders: WalletType[];
}

export function WalletSelectorModal({
  isOpen,
  onClose,
  onSelect,
  availableProviders
}: WalletSelectorModalProps) {
  // Filter options to only show available providers
  const options = WALLET_OPTIONS.filter(option => 
    availableProviders.includes(option.id)
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription>
            Select a wallet to connect to the Success Kid platform.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-3 pt-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className="flex items-center rounded-lg border p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="h-10 w-10 flex-shrink-0 mr-4 bg-neutral-100 rounded-full flex items-center justify-center">
                {/* In a real implementation, these would be actual wallet icons */}
                <div className="text-xl font-bold">
                  {option.name.charAt(0)}
                </div>
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{option.name}</div>
                <div className="text-sm text-neutral-500">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
        
        {availableProviders.length === 0 && (
          <div className="text-center py-4">
            <p className="text-neutral-600 mb-4">
              No wallet extensions detected. Please install a compatible wallet.
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('https://phantom.app', '_blank')}
            >
              Download Phantom Wallet
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
