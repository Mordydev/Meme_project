'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { motion } from 'framer-motion';

/**
 * Button for authenticating with a Phantom wallet
 */
export function WalletAuthButton() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<{ message: string; nonce: string } | null>(null);
  const { isLoaded, isSignedIn } = useAuth();
  const { wallet, connect, disconnect, signMessage } = useWallet();
  
  useEffect(() => {
    // Reset state when auth state changes
    setIsVerifying(false);
    setError(null);
    setChallenge(null);
  }, [isSignedIn]);
  
  // Generate a challenge message for wallet verification
  const generateChallenge = async (walletAddress: string) => {
    try {
      const response = await fetch('/api/v1/wallet/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate challenge');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error generating challenge:', error);
      throw error;
    }
  };
  
  // Verify the signed message
  const verifySignature = async (walletAddress: string, signature: string, nonce: string) => {
    try {
      const response = await fetch('/api/v1/wallet/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress, signature, nonce }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify signature');
      }
      
      const data = await response.json();
      return data.data.verified;
    } catch (error) {
      console.error('Error verifying signature:', error);
      throw error;
    }
  };
  
  // Handle wallet authentication
  const handleWalletAuth = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      
      // Connect wallet if not connected
      if (!wallet) {
        await connect();
        return; // The useEffect will trigger again after connection
      }
      
      // Generate challenge if not already done
      if (!challenge) {
        const challengeData = await generateChallenge(wallet.publicKey.toString());
        setChallenge(challengeData);
        return; // Wait for next render with challenge
      }
      
      // Sign the challenge message
      const signature = await signMessage(challenge.message);
      
      // Verify the signature
      const verified = await verifySignature(
        wallet.publicKey.toString(),
        signature,
        challenge.nonce
      );
      
      if (verified) {
        // If user is already signed in, this links the wallet to their account
        // If not, this is handled by the backend
        window.location.reload(); // Refresh to update auth state
      } else {
        setError('Wallet verification failed');
      }
    } catch (error) {
      console.error('Wallet auth error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Determine button state
  const isConnecting = !wallet && isVerifying;
  const isSigning = wallet && challenge && isVerifying;
  const isConnected = wallet && !isVerifying;
  
  // Determine button text
  let buttonText = 'Connect Phantom Wallet';
  if (isConnecting) buttonText = 'Connecting Wallet...';
  if (isConnected && !challenge) buttonText = 'Verify Wallet';
  if (isSigning) buttonText = 'Signing Message...';
  if (isConnected && challenge && !isVerifying) buttonText = 'Sign Verification Message';
  
  if (!isLoaded) {
    return <Button disabled>Loading...</Button>;
  }
  
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={handleWalletAuth}
          isLoading={isVerifying}
          disabled={isVerifying}
          variant={isConnected ? "secondary" : "primary"}
          className="w-full"
        >
          {buttonText}
        </Button>
      </motion.div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm mt-2"
        >
          {error}
        </motion.div>
      )}
      
      {wallet && challenge && !isVerifying && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-sm mt-2 p-3 bg-gray-100 rounded-md"
        >
          <p className="font-medium">Please sign this message to verify wallet ownership:</p>
          <p className="font-mono text-xs mt-1 break-all">{challenge.message}</p>
        </motion.div>
      )}
      
      {isConnected && (
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">
            {wallet.publicKey.toString().slice(0, 6)}...{wallet.publicKey.toString().slice(-4)}
          </span>
          <button
            onClick={() => {
              disconnect();
              setChallenge(null);
            }}
            className="text-sm text-primary underline"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
