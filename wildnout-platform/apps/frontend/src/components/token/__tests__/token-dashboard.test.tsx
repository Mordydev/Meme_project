import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TokenDashboard } from '../token-dashboard';
import { useWallet } from '@/components/wallet/wallet-provider';

// Mock the wallet provider hook
jest.mock('@/components/wallet/wallet-provider', () => ({
  useWallet: jest.fn()
}));

// Mock sub-components to simplify testing
jest.mock('../token-price-display', () => ({
  TokenPriceDisplay: () => <div data-testid="token-price-display">Price Display Mock</div>
}));

jest.mock('../token-market-cap', () => ({
  TokenMarketCap: () => <div data-testid="token-market-cap">Market Cap Mock</div>
}));

jest.mock('../milestone-tracker', () => ({
  MilestoneTracker: ({ compact }: { compact?: boolean }) => (
    <div data-testid="milestone-tracker">
      Milestone Tracker Mock {compact ? '(Compact)' : ''}
    </div>
  )
}));

jest.mock('../token-transactions', () => ({
  TokenTransactions: () => <div data-testid="token-transactions">Transactions Mock</div>
}));

jest.mock('../token-stats', () => ({
  TokenStats: () => <div data-testid="token-stats">Stats Mock</div>
}));

jest.mock('../holder-benefits', () => ({
  HolderBenefits: () => <div data-testid="holder-benefits">Holder Benefits Mock</div>
}));

jest.mock('@/components/wallet/wallet-connection', () => ({
  WalletConnectionFlow: ({ triggerElement }: any) => (
    <div data-testid="wallet-connection-flow">
      {triggerElement || <button>Default Connect Button</button>}
    </div>
  )
}));

// Mock tabs component
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, value, onValueChange }: any) => (
    <div data-testid="tabs">
      {children}
      <div data-testid="tabs-value">{value}</div>
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-${value}`} onClick={() => onValueChange?.(value)}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  )
}));

// Mock card components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardFooter: ({ children }: any) => <div data-testid="card-footer">{children}</div>
}));

describe('TokenDashboard', () => {
  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
    
    // Default wallet setup - disconnected
    (useWallet as jest.Mock).mockReturnValue({
      connected: false,
      publicKey: null,
      balance: null,
      holderTier: 'none'
    });
  });

  it('should render token price and wallet connection button when not connected', () => {
    render(<TokenDashboard />);
    
    // Check token heading and price
    expect(screen.getByText('$WILDNOUT')).toBeInTheDocument();
    expect(screen.getByTestId('token-price-display')).toBeInTheDocument();
    
    // Should show wallet connection flow
    expect(screen.getByTestId('wallet-connection-flow')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('should render wallet information when connected', () => {
    // Setup wallet mock for connected state
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      publicKey: '8dHEUeahzFHfxU2cjSsXvbrJrMc6rUKpNaZuKG5Fj3WD',
      balance: 5000,
      holderTier: 'bronze'
    });
    
    render(<TokenDashboard />);
    
    // Should show balance and tier
    expect(screen.getByText('Your Balance')).toBeInTheDocument();
    expect(screen.getByText('5,000 $WILDNOUT')).toBeInTheDocument();
    expect(screen.getByText('Bronze Tier')).toBeInTheDocument();
  });

  it('should render proper tabs with correct content', () => {
    render(<TokenDashboard />);
    
    // Check that all tabs are present
    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-milestones')).toBeInTheDocument();
    expect(screen.getByTestId('tab-benefits')).toBeInTheDocument();
    expect(screen.getByTestId('tab-transactions')).toBeInTheDocument();
    
    // Check the overview tab content (default)
    expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument();
    expect(screen.getByText('Market Cap')).toBeInTheDocument();
    expect(screen.getByText('Next Milestone')).toBeInTheDocument();
    
    // Should contain token market cap
    expect(screen.getByTestId('token-market-cap')).toBeInTheDocument();
    
    // Should contain milestone tracker (compact)
    expect(screen.getByText('Milestone Tracker Mock (Compact)')).toBeInTheDocument();
  });

  it('should include HolderBenefits component in the overview and benefits tabs', () => {
    render(<TokenDashboard />);
    
    // Check holder benefits in overview
    expect(screen.getByText('Token Holder Benefits')).toBeInTheDocument();
    expect(screen.getByTestId('holder-benefits')).toBeInTheDocument();
    
    // Check holder benefits in dedicated tab
    expect(screen.getByTestId('tab-content-benefits')).toBeInTheDocument();
  });

  it('should show wallet connection message when not connected in transaction tab', () => {
    render(<TokenDashboard />);
    
    // Check transaction tab content
    expect(screen.getByTestId('tab-content-transactions')).toBeInTheDocument();
    expect(screen.getByText('Connect your wallet to view transactions')).toBeInTheDocument();
  });

  it('should show user transactions message when connected in transaction tab', () => {
    // Setup wallet mock for connected state
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      publicKey: '8dHEUeahzFHfxU2cjSsXvbrJrMc6rUKpNaZuKG5Fj3WD',
      balance: 5000,
      holderTier: 'bronze'
    });
    
    render(<TokenDashboard />);
    
    // Check transaction tab content
    expect(screen.getByTestId('tab-content-transactions')).toBeInTheDocument();
    expect(screen.getByText('Your $WILDNOUT token transactions')).toBeInTheDocument();
  });

  it('should display appropriate holder benefits description based on connection state', () => {
    // Test disconnected state
    render(<TokenDashboard />);
    expect(screen.getByText('Connect wallet to see your benefits')).toBeInTheDocument();
    
    // Clean up
    jest.clearAllMocks();
    
    // Test connected state
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      publicKey: '8dHEUeahzFHfxU2cjSsXvbrJrMc6rUKpNaZuKG5Fj3WD',
      balance: 5000,
      holderTier: 'bronze'
    });
    
    render(<TokenDashboard />);
    expect(screen.getByText('Benefits for your bronze tier')).toBeInTheDocument();
  });
});
