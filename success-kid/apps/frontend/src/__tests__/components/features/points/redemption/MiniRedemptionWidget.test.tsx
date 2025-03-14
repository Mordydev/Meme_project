import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MiniRedemptionWidget } from '@/components/features/points/redemption';
import { useRedemptionEligibility } from '@/hooks/useRedemptionData';
import { useWallet } from '@/hooks/useWallet';

// Mock the hooks
jest.mock('@/hooks/useRedemptionData', () => ({
  useRedemptionEligibility: jest.fn(),
}));

jest.mock('@/hooks/useWallet', () => ({
  useWallet: jest.fn(),
}));

describe('MiniRedemptionWidget', () => {
  // Setup mock data
  const mockEligibilityData = {
    isEligible: true,
    requirements: {
      walletConnected: true,
      minimumBalance: true,
      weeklyCapAvailable: true,
    },
    limits: {
      minimumAmount: 1000,
      maximumAmount: 10000,
      weeklyLimit: 10000,
      weeklyUsed: 2500,
      remainingWeeklyLimit: 7500,
      resetsAt: '2025-03-16T00:00:00Z',
    },
    pointsBalance: 4500,
    conversionRate: 100,
  };

  const mockWalletData = {
    isConnected: true,
    address: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
  };

  // Mock the implementation of the hooks
  beforeEach(() => {
    (useRedemptionEligibility as jest.Mock).mockReturnValue({
      data: mockEligibilityData,
      isLoading: false,
    });

    (useWallet as jest.Mock).mockReturnValue({
      wallet: mockWalletData,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the widget correctly when eligible', async () => {
    const handleRedeemClick = jest.fn();
    
    render(
      <MiniRedemptionWidget 
        userId="user123" 
        onRedeemClick={handleRedeemClick} 
        showBalance={true}
      />
    );

    // Check if the points balance is displayed
    expect(screen.getByText(/Points Balance:/i)).toBeInTheDocument();
    expect(screen.getByText('4500 SP')).toBeInTheDocument();
    
    // Check if preset amounts are displayed
    expect(screen.getByText('1000 SP')).toBeInTheDocument();
    
    // Check if the redeem button is enabled
    const redeemButton = screen.getByRole('button', { name: /Redeem Tokens/i });
    expect(redeemButton).toBeEnabled();
    
    // Click the redeem button
    fireEvent.click(redeemButton);
    
    // Verify the click handler was called
    expect(handleRedeemClick).toHaveBeenCalledTimes(1);
  });

  test('disables redemption when not eligible', async () => {
    // Override the mock to show ineligibility
    (useRedemptionEligibility as jest.Mock).mockReturnValue({
      data: {
        ...mockEligibilityData,
        isEligible: false,
        requirements: {
          ...mockEligibilityData.requirements,
          minimumBalance: false,
        },
        pointsBalance: 500, // Below minimum
      },
      isLoading: false,
    });
    
    render(<MiniRedemptionWidget userId="user123" />);
    
    // Check for ineligibility message
    expect(screen.getByText(/you need at least/i)).toBeInTheDocument();
    
    // Check if the redeem button is disabled
    const redeemButton = screen.getByRole('button', { name: /Redeem Tokens/i });
    expect(redeemButton).toBeDisabled();
  });

  test('shows loading state', async () => {
    // Override the mock to show loading state
    (useRedemptionEligibility as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });
    
    render(<MiniRedemptionWidget userId="user123" />);
    
    // Check for loading spinner
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });
});
