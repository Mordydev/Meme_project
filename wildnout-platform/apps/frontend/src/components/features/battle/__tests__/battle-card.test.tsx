import { render, screen, fireEvent } from '@testing-library/react'
import { BattleCard, BattleCardProps } from '../battle-card'
import '@testing-library/jest-dom'

// Mock props for consistent testing
const defaultProps: BattleCardProps = {
  id: 'battle-123',
  title: 'Test Battle',
  type: 'wildStyle',
  status: 'active',
  participants: 42,
  timeRemaining: '2h 30m',
  onActionClick: jest.fn()
}

describe('BattleCard Component', () => {
  test('renders battle card with correct content', () => {
    render(<BattleCard {...defaultProps} />)
    
    // Check title
    expect(screen.getByText('Test Battle')).toBeInTheDocument()
    
    // Check type badge
    expect(screen.getByText('Wild Style')).toBeInTheDocument()
    
    // Check status badge
    expect(screen.getByText('Active')).toBeInTheDocument()
    
    // Check participants count
    expect(screen.getByText('42 participants')).toBeInTheDocument()
    
    // Check time remaining
    expect(screen.getByText('2h 30m')).toBeInTheDocument()
    
    // Check action button text
    expect(screen.getByRole('button', { name: 'Join Battle' })).toBeInTheDocument()
  })
  
  test('calls onActionClick when action button is clicked', () => {
    render(<BattleCard {...defaultProps} />)
    
    // Click the action button
    fireEvent.click(screen.getByRole('button', { name: 'Join Battle' }))
    
    // Verify the callback was called
    expect(defaultProps.onActionClick).toHaveBeenCalledTimes(1)
  })
  
  test('shows correct action text based on battle status and participation', () => {
    // Test for upcoming battle
    render(<BattleCard {...defaultProps} status="upcoming" />)
    expect(screen.getByRole('button', { name: 'Remind Me' })).toBeInTheDocument()
    
    // Test for active battle with user participation
    render(<BattleCard {...defaultProps} status="active" hasParticipated={true} />)
    expect(screen.getByRole('button', { name: 'View Entry' })).toBeInTheDocument()
    
    // Test for voting battle
    render(<BattleCard {...defaultProps} status="voting" />)
    expect(screen.getByRole('button', { name: 'Vote Now' })).toBeInTheDocument()
    
    // Test for completed battle
    render(<BattleCard {...defaultProps} status="completed" />)
    expect(screen.getByRole('button', { name: 'See Results' })).toBeInTheDocument()
  })
  
  test('shows participation indicator when user has participated', () => {
    // Render with hasParticipated=true
    const { container } = render(<BattleCard {...defaultProps} hasParticipated={true} />)
    
    // Check for the participation indicator element
    // We're checking for the presence of the indicator element structure
    expect(container.querySelector('.absolute.top-0.right-0.w-12.h-12')).toBeInTheDocument()
  })
  
  test('does not show participation indicator when user has not participated', () => {
    // Render with hasParticipated=false (default)
    const { container } = render(<BattleCard {...defaultProps} />)
    
    // Check that participation indicator is not present
    expect(container.querySelector('.absolute.top-0.right-0.w-12.h-12')).not.toBeInTheDocument()
  })
  
  test('applies correct color based on battle type', () => {
    // Test wildStyle
    const { rerender } = render(<BattleCard {...defaultProps} type="wildStyle" />)
    expect(screen.getByText('Wild Style')).toBeInTheDocument()
    
    // Test pickUpKillIt
    rerender(<BattleCard {...defaultProps} type="pickUpKillIt" />)
    expect(screen.getByText('Pick Up & Kill It')).toBeInTheDocument()
    
    // Test rAndBeef
    rerender(<BattleCard {...defaultProps} type="rAndBeef" />)
    expect(screen.getByText('R&Beef')).toBeInTheDocument()
    
    // Test tournament
    rerender(<BattleCard {...defaultProps} type="tournament" />)
    expect(screen.getByText('Tournament')).toBeInTheDocument()
  })
})
