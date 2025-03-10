import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnectionFlow } from '../wallet-connection';
import { useWallet } from '../wallet-provider';

// Mock the wallet provider hook
jest.mock('../wallet-provider', () => ({
  useWallet: jest.fn()
}));

// Mock the Dialog component to avoid issues with dialog testing
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>
}));

describe('WalletConnectionFlow', () => {
  // Mock wallet functions
  const mockConnect = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
    
    // Default wallet state - disconnected
    (useWallet as jest.Mock).mockReturnValue({
      connected: false,
      connecting: false,
      publicKey: null,
      balance: null,
      holderTier: 'none',
      connect: mockConnect,
      error: null
    });
  });

  it('should render the default connect button when no trigger element is provided', () => {
    render(<WalletConnectionFlow onSuccess={mockOnSuccess} />);
    
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('should render the custom trigger element when provided', () => {
    render(
      <WalletConnectionFlow 
        onSuccess={mockOnSuccess} 
        triggerElement={<button>Custom Connect Button</button>}
      />
    );
    
    expect(screen.getByText('Custom Connect Button')).toBeInTheDocument();
  });

  it('should show the intro step by default', async () => {
    // Open the dialog
    render(<WalletConnectionFlow onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    // Check that intro content is visible
    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
    expect(screen.getByText('Why Connect?')).toBeInTheDocument();
  });

  it('should show connecting step during connection', async () => {
    // Setup wallet mock to simulate connecting state
    (useWallet as jest.Mock).mockReturnValue({
      connected: false,
      connecting: true,
      publicKey: null,
      balance: null,
      holderTier: 'none',
      connect: mockConnect,
      error: null
    });

    // Render and open the dialog
    render(<WalletConnectionFlow onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    // Click connect
    fireEvent.click(screen.getByText('Connect Phantom Wallet'));
    
    // Should now show connecting state
    expect(screen.getByText('Connecting Wallet')).toBeInTheDocument();
    expect(screen.getByText('Please check your Phantom wallet for a connection request.')).toBeInTheDocument();
  });

  it('should show success step after successful connection', async () => {
    // Setup wallet mock for successful connection
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      connecting: false,
      publicKey: '8dHEUeahzFHfxU2cjSsXvbrJrMc6rUKpNaZuKG5Fj3WD',
      balance: 5000,
      holderTier: 'bronze',
      connect: mockConnect.mockResolvedValue(undefined),
      error: null
    });

    // Render and open the dialog
    render(<WalletConnectionFlow onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    // Click connect
    fireEvent.click(screen.getByText('Connect Phantom Wallet'));
    
    // Should now show success state
    await waitFor(() => {
      expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      expect(screen.getByText('Your Phantom wallet has been successfully connected.')).toBeInTheDocument();
    });
    
    // Should show wallet details
    expect(screen.getByText('8dHE...j3WD')).toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('bronze')).toBeInTheDocument();
  });

  it('should show error step when connection fails', async () => {
    // Setup wallet mock for failed connection
    (useWallet as jest.Mock).mockReturnValue({
      connected: false,
      connecting: false,
      publicKey: null,
      balance: null,
      holderTier: 'none',
      connect: mockConnect.mockRejectedValue(new Error('Connection failed')),
      error: 'Failed to connect wallet'
    });

    // Render and open the dialog
    render(<WalletConnectionFlow onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    // Click connect
    fireEvent.click(screen.getByText('Connect Phantom Wallet'));
    
    // Should now show error state
    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('There was a problem connecting to your wallet.')).toBeInTheDocument();
    });
    
    // Should show error message and troubleshooting
    expect(screen.getByText('Failed to connect wallet')).toBeInTheDocument();
    expect(screen.getByText('Troubleshooting')).toBeInTheDocument();
  });

  it('should call onSuccess callback when connection is successful', async () => {
    // Setup wallet mock for successful connection
    const mockPublicKey = '8dHEUeahzFHfxU2cjSsXvbrJrMc6rUKpNaZuKG5Fj3WD';
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      connecting: false,
      publicKey: mockPublicKey,
      balance: 5000,
      holderTier: 'bronze',
      connect: mockConnect.mockResolvedValue(undefined),
      error: null
    });

    // Render and open the dialog
    render(<WalletConnectionFlow onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    // Click connect
    fireEvent.click(screen.getByText('Connect Phantom Wallet'));
    
    // onSuccess should be called with public key
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockPublicKey);
    });
  });
});
