# Task 4: Wallet Integration UI

## Task Overview
Implement the user interface components for cryptocurrency wallet integration, enabling users to connect their Phantom wallets, view token balances, and track transaction history. This feature bridges the token aspect of the platform with the community experience, providing utility for token holders while maintaining accessibility for non-holders.

## Required Document Review
- **App Flow Document** - Section 4.3 (Wallet Integration) for detailed wallet connection flow
- **Frontend & Backend Guidelines** - Section 6.2 (Security & Authentication) for wallet security patterns
- **Masterplan Document** - Section 4.3 (Wallet Integration) for feature requirements
- **Phase 1 Artifacts** - Backend Infrastructure Setup for wallet verification endpoints

## User Experience Flow
1. **Connection Initiation:** User initiates wallet connection from profile, settings, or dedicated wallet section
2. **Provider Selection:** System detects available wallet providers with Phantom as primary option
3. **Connection Request:** System requests connection to user's wallet via provider API
4. **Verification:** User signs a message to verify wallet ownership
5. **Success Confirmation:** System confirms successful connection with visual feedback
6. **Token Information:** User sees their token balance and valuation in USD
7. **Transaction History:** User can view their recent transactions with token
8. **Connected State:** Wallet connection status is visible throughout the platform

## Implementation Sub-Tasks

### Sub-Task 1: Wallet Connection Flow
**Description:** Implement the core wallet connection process that guides users through connecting their crypto wallet to the platform.

**Component Hierarchy:**
```
WalletConnection/
├── ConnectionButton/      # Primary connection trigger
├── ConnectionModal/       # Connection flow container
│   ├── ProviderSelection  # Wallet provider options
│   ├── ConnectionRequest  # Connection in progress
│   ├── VerificationStep   # Message signing step
│   └── ConnectionResult   # Success or error state
└── WalletIndicator        # Persistent connection status
```

**Key Interface/Props:**
```tsx
interface WalletConnectionProps {
  onWalletConnected: (address: string, verified: boolean) => void;
  isConnected: boolean;
  walletAddress?: string;
}

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (address: string, verified: boolean) => void;
}

interface WalletConnectionState {
  status: 'idle' | 'detecting' | 'connecting' | 'verifying' | 'success' | 'error';
  address?: string;
  verified: boolean;
  error?: string;
  provider?: 'phantom' | 'manual';
}
```

**Key UI Elements:**
```tsx
function ConnectionModal({ isOpen, onClose, onComplete }: ConnectionModalProps) {
  const [state, setState] = useState<WalletConnectionState>({
    status: 'idle',
    verified: false
  });
  
  // Connect wallet function
  const connectWallet = async () => {
    setState({ ...state, status: 'connecting' });
    
    try {
      // Check if Phantom is available
      const provider = window.phantom?.solana;
      
      if (provider?.isPhantom) {
        try {
          // Request connection
          const connection = await provider.connect();
          const address = connection.publicKey.toString();
          
          // Update state
          setState({ 
            ...state, 
            status: 'verifying', 
            address, 
            provider: 'phantom' 
          });
          
          // Verify wallet ownership
          await verifyWallet(address, provider);
          
        } catch (error) {
          console.error('Connection error:', error);
          setState({ 
            ...state, 
            status: 'error', 
            error: 'Failed to connect wallet. Please try again.' 
          });
        }
      } else {
        // Phantom not installed
        setState({ 
          ...state, 
          status: 'error', 
          error: 'Phantom wallet not detected. Please install Phantom or enter your address manually.' 
        });
      }
    } catch (error) {
      console.error('Wallet detection error:', error);
      setState({ 
        ...state, 
        status: 'error', 
        error: 'Failed to detect wallet. Please try again or enter address manually.' 
      });
    }
  };
  
  // Modal content based on connection status
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
      <div className="p-4">
        {state.status === 'idle' && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Connect your wallet to verify your Success Kid token holdings and unlock holder benefits.
            </p>
            <button
              onClick={connectWallet}
              className="w-full py-3 px-4 flex items-center justify-center bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              <img src="/icons/phantom.svg" alt="Phantom" className="w-5 h-5 mr-2" />
              Connect with Phantom
            </button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            <ManualAddressEntry onSubmit={handleManualEntry} />
          </div>
        )}
        
        {/* Additional status states (connecting, verifying, success, error) */}
      </div>
    </Modal>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Clearly explain each step of the connection process
  - Provide alternative connection methods (manual address entry)
  - Handle all potential errors with clear messaging
  - Display prominent success confirmation
  - Ensure secure message signing for verification
  - Maintain consistent wallet connection indicator across platform

- **Potential Challenges:**
  - Multiple Wallet Providers: Supporting different wallet interfaces consistently
  - Security Concerns: Implementing proper signature verification
  - User Education: Explaining technical concepts in accessible language
  - Error Recovery: Providing clear paths to resolve connection issues

### Sub-Task 2: Token Balance and Valuation Display
**Description:** Create the interface components for displaying token balance, USD valuation, and basic token metrics.

**Component Hierarchy:**
```
TokenDisplay/
├── BalanceCard/          # Primary balance display component
│   ├── TokenAmount       # Token quantity display
│   ├── UsdValue          # Equivalent USD value
│   └── ValueChange       # 24h change indicator
└── TokenMetrics/         # Additional token information
    ├── PriceInfo         # Current price and change
    ├── MarketInfo        # Market cap and volume
    └── PersonalMetrics   # User-specific holdings info
```

**Key UI Elements:**
```tsx
function BalanceCard({ tokenBalance, tokenPrice, tokenChange24h, isLoading }: BalanceCardProps) {
  const usdValue = tokenBalance * tokenPrice;
  const usdChange24h = tokenBalance * tokenPrice * (tokenChange24h / 100);
  const isPositiveChange = tokenChange24h >= 0;
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-2/3 mb-6"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase">Your Balance</h3>
        <div className="mt-2 flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">
            {formatNumber(tokenBalance)}
          </span>
          <span className="ml-2 text-sm text-gray-500">SUCCESS</span>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline">
            <span className="text-xl font-semibold text-gray-900">
              ${formatCurrency(usdValue)}
            </span>
            <span 
              className={`ml-2 text-sm ${
                isPositiveChange ? 'text-success' : 'text-error'
              }`}
            >
              {isPositiveChange ? '+' : ''}{formatCurrency(usdChange24h)} ({tokenChange24h.toFixed(2)}%)
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">USD Value (24h change)</p>
        </div>
      </div>
      <div className="bg-gray-50 px-6 py-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Price per token</span>
          <span className="text-gray-900 font-medium">${formatCurrency(tokenPrice)}</span>
        </div>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Display both token amount and fiat value
  - Show price change with appropriate color indicators
  - Implement skeleton loading states for data fetching
  - Format large numbers for better readability
  - Provide appropriate context for numerical values
  - Ensure proper error states for API failures

- **Potential Challenges:**
  - Data Accuracy: Ensuring up-to-date price information
  - Value Formatting: Handling very large or small numbers appropriately
  - Price Volatility: Clearly indicating significant price movements
  - Loading States: Providing informative feedback during data fetching

### Sub-Task 3: Transaction History Component
**Description:** Create the transaction history viewer that displays the user's token transactions with appropriate filtering and details.

**Component Hierarchy:**
```
TransactionHistory/
├── TransactionFilters/   # Filter and sort controls
├── TransactionList/      # List of transaction items
│   └── TransactionItem   # Individual transaction display
├── TransactionDetail/    # Expanded transaction information
└── PaginationControls/   # Controls for navigating large lists
```

**Key UI Elements:**
```tsx
function TransactionList({ transactions, isLoading, onTransactionClick }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex py-4 border-b border-gray-200">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="w-24">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 ml-auto"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-200">
      {transactions.map((transaction) => (
        <TransactionItem 
          key={transaction.id}
          transaction={transaction}
          onClick={() => onTransactionClick(transaction)}
        />
      ))}
    </div>
  );
}

function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  // Get icon and color based on transaction type
  const typeConfig = {
    send: { 
      icon: <ArrowUpIcon className="w-5 h-5" />, 
      color: 'bg-red-100 text-red-600', 
      label: 'Sent' 
    },
    receive: { 
      icon: <ArrowDownIcon className="w-5 h-5" />, 
      color: 'bg-green-100 text-green-600', 
      label: 'Received' 
    },
    swap: { 
      icon: <SwitchHorizontalIcon className="w-5 h-5" />, 
      color: 'bg-blue-100 text-blue-600', 
      label: 'Swapped' 
    },
    other: { 
      icon: <DotsHorizontalIcon className="w-5 h-5" />, 
      color: 'bg-gray-100 text-gray-600', 
      label: 'Transaction' 
    }
  };
  
  const { icon, color, label } = typeConfig[transaction.type];
  const isReceive = transaction.type === 'receive';
  
  return (
    <div 
      className="py-4 flex items-center hover:bg-gray-50 cursor-pointer px-2 rounded-md"
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-full ${color} p-2 flex-shrink-0`}>
        {icon}
      </div>
      <div className="ml-4 flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {label}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {isReceive 
            ? `From ${shortenAddress(transaction.fromAddress)}`
            : `To ${shortenAddress(transaction.toAddress)}`
          }
        </p>
      </div>
      <div className="ml-4 text-right">
        <p className={`text-sm font-medium ${isReceive ? 'text-success' : 'text-error'}`}>
          {isReceive ? '+' : '-'}{formatNumber(transaction.amount)}
        </p>
        <p className="text-xs text-gray-500">
          {formatDate(transaction.timestamp)}
        </p>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Clearly differentiate transaction types (send/receive)
  - Provide appropriate color-coding for transaction types
  - Show transaction status clearly
  - Implement pagination for large transaction histories
  - Allow filtering by transaction type and date range
  - Provide detailed view with complete transaction information
  - Include links to blockchain explorer for transparency

- **Potential Challenges:**
  - Data Volume: Managing potentially large transaction histories
  - Data Formatting: Presenting blockchain data in user-friendly format
  - Transaction Context: Providing sufficient context for transactions
  - Loading Performance: Efficiently loading and rendering transaction lists

### Sub-Task 4: Wallet Status Indicator
**Description:** Create the wallet connection status indicator that provides persistent visibility into the user's wallet connection state throughout the platform.

**Component Hierarchy:**
```
WalletStatus/
├── StatusIndicator/      # Compact status display
│   ├── ConnectionIcon    # Visual connection status
│   └── AddressDisplay    # Shortened address display
├── DropdownMenu/         # Expanded wallet options
│   ├── BalancePreview    # Quick balance overview
│   ├── ActionLinks       # Wallet-related actions
│   └── DisconnectOption  # Wallet disconnection control
└── ConnectionToast       # Temporary connection notification
```

**Key UI Elements:**
```tsx
function WalletStatusIndicator({ isConnected, walletAddress, verified, onClick }: StatusIndicatorProps) {
  if (!isConnected) {
    return null;
  }
  
  return (
    <button
      className="flex items-center px-3 py-1.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      onClick={onClick}
    >
      <div className={`w-2 h-2 rounded-full ${verified ? 'bg-success' : 'bg-warning'} mr-2`} />
      <span className="font-mono">
        {shortenAddress(walletAddress || '')}
      </span>
    </button>
  );
}

function WalletDropdownMenu({ isOpen, walletAddress, verified, tokenBalance, tokenPrice, onDisconnect, onViewWallet, onClose }: WalletDropdownProps) {
  // Calculate USD value
  const usdValue = (tokenBalance || 0) * (tokenPrice || 0);
  
  if (!isOpen) return null;
  
  return (
    <div className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
      <div className="py-4 px-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">Connected Wallet</p>
          <div className={`px-2 py-1 rounded-full text-xs ${
            verified ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
          }`}>
            {verified ? 'Verified' : 'Unverified'}
          </div>
        </div>
        <p className="mt-1 text-xs font-mono text-gray-500">{walletAddress}</p>
      </div>
      
      <div className="py-3 px-4 border-b border-gray-200">
        <div className="flex justify-between items-baseline">
          <p className="text-sm text-gray-500">Balance</p>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{formatNumber(tokenBalance || 0)} SUCCESS</p>
            <p className="text-xs text-gray-500">${formatCurrency(usdValue)}</p>
          </div>
        </div>
      </div>
      
      <div className="py-2">
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={onViewWallet}
        >
          View Wallet Details
        </button>
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => window.open(`https://solscan.io/account/${walletAddress}`, '_blank')}
        >
          View on Solscan
        </button>
        <button
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          onClick={onDisconnect}
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Show clear visual indicator of connection status
  - Differentiate between verified and unverified wallets
  - Provide quick access to wallet details and balance
  - Implement clean disconnection flow
  - Use concise address display with proper truncation
  - Ensure dropdown menu is keyboard accessible
  - Include external blockchain explorer links

- **Potential Challenges:**
  - Status Persistence: Maintaining wallet state across page refreshes
  - Security Notifications: Communicating verification status clearly
  - Connection Recovery: Handling reconnection after session expiry
  - Cross-device Synchronization: Maintaining consistent wallet state

## Integration Points
- Connects with Authentication system for user identity verification
- Interfaces with Profile Experience for displaying wallet information
- Provides data for Gamification System regarding token holder status
- Interacts with Market Data Visualization for price information
- Sets foundation for transaction-based achievements

## Testing Strategy
- Component testing of wallet connection flow
- Integration testing with Phantom wallet API
- Mocking wallet provider for offline testing scenarios
- Error state testing for connection failures
- Visual testing of all wallet interface components
- Security testing of signature verification process
- Performance testing for transaction list with large datasets

## Definition of Done
This task is complete when:
- [ ] Wallet connection flow guides users through connecting and verifying their wallet
- [ ] Token balance display shows accurate holdings with USD valuation
- [ ] Transaction history component displays past transactions with filtering
- [ ] Wallet status indicator shows connection state throughout the platform
- [ ] All components handle error cases and network failures gracefully
- [ ] Proper loading states are implemented for asynchronous operations
- [ ] Connection persistence is maintained across page refreshes
- [ ] All wallet information is displayed with appropriate privacy controls
- [ ] Security best practices are implemented for wallet interactions
- [ ] Components are responsive across all device sizes
- [ ] All interface elements follow the design system guidelines
- [ ] Documentation is complete for wallet integration APIs