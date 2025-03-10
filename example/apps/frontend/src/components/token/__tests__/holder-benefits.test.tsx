import React from 'react';
import { render, screen } from '@testing-library/react';
import { HolderBenefits } from '../holder-benefits';
import { useWallet } from '@/components/wallet/wallet-provider';

// Mock the wallet provider hook
jest.mock('@/components/wallet/wallet-provider', () => ({
  useWallet: jest.fn()
}));

// Mock the WalletButton component
jest.mock('@/components/wallet/wallet-button', () => ({
  WalletButton: () => <button>Connect Wallet Mock</button>
}));

describe('HolderBenefits', () => {
  beforeEach(() => {
    // Reset mock between tests
    (useWallet as jest.Mock).mockReset();
  });

  it('should show connect wallet prompt when not connected', () => {
    // Setup wallet mock for disconnected state
    (useWallet as jest.Mock).mockReturnValue({
      connected: false,
      balance: null,
      holderTier: 'none',
    });

    render(<HolderBenefits />);
    
    // Should show connect wallet text
    expect(screen.getByText(/Connect your wallet to see your holder tier/i)).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet Mock')).toBeInTheDocument();
  });

  it('should show non-holder state when balance is below threshold', () => {
    // Setup wallet mock for connected state but below holder threshold
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      balance: 500, // Below the 1000 MIN_HOLDER_BALANCE
      holderTier: 'none',
    });

    render(<HolderBenefits />);
    
    // Should show the prompt to purchase tokens
    expect(screen.getByText(/Purchase at least 1,000 \$WILDNOUT tokens/i)).toBeInTheDocument();
  });

  it('should show bronze tier benefits', () => {
    // Setup wallet mock for bronze tier
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      balance: 5000,
      holderTier: 'bronze',
    });

    render(<HolderBenefits />);
    
    // Should show bronze tier badge
    expect(screen.getByText('Bronze Tier')).toBeInTheDocument();
    
    // Should show bronze tier benefits
    expect(screen.getByText('Exclusive Battle Access')).toBeInTheDocument();
    expect(screen.getByText('Holder Profile Badge')).toBeInTheDocument();
    
    // Should not show silver tier benefits
    expect(screen.queryByText('Enhanced Voting Power')).not.toBeInTheDocument();
  });

  it('should show silver tier benefits', () => {
    // Setup wallet mock for silver tier
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      balance: 15000,
      holderTier: 'silver',
    });

    render(<HolderBenefits />);
    
    // Should show silver tier badge
    expect(screen.getByText('Silver Tier')).toBeInTheDocument();
    
    // Should show both bronze and silver tier benefits
    expect(screen.getByText('Exclusive Battle Access')).toBeInTheDocument();
    expect(screen.getByText('Enhanced Voting Power')).toBeInTheDocument();
  });

  it('should show progress to next tier', () => {
    // Setup wallet mock for bronze tier with progress to silver
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      balance: 5000, // 4000 away from silver tier (10000)
      holderTier: 'bronze',
    });

    render(<HolderBenefits />);
    
    // Should show next tier information
    expect(screen.getByText('Next Tier: silver')).toBeInTheDocument();
    expect(screen.getByText('10,000 $WILDNOUT')).toBeInTheDocument();
  });

  it('should show platinum tier with all benefits unlocked', () => {
    // Setup wallet mock for platinum tier
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      balance: 300000,
      holderTier: 'platinum',
    });

    render(<HolderBenefits />);
    
    // Should show platinum tier badge
    expect(screen.getByText('Platinum Tier')).toBeInTheDocument();
    
    // Should show unlocked message instead of next tier
    expect(screen.getByText('You have unlocked all benefits!')).toBeInTheDocument();
    
    // Should show all benefits
    expect(screen.getByText('Exclusive Battle Access')).toBeInTheDocument();
    expect(screen.getByText('Enhanced Voting Power')).toBeInTheDocument();
    expect(screen.getByText('Premium Platform Features')).toBeInTheDocument();
    expect(screen.getByText('Celebrity Battle Invitations')).toBeInTheDocument();
  });
});
