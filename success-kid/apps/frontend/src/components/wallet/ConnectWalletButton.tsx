'use client';

import { Button } from '@/components/ui/button';

interface ConnectWalletButtonProps {
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function ConnectWalletButton({
  fullWidth = false,
  size = 'md',
  variant = 'default',
  className = '',
}: ConnectWalletButtonProps) {
  const handleConnect = () => {
    // In real implementation, this would connect to a wallet
    console.log('Connecting wallet...');
    alert('Wallet connection would be triggered here');
  };
  
  return (
    <Button 
      onClick={handleConnect}
      className={className}
      variant={variant}
      size={size}
      {...(fullWidth ? { className: 'w-full' } : {})}
    >
      Connect Wallet
    </Button>
  );
}
