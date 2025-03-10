# Task 7: Market Data Visualization

## Task Overview
Implement the market data visualization components that provide real-time token price information, market trends, and milestone tracking. This feature bridges the meme token aspect with the community platform, offering transparency into market performance while celebrating milestones that reinforce the Success Kid ethos of achievement and progress.

## Required Document Review
- **Masterplan Document** - Section 4.3 (Token & Market Features) for specific requirements
- **Design System Document** - Section 8.4 (Data Display Patterns) for chart and visualization guidelines
- **App Flow Document** - Section 4.3.4 (Market Milestone Tracking) for milestone visualization
- **Frontend & Backend Guidelines** - Section 5.4 (Integration Strategy) for API integration

## User Experience Flow
1. **Price Overview:** User views current token price with change indicators
2. **Chart Exploration:** User interacts with price chart to view different timeframes
3. **Milestone Tracking:** User sees progress toward next market cap milestone
4. **Transaction Feed:** User browses recent token transactions in network
5. **Price Alerts:** User configures alerts for price targets or milestones

## Implementation Sub-Tasks

### Sub-Task 1: Price Chart Component
**Description:** Create the interactive price chart that visualizes token price movement across different timeframes with appropriate technical indicators.

**Component Hierarchy:**
```
PriceChart/
├── ChartContainer/      # Main chart area with price display
│   ├── PriceLine        # Price movement visualization
│   ├── VolumeBar        # Trading volume display
│   └── Indicators       # Technical indicators (optional)
├── TimeframeSelector/   # Time period selection controls
├── PriceInfo/           # Current price and change display
└── ChartControls/       # Additional chart configuration
```

**Key Interface/Props:**
```tsx
interface PriceChartProps {
  tokenId: string;
  initialTimeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
  height?: number;
  showVolume?: boolean;
  enableZoom?: boolean;
  onPriceUpdate?: (price: number, change: number) => void;
}

interface ChartData {
  prices: Array<[timestamp: number, price: number]>;
  volumes: Array<[timestamp: number, volume: number]>;
  marketCaps: Array<[timestamp: number, marketCap: number]>;
}
```

**Key UI Elements:**
```tsx
function PriceChart({ 
  tokenId, 
  initialTimeframe = 'day', 
  height = 300,
  showVolume = true,
  enableZoom = true,
  onPriceUpdate
}: PriceChartProps) {
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch chart data when timeframe changes
  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await marketDataService.getTokenChartData(tokenId, timeframe);
        setChartData(data);
        
        // Update price info if callback provided
        if (data.prices.length > 0 && onPriceUpdate) {
          const lastPrice = data.prices[data.prices.length - 1][1];
          const firstPrice = data.prices[0][1];
          const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
          
          onPriceUpdate(lastPrice, priceChange);
        }
      } catch (error) {
        console.error('Failed to fetch chart data', error);
        setError('Unable to load chart data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChartData();
  }, [tokenId, timeframe, onPriceUpdate]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* Price info and timeframe selector */}
      <div className="flex justify-between items-center mb-4">
        <PriceInfo 
          price={getCurrentPrice(chartData)}
          change={getPriceChange(chartData)}
          isLoading={isLoading}
        />
        
        <TimeframeSelector 
          timeframe={timeframe}
          onChange={setTimeframe}
          options={[
            { value: 'day', label: '24H' },
            { value: 'week', label: '7D' },
            { value: 'month', label: '30D' },
            { value: 'year', label: '1Y' },
            { value: 'all', label: 'All' }
          ]}
        />
      </div>
      
      {/* Chart display with appropriate states */}
      <div style={{ height }}>
        {isLoading ? (
          <ChartSkeleton />
        ) : error ? (
          <ErrorDisplay message={error} />
        ) : !chartData || chartData.prices.length === 0 ? (
          <NoDataDisplay />
        ) : (
          <LineChart 
            data={formatChartData(chartData)} 
            showVolume={showVolume}
            enableZoom={enableZoom}
          />
        )}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement responsive charts that adapt to container width
  - Provide clear timeframe selection options
  - Show appropriate loading states during data fetching
  - Include visual indicators for price direction (up/down)
  - Support touch interaction for mobile users
  - Optimize rendering performance for large datasets
  - Use consistent color coding for price movement

- **Potential Challenges:**
  - Real-time Updates: Balancing frequent updates with performance
  - Data Volume: Efficiently rendering potentially large datasets
  - Zoom Functionality: Implementing smooth zooming and panning
  - Mobile Responsiveness: Adapting complex charts to small screens

### Sub-Task 2: Market Cap Visualization
**Description:** Create the market cap milestone tracking visualization that shows progress toward the next target and celebrates achievements.

**Component Hierarchy:**
```
MarketCapTracker/
├── MilestoneProgress/    # Visual progress indicator
│   ├── CurrentValue      # Current market cap display
│   ├── ProgressBar       # Visual progress representation
│   └── NextMilestone     # Next target indicator
├── MilestoneHistory/     # Previously achieved milestones
└── MilestoneCelebration/ # Animation for reaching milestone
```

**Key Interface/Props:**
```tsx
interface MarketCapTrackerProps {
  currentMarketCap: number;
  milestones: Milestone[];
  showHistory?: boolean;
}

interface Milestone {
  value: number;
  label: string;
  achieved: boolean;
  achievedAt?: string;
}
```

**Key UI Elements:**
```tsx
function MarketCapTracker({ 
  currentMarketCap, 
  milestones,
  showHistory = true
}: MarketCapTrackerProps) {
  // Find next milestone
  const nextMilestone = milestones.find(m => !m.achieved);
  
  // Calculate progress toward next milestone
  const progress = nextMilestone 
    ? Math.min(100, (currentMarketCap / nextMilestone.value) * 100)
    : 100;
  
  // Sort achieved milestones by date
  const achievedMilestones = milestones
    .filter(m => m.achieved)
    .sort((a, b) => {
      if (!a.achievedAt || !b.achievedAt) return 0;
      return new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime();
    });
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Market Cap Milestones
      </h3>
      
      {/* Current market cap */}
      <div className="flex justify-between items-baseline mb-1">
        <div className="text-sm text-gray-500">Current Market Cap</div>
        <div className="text-lg font-medium text-gray-900">
          ${formatLargeNumber(currentMarketCap)}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 mb-1">
        <div className="h-8 bg-gray-100 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
            {Math.round(progress)}% to next milestone
          </div>
        </div>
      </div>
      
      {/* Next milestone */}
      {nextMilestone && (
        <div className="flex justify-between items-baseline mt-3">
          <div className="text-sm text-gray-500">Next Milestone</div>
          <div className="flex items-center">
            <TrophyIcon className="w-5 h-5 text-yellow-500 mr-1" />
            <span className="text-lg font-medium text-gray-900">
              ${formatLargeNumber(nextMilestone.value)}
            </span>
          </div>
        </div>
      )}
      
      {/* Previous milestones */}
      {showHistory && achievedMilestones.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Achieved Milestones
          </h4>
          <div className="space-y-3">
            {achievedMilestones.slice(0, 3).map((milestone) => (
              <AchievedMilestone key={milestone.value} milestone={milestone} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Use smooth animations for progress updates
  - Provide clear visual context for milestone values
  - Implement celebratory animations for milestone achievements
  - Use consistent formatting for large numbers
  - Show milestone history for context and motivation
  - Ensure all interactive elements are accessible

- **Potential Challenges:**
  - Value Scale: Creating intuitive visualizations for large value differences
  - Celebration Timing: Coordinating milestone celebrations across users
  - Progress Perception: Making small percentage progress feel meaningful
  - Historical Context: Balancing history display with forward-looking goals

### Sub-Task 3: Transaction Feed Component
**Description:** Create the transaction feed that displays recent token transactions with appropriate filtering and details.

**Component Hierarchy:**
```
TransactionFeed/
├── TransactionFilters/   # Filter and sort controls
├── TransactionList/      # List of transaction items
│   └── TransactionItem   # Individual transaction display
├── TransactionStats/     # Aggregate statistics display
└── LiveIndicator/        # Real-time update indicator
```

**Key Interface/Props:**
```tsx
interface TransactionFeedProps {
  tokenAddress: string;
  maxItems?: number;
  showFilters?: boolean;
  liveUpdates?: boolean;
}

interface Transaction {
  hash: string;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  value: number;
  timestamp: number;
  fromAddress: string;
  toAddress: string;
  blockNumber: number;
}
```

**Key UI Elements:**
```tsx
function TransactionFeed({ 
  tokenAddress, 
  maxItems = 20,
  showFilters = true,
  liveUpdates = true
}: TransactionFeedProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    minAmount: 0
  });
  
  // Initial data load
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const data = await marketDataService.getTokenTransactions(
          tokenAddress, 
          maxItems,
          filters
        );
        setTransactions(data);
      } catch (error) {
        console.error('Failed to load transactions', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTransactions();
  }, [tokenAddress, maxItems, filters]);
  
  // Live updates subscription
  useEffect(() => {
    if (!liveUpdates) return;
    
    const subscription = marketDataService.subscribeToTransactions(
      tokenAddress,
      (newTransaction) => {
        setTransactions(prev => {
          // Filter by current criteria
          if (filters.type !== 'all' && newTransaction.type !== filters.type) {
            return prev;
          }
          
          if (newTransaction.amount < filters.minAmount) {
            return prev;
          }
          
          // Add to beginning, maintain max length
          return [newTransaction, ...prev].slice(0, maxItems);
        });
      }
    );
    
    return () => subscription.unsubscribe();
  }, [tokenAddress, liveUpdates, maxItems, filters]);
  
  // Calculate transaction statistics
  const stats = useMemo(() => {
    const buys = transactions.filter(t => t.type === 'buy').length;
    const sells = transactions.filter(t => t.type === 'sell').length;
    const totalVolume = transactions.reduce((sum, t) => sum + t.value, 0);
    
    return {
      buyRatio: transactions.length ? (buys / transactions.length) * 100 : 0,
      sellRatio: transactions.length ? (sells / transactions.length) * 100 : 0,
      totalVolume
    };
  }, [transactions]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header with live indicator */}
      <div className="border-b border-gray-200 px-4 py-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Recent Transactions
        </h3>
        {liveUpdates && <LiveIndicator />}
      </div>
      
      {/* Transaction stats */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-sm text-gray-500">Buy/Sell Ratio</div>
          <div className="flex mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="bg-success h-full" 
              style={{ width: `${stats.buyRatio}%` }}
            />
            <div 
              className="bg-error h-full" 
              style={{ width: `${stats.sellRatio}%` }}
            />
          </div>
          <div className="mt-1 text-xs flex justify-between">
            <span className="text-success">{Math.round(stats.buyRatio)}% Buys</span>
            <span className="text-error">{Math.round(stats.sellRatio)}% Sells</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Volume (24h)</div>
          <div className="text-base font-medium text-gray-900">${formatLargeNumber(stats.totalVolume)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Transactions</div>
          <div className="text-base font-medium text-gray-900">{transactions.length}</div>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-gray-200 flex space-x-4">
          <select
            className="rounded-md border-gray-300 py-1 pl-3 pr-8 text-sm"
            value={filters.type}
            onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="all">All Transactions</option>
            <option value="buy">Buys Only</option>
            <option value="sell">Sells Only</option>
            <option value="transfer">Transfers Only</option>
          </select>
          
          <select
            className="rounded-md border-gray-300 py-1 pl-3 pr-8 text-sm"
            value={filters.minAmount}
            onChange={e => setFilters(prev => ({ ...prev, minAmount: Number(e.target.value) }))}
          >
            <option value="0">All Amounts</option>
            <option value="1000">1,000+ Tokens</option>
            <option value="10000">10,000+ Tokens</option>
            <option value="100000">100,000+ Tokens</option>
          </select>
        </div>
      )}
      
      {/* Transaction list */}
      <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <TransactionSkeleton count={5} />
        ) : transactions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No transactions found
          </div>
        ) : (
          transactions.map(transaction => (
            <TransactionItem key={transaction.hash} transaction={transaction} />
          ))
        )}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement live updates with visual indicators
  - Provide useful transaction filters for discovery
  - Display aggregate statistics for market context
  - Use clear visual indicators for transaction types
  - Implement efficient rendering for large transaction volumes
  - Include links to blockchain explorer for transaction details

- **Potential Challenges:**
  - Real-time Updates: Managing WebSocket connections and reconnections
  - Data Volume: Handling potentially large numbers of transactions
  - Mobile Rendering: Displaying complex transaction data on small screens
  - Performance: Efficiently rendering and updating the transaction list

### Sub-Task 4: Price Alert Configuration
**Description:** Create the price alert configuration interface that allows users to set and manage alerts for specific price targets or milestone achievements.

**Component Hierarchy:**
```
PriceAlerts/
├── AlertsList/           # Existing alerts display
│   └── AlertItem         # Individual alert with controls
├── CreateAlertForm/      # New alert configuration
│   ├── PriceInput        # Target price entry
│   ├── AlertTypeSelector # Alert condition selection
│   └── NotificationConfig # Alert delivery options
└── AlertStatusIndicator/ # Active alerts summary
```

**Key Interface/Props:**
```tsx
interface PriceAlertsProps {
  tokenId: string;
  currentPrice: number;
}

interface PriceAlert {
  id: string;
  tokenId: string;
  type: 'above' | 'below' | 'percent_change' | 'milestone';
  targetValue: number;
  triggered: boolean;
  createdAt: string;
  notificationMethods: ('email' | 'push' | 'in_app')[];
}
```

**Key UI Elements:**
```tsx
function PriceAlerts({ tokenId, currentPrice }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Load existing alerts
  useEffect(() => {
    const loadAlerts = async () => {
      setIsLoading(true);
      try {
        const data = await alertsService.getUserAlerts(tokenId);
        setAlerts(data);
      } catch (error) {
        console.error('Failed to load alerts', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAlerts();
  }, [tokenId]);
  
  // Alert management functions
  const handleCreateAlert = async (newAlert: Omit<PriceAlert, 'id' | 'triggered' | 'createdAt'>) => {
    try {
      const createdAlert = await alertsService.createAlert({
        ...newAlert,
        tokenId
      });
      
      setAlerts(prev => [...prev, createdAlert]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create alert', error);
    }
  };
  
  const handleDeleteAlert = async (alertId: string) => {
    try {
      await alertsService.deleteAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert', error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header with create button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Price Alerts</h3>
          <p className="text-sm text-gray-500">Get notified when price hits your targets</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(prev => !prev)}
          className="flex items-center px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          {showCreateForm ? (
            <>
              <XIcon className="w-4 h-4 mr-1" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="w-4 h-4 mr-1" />
              New Alert
            </>
          )}
        </button>
      </div>
      
      {/* Create alert form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <CreateAlertForm 
            currentPrice={currentPrice} 
            onSubmit={handleCreateAlert}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}
      
      {/* Alerts list */}
      <div className="space-y-4">
        {isLoading ? (
          <AlertsSkeleton />
        ) : alerts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <BellOffIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p>No price alerts set</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-2 text-primary hover:underline text-sm"
            >
              Create your first alert
            </button>
          </div>
        ) : (
          alerts.map(alert => (
            <AlertItem 
              key={alert.id} 
              alert={alert} 
              currentPrice={currentPrice}
              onDelete={() => handleDeleteAlert(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Provide clear alert configuration options
  - Show current alert status and proximity to trigger
  - Implement notification delivery preferences
  - Allow easy management of multiple alerts
  - Include appropriate confirmation for alert deletion
  - Maintain user context with current price display

- **Potential Challenges:**
  - Alert Timing: Ensuring timely notification delivery across channels
  - Alert Persistence: Maintaining alert state across sessions and devices
  - Condition Evaluation: Accurately evaluating complex alert conditions
  - User Preferences: Balancing notification frequency with information value

## Integration Points
- Connects with Notification System for alert delivery
- Interfaces with Wallet Integration for showing user token holdings
- Provides data for Gamification System regarding market milestones
- Integrates with external price APIs for real-time data
- Sets context for Forum and Content System market discussions

## Testing Strategy
- Component testing of all data visualization components
- API integration testing with mock market data
- Real-time update testing for WebSocket connections
- State transition testing for price changes and alerts
- Responsive testing across device sizes
- Performance testing with large datasets and frequent updates
- Visual regression testing for charts and visualizations

## Definition of Done
This task is complete when:
- [ ] Price chart component displays token price with different timeframes
- [ ] Market cap visualization shows progress toward milestones
- [ ] Transaction feed displays token transactions with filtering
- [ ] Price alert configuration allows creating and managing alerts
- [ ] All components handle real-time data updates appropriately
- [ ] Loading, error, and empty states are properly implemented
- [ ] Components are responsive across all required device sizes
- [ ] Data refresh mechanisms avoid unnecessary API calls
- [ ] Chart interactions work correctly on both mouse and touch devices
- [ ] All milestone celebrations trigger appropriately
- [ ] API integrations are properly documented for backend implementation