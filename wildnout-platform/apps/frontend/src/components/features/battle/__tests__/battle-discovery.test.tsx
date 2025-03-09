import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BattleDiscovery } from '../battle-discovery'
import { useBattleStore } from '@/lib/state/battle-store'
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn((param) => {
      if (param === 'status') return 'active'
      if (param === 'type') return 'all'
      return null
    }),
    toString: jest.fn(),
  }),
}))

// Mock the components used by BattleDiscovery
jest.mock('../battle-filter', () => ({
  BattleFilter: ({ onFilterChange }: any) => (
    <div data-testid="battle-filter">
      <button 
        onClick={() => onFilterChange({ status: 'voting', type: 'wildStyle' })}
        data-testid="update-filter"
      >
        Update Filter
      </button>
    </div>
  )
}))

jest.mock('../battle-card-grid', () => ({
  BattleCardGrid: ({ battles, onBattleClick, loading }: any) => (
    <div data-testid="battle-card-grid">
      {loading ? 'Loading...' : `${battles.length} battles`}
      <button 
        onClick={() => onBattleClick('mock-battle-id')}
        data-testid="click-battle"
      >
        Click Battle
      </button>
    </div>
  )
}))

// Mock the Zustand store
jest.mock('@/lib/state/battle-store', () => ({
  useBattleStore: jest.fn(() => ({
    battleViewMode: 'grid',
    setBattleViewMode: jest.fn(),
  })),
}))

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      { id: 'battle-1', title: 'Test Battle 1' },
      { id: 'battle-2', title: 'Test Battle 2' }
    ]),
  }),
) as jest.Mock;

describe('BattleDiscovery Component', () => {
  // Initial battles for testing
  const initialBattles = [
    { id: 'initial-1', title: 'Initial Battle 1' },
    { id: 'initial-2', title: 'Initial Battle 2' }
  ] as any[];
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders with initial battles and controls', () => {
    render(<BattleDiscovery initialBattles={initialBattles} />);
    
    // Check for main controls
    expect(screen.getByText('Hide Filters')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(screen.getByText('Grid View')).toBeInTheDocument();
    
    // Check for battle filter and grid
    expect(screen.getByTestId('battle-filter')).toBeInTheDocument();
    expect(screen.getByTestId('battle-card-grid')).toBeInTheDocument();
    expect(screen.getByText('2 battles')).toBeInTheDocument();
  });
  
  test('toggles filter visibility when button is clicked', () => {
    render(<BattleDiscovery initialBattles={initialBattles} />);
    
    // Initial state shows filters
    expect(screen.getByTestId('battle-filter')).toBeInTheDocument();
    
    // Click the Hide Filters button
    fireEvent.click(screen.getByText('Hide Filters'));
    
    // Filters should now be hidden
    expect(screen.queryByTestId('battle-filter')).not.toBeInTheDocument();
    expect(screen.getByText('Show Filters')).toBeInTheDocument();
    
    // Click again to show filters
    fireEvent.click(screen.getByText('Show Filters'));
    
    // Filters should be visible again
    expect(screen.getByTestId('battle-filter')).toBeInTheDocument();
  });
  
  test('toggles view mode between grid and list', () => {
    const mockSetBattleViewMode = jest.fn();
    (useBattleStore as jest.Mock).mockReturnValue({
      battleViewMode: 'grid',
      setBattleViewMode: mockSetBattleViewMode,
    });
    
    render(<BattleDiscovery initialBattles={initialBattles} />);
    
    // Initially in grid mode
    expect(screen.getByText('Grid View')).toBeInTheDocument();
    
    // Click to toggle view mode
    fireEvent.click(screen.getByText('Grid View'));
    
    // Should call setBattleViewMode with 'list'
    expect(mockSetBattleViewMode).toHaveBeenCalledWith('list');
    
    // Update mock to simulate list view mode
    (useBattleStore as jest.Mock).mockReturnValue({
      battleViewMode: 'list',
      setBattleViewMode: mockSetBattleViewMode,
    });
    
    // Re-render
    render(<BattleDiscovery initialBattles={initialBattles} />);
    
    // Now in list mode
    expect(screen.getByText('List View')).toBeInTheDocument();
    
    // Click to toggle view mode again
    fireEvent.click(screen.getByText('List View'));
    
    // Should call setBattleViewMode with 'grid'
    expect(mockSetBattleViewMode).toHaveBeenCalledWith('grid');
  });
  
  test('fetches battles when filters change', async () => {
    render(<BattleDiscovery initialBattles={initialBattles} />);
    
    // Initially shows initial battles
    expect(screen.getByText('2 battles')).toBeInTheDocument();
    
    // Update filters
    fireEvent.click(screen.getByTestId('update-filter'));
    
    // Should show loading state
    expect(fetch).toHaveBeenCalled();
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(screen.getByText('2 battles')).toBeInTheDocument();
    });
  });
  
  test('navigates to battle detail when a battle is clicked', () => {
    const mockRouter = { push: jest.fn() };
    jest.requireMock('next/navigation').useRouter.mockReturnValue(mockRouter);
    
    render(<BattleDiscovery initialBattles={initialBattles} />);
    
    // Click a battle
    fireEvent.click(screen.getByTestId('click-battle'));
    
    // Should navigate to battle detail
    expect(mockRouter.push).toHaveBeenCalledWith('/battle/mock-battle-id');
  });
});
