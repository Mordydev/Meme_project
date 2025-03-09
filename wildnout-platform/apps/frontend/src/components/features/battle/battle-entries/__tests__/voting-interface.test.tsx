import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VotingInterface } from '../voting-interface'
import { useBattleStore } from '@/lib/state/battle-store'
import { voteBattleEntry } from '@/lib/actions/battle-actions'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/lib/state/battle-store', () => ({
  useBattleStore: jest.fn(() => ({
    recordVote: jest.fn(),
    hasVotedInBattle: jest.fn(() => false),
  })),
}))

jest.mock('@/lib/actions/battle-actions', () => ({
  voteBattleEntry: jest.fn(),
}))

// Mock EntryDisplay component
jest.mock('../entry-display', () => ({
  EntryDisplay: ({ entry }: any) => (
    <div data-testid={`entry-${entry.id}`}>{entry.creatorName}</div>
  ),
}))

// Mock confetti
jest.mock('canvas-confetti', () => jest.fn())

describe('VotingInterface Component', () => {
  const battleId = 'battle-123'
  const mockEntries = [
    {
      id: 'entry-1',
      battleId,
      userId: 'user-1',
      creatorName: 'Creator 1',
      content: { type: 'text', body: 'Entry 1 content' },
      voteCount: 5,
      submissionTime: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 'entry-2',
      battleId,
      userId: 'user-2',
      creatorName: 'Creator 2',
      content: { type: 'text', body: 'Entry 2 content' },
      voteCount: 3,
      submissionTime: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 'entry-3',
      battleId, 
      userId: 'user-3',
      creatorName: 'Creator 3',
      content: { type: 'text', body: 'Entry 3 content' },
      voteCount: 1,
      submissionTime: '2025-01-01T00:00:00.000Z'
    }
  ] as any[]
  
  const mockOnVotingComplete = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock voteBattleEntry implementation
    ;(voteBattleEntry as jest.Mock).mockResolvedValue({
      success: true
    })
  })
  
  test('renders voting interface with entry pairs', () => {
    render(
      <VotingInterface
        battleId={battleId}
        entries={mockEntries}
        onVotingComplete={mockOnVotingComplete}
      />
    )
    
    // Check for VS indicator
    expect(screen.getAllByText('VS')).toHaveLength(2) // One for mobile, one for desktop
    
    // Check for voting buttons
    expect(screen.getAllByText('Vote for this entry')).toHaveLength(2)
    
    // Check for progress indicator
    expect(screen.getByText('Voting Progress')).toBeInTheDocument()
    expect(screen.getByText('1 of 1')).toBeInTheDocument() // With 3 entries, we get 1 pairing
  })
  
  test('submits vote when an entry is selected', async () => {
    const mockRecordVote = jest.fn()
    ;(useBattleStore as jest.Mock).mockReturnValue({
      recordVote: mockRecordVote,
      hasVotedInBattle: jest.fn(() => false),
    })
    
    render(
      <VotingInterface
        battleId={battleId}
        entries={mockEntries}
        onVotingComplete={mockOnVotingComplete}
      />
    )
    
    // Vote for the first entry
    fireEvent.click(screen.getAllByText('Vote for this entry')[0])
    
    // Should be submitting
    expect(screen.getAllByText('Submitting...')).toHaveLength(2)
    
    // Check that voteBattleEntry was called with correct data
    expect(voteBattleEntry).toHaveBeenCalled()
    
    // Wait for submission to complete
    await waitFor(() => {
      // Should record vote in store
      expect(mockRecordVote).toHaveBeenCalledWith(battleId, expect.any(String))
      
      // Should call onVotingComplete since it's the last pair
      expect(mockOnVotingComplete).toHaveBeenCalled()
    })
  })
  
  test('shows error message when voting fails', async () => {
    // Setup voteBattleEntry to return an error
    ;(voteBattleEntry as jest.Mock).mockResolvedValue({
      success: false,
      errors: { form: 'Failed to submit vote' }
    })
    
    render(
      <VotingInterface
        battleId={battleId}
        entries={mockEntries}
        onVotingComplete={mockOnVotingComplete}
      />
    )
    
    // Vote for the first entry
    fireEvent.click(screen.getAllByText('Vote for this entry')[0])
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to submit vote')).toBeInTheDocument()
    })
    
    // Should not call onVotingComplete
    expect(mockOnVotingComplete).not.toHaveBeenCalled()
  })
  
  test('shows empty state message when no entries', () => {
    render(
      <VotingInterface
        battleId={battleId}
        entries={[]}
        onVotingComplete={mockOnVotingComplete}
      />
    )
    
    expect(screen.getByText('No Entries to Vote On')).toBeInTheDocument()
    expect(screen.getByText('There aren\'t enough entries to start voting yet. Check back soon!')).toBeInTheDocument()
  })
})
