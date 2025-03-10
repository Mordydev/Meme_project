import { render, screen, fireEvent } from '@testing-library/react'
import { ResultsDisplay } from '../results-display'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('../entry-display', () => ({
  EntryDisplay: ({ entry }: any) => (
    <div data-testid={`entry-${entry.id}`}>{entry.creatorName}</div>
  ),
}))

// Mock confetti
jest.mock('canvas-confetti', () => jest.fn())

describe('ResultsDisplay Component', () => {
  const battleId = 'battle-123'
  const mockEntries = [
    {
      id: 'entry-1',
      battleId,
      userId: 'user-1',
      creatorName: 'Creator 1',
      content: { type: 'text', body: 'Entry 1 content' },
      voteCount: 10,
      submissionTime: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 'entry-2',
      battleId,
      userId: 'user-2',
      creatorName: 'Creator 2',
      content: { type: 'text', body: 'Entry 2 content' },
      voteCount: 7,
      submissionTime: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 'entry-3',
      battleId, 
      userId: 'user-3',
      creatorName: 'Creator 3',
      content: { type: 'text', body: 'Entry 3 content' },
      voteCount: 3,
      submissionTime: '2025-01-01T00:00:00.000Z'
    }
  ] as any[]
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  test('renders results with correct ranking order', () => {
    render(
      <ResultsDisplay
        battleId={battleId}
        entries={mockEntries}
        status="completed"
      />
    )
    
    // Check for battle results header
    expect(screen.getByText('Battle Results')).toBeInTheDocument()
    
    // Check for final results badge
    expect(screen.getByText('Final Results')).toBeInTheDocument()
    
    // Check for top entries section
    expect(screen.getByText('Top Entries')).toBeInTheDocument()
    
    // Check for place indicators
    expect(screen.getByText('1st Place')).toBeInTheDocument()
    expect(screen.getByText('2nd Place')).toBeInTheDocument()
    expect(screen.getByText('3rd Place')).toBeInTheDocument()
    
    // Check for vote counts
    expect(screen.getByText('10 votes')).toBeInTheDocument()
    expect(screen.getByText('7 votes')).toBeInTheDocument()
    expect(screen.getByText('3 votes')).toBeInTheDocument()
    
    // Verify entries are in the correct order
    const entries = screen.getAllByTestId(/entry-entry-\d/)
    expect(entries[0]).toHaveTextContent('Creator 1') // Top entry
    expect(entries[1]).toHaveTextContent('Creator 2') // Second place
    expect(entries[2]).toHaveTextContent('Creator 3') // Third place
  })
  
  test('shows preliminary results badge when status is voting', () => {
    render(
      <ResultsDisplay
        battleId={battleId}
        entries={mockEntries}
        status="voting"
      />
    )
    
    // Check for preliminary results badge
    expect(screen.getByText('Preliminary Results')).toBeInTheDocument()
  })
  
  test('highlights the entry the user voted for', () => {
    render(
      <ResultsDisplay
        battleId={battleId}
        entries={mockEntries}
        status="completed"
        userVotedEntryId="entry-2"
      />
    )
    
    // Check for "You voted for this entry" message
    expect(screen.getByText('You voted for this entry')).toBeInTheDocument()
  })
  
  test('shows special section for user-voted entry not in top 3', () => {
    // Create entries where the user's vote is not in top 3
    const lotsOfEntries = [
      ...mockEntries,
      {
        id: 'entry-4',
        battleId,
        userId: 'user-4',
        creatorName: 'Creator 4',
        content: { type: 'text', body: 'Entry 4 content' },
        voteCount: 1,
        submissionTime: '2025-01-01T00:00:00.000Z'
      }
    ]
    
    render(
      <ResultsDisplay
        battleId={battleId}
        entries={lotsOfEntries}
        status="completed"
        userVotedEntryId="entry-4"
      />
    )
    
    // Check for "Your Vote" section
    expect(screen.getByText('Your Vote')).toBeInTheDocument()
    
    // Check for vote ranking information
    expect(screen.getByText(/This entry received 1 votes and ranked #4 out of 4/)).toBeInTheDocument()
  })
  
  test('shows share results button for completed battles', () => {
    render(
      <ResultsDisplay
        battleId={battleId}
        entries={mockEntries}
        status="completed"
      />
    )
    
    // Check for share results button
    expect(screen.getByText('Share Results')).toBeInTheDocument()
  })
  
  test('does not show share button for voting battles', () => {
    render(
      <ResultsDisplay
        battleId={battleId}
        entries={mockEntries}
        status="voting"
      />
    )
    
    // Share button should not be present
    expect(screen.queryByText('Share Results')).not.toBeInTheDocument()
  })
  
  test('shows appropriate message when no entries during voting', () => {
    render(
      <ResultsDisplay
        battleId={battleId}
        entries={[]}
        status="voting"
      />
    )
    
    // Check for empty state message
    expect(screen.getByText('Voting in Progress')).toBeInTheDocument()
    expect(screen.getByText('Results will be available once voting is complete.')).toBeInTheDocument()
  })
})
