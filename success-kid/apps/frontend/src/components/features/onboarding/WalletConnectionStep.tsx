'use client';

import { useState } from 'react';
import { User } from '@clerk/nextjs/dist/types/server';
import { Button } from '@/components/ui/button';

interface WalletConnectionStepProps {
  data: {
    connected?: boolean;
    address?: string;
    isVerified?: boolean;
  };
  onComplete: (data: any) => void;
  user: User | null;
}

export default function WalletConnectionStep({ data, onComplete, user }: WalletConnectionStepProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(data.connected || false);
  const [walletAddress, setWalletAddress] = useState(data.address || '');
  const [error, setError] = useState('');
  
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      // Simulate wallet connection
      // In a real implementation, this would connect to a wallet provider
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful connection
      const mockAddress = '0x' + Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      setWalletAddress(mockAddress);
      setIsConnected(true);
      
      // Pass data back to parent
      onComplete({
        connected: true,
        address: mockAddress,
        isVerified: true
      });
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleSkip = () => {
    onComplete({
      connected: false,
      address: '',
      isVerified: false
    });
  };
  
  const handleDisconnect = () => {
    setWalletAddress('');
    setIsConnected(false);
    
    onComplete({
      connected: false,
      address: '',
      isVerified: false
    });
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="mb-4 text-2xl font-bold">Connect Your Wallet</h2>
      
      {isConnected ? (
        <div className="w-full rounded-lg border border-green-100 bg-green-50 p-6 text-center">
          <div className="mb-2 text-lg font-semibold text-green-700">Wallet Connected!</div>
          <div className="mb-4 break-all text-sm text-gray-600">{walletAddress}</div>
          <Button variant="outline" onClick={handleDisconnect}>
            Disconnect Wallet
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-6 text-center text-gray-600">
            Connect your wallet to unlock token holder benefits and enable redemptions
          </p>
          
          <div className="mb-8 flex w-full max-w-md flex-col items-center rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="mb-4 h-16 w-16 rounded-full bg-gray-200 p-3">
              {/* Wallet icon (simplified) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-full w-full text-gray-600"
              >
                <path d="M18 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                <path d="M18 12h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"></path>
              </svg>
            </div>
            
            <Button
              onClick={handleConnectWallet}
              className="mb-2 w-full"
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Phantom Wallet'}
            </Button>
            
            <p className="mt-2 text-sm text-gray-500">
              This is optional and can be done later
            </p>
            
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>
          
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
        </>
      )}
    </div>
  );
}

// Static method to handle next button click from parent
WalletConnectionStep.handleNext = (data: any) => {
  // Wallet connection is optional, so we always return true
  return true;
};
