import { render, screen, fireEvent } from '@testing-library/react'
import { BattleCardGrid } from '../battle-card-grid'
import '@testing-library/jest-dom'

// Mock the BattleCard component so we can focus on testing the grid
jest.mock('../battle-card', () => ({
  BattleCard: ({ onActionClick, id }: any) => (
    <div data-testid={`battle-card-${id}`}>
      <button onClick={() => onActionClick(id)}>Action</button>
    </div>
  )
}))

const mockBattles = [
  {
    id: 'battle-1',
    title: 'First Battle',
    battleType: 'wildStyle',
    status: 'active',
    participantCount: 10,
    endTime: '2025-06-01T00:00:00.000Z',
    startTime: '2025-05-01T00:00:00.000Z',
    votingStartTime: '2025-06-01T00:00:00.000Z',
    votingEndTime: '2025-06-02T00:00:00.000Z',
    creatorId: 'user-1',
    description: 'Test battle description',
    entryCount: 5,
    voteCount: 10,
    featured: false,
    createdAt: '2025-05-01T00:00:00.000Z',
    updatedAt: '2025-05-01T00:00:00.000Z'
  },
  {
    id: 'battle-2',
    title: 'Second Battle',
    battleType: 'pickUpKillIt',
    status: 'voting',
    participantCount: 20,
    endTime: '2025-06-02T00:00:00.000Z',
    startTime: '2025-05-02T00:00:00.000Z',
    votingStartTime: '2025-06-02T00:00:00.000Z',
    votingEndTime: '2025-06-03T00:00:00.000Z',
    creatorId: 'user-2',
    description: 'Another test battle',
    entryCount: 15,
    voteCount: 30,
    featured: true,
    createdAt: '2025-05-02T00:00:00.000Z',
    updatedAt: '2025-05-02T00:00:00.000Z'
  }
]

describe('BattleCardGrid Component', () => {
  const mockOnBattleClick = jest.fn()
  
  afterEach(() => {
    jest.clearAllMocks()
  })
  
  test('renders battle cards for each battle', () => {
    render(
      <BattleCardGrid 
        battles={mockBattles} 
        onBattleClick={mockOnBattleClick} 
      />
    )
    
    // Check if both battle cards are rendered
    expect(screen.getByTestId('battle-card-battle-1')).toBeInTheDocument()
    expect(screen.getByTestId('battle-card-battle-2')).toBeInTheDocument()
  })
  
  test('calls onBattleClick with correct battleId when a card is clicked', () => {
    render(
      <BattleCardGrid 
        battles={mockBattles} 
        onBattleClick={mockOnBattleClick} 
      />
    )
    
    // Click on the first battle card action button
    fireEvent.click(screen.getAllByRole('button', { name: 'Action' })[0])
    
    // Verify the callback was called with the correct battle ID
    expect(mockOnBattleClick).toHaveBeenCalledWith('battle-1')
  })
  
  test('renders loading skeletons when loading prop is true', () => {
    const { container } = render(
      <BattleCardGrid 
        battles={[]} 
        onBattleClick={mockOnBattleClick} 
        loading={true} 
      />
    )
    
    // Check for skeleton loading elements
    // In a real test, you might check for specific skeleton classNames
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
  
  test('renders empty state message when no battles are available', () => {
    render(
      <BattleCardGrid 
        battles={[]} 
        onBattleClick={mockOnBattleClick}
        emptyMessage="Custom empty message" 
      />
    )
    
    // Check for the empty state message
    expect(screen.getByText('No Battles Found')).toBeInTheDocument()
    expect(screen.getByText('Custom empty message')).toBeInTheDocument()
  })
  
  test('applies grid layout based on layout prop', () => {
    // Test grid layout
    const { container, rerender } = render(
      <BattleCardGrid 
        battles={mockBattles} 
        onBattleClick={mockOnBattleClick} 
        layout="grid" 
      />
    )
    
    // Check that grid layout classes are applied
    expect(container.firstChild).toHaveClass('grid-cols-1 md:grid-cols-2 lg:grid-cols-3')
    
    // Test list layout
    rerender(
      <BattleCardGrid 
        battles={mockBattles} 
        onBattleClick={mockOnBattleClick} 
        layout="list" 
      />
    )
    
    // Check that list layout classes are applied (no md:grid-cols-2 lg:grid-cols-3)
    expect(container.firstChild).toHaveClass('grid-cols-1')
    expect(container.firstChild).not.toHaveClass('md:grid-cols-2')
  })
})
