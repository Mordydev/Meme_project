'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { voteBattleEntry } from '@/lib/actions/battle-actions'
import { useBattleStore } from '@/lib/state/battle-store'
import { BattleEntry } from '@/types/battle'
import { EntryDisplay } from './entry-display'
import confetti from 'canvas-confetti'

interface VotingInterfaceProps {
  battleId: string
  entries: BattleEntry[]
  onVotingComplete: () => void
}

export function VotingInterface({
  battleId,
  entries,
  onVotingComplete
}: VotingInterfaceProps) {
  const { recordVote } = useBattleStore()
  const [pairsToVote, setPairsToVote] = useState<[BattleEntry, BattleEntry][]>([])
  const [currentPairIndex, setCurrentPairIndex] = useState(0)
  const [voteSubmitting, setVoteSubmitting] = useState(false)
  const [voteError, setVoteError] = useState<string | null>(null)
  
  // Generate voting pairs when entries change
  useEffect(() => {
    if (entries.length < 2) return
    
    // Create pairs for head-to-head voting
    const pairs: [BattleEntry, BattleEntry][] = []
    const shuffledEntries = [...entries].sort(() => Math.random() - 0.5)
    
    // Generate pairs ensuring each entry is included
    // For simplicity we're doing a simple pairing here
    // A more sophisticated tournament algorithm could be implemented
    for (let i = 0; i < shuffledEntries.length - 1; i += 2) {
      if (shuffledEntries[i + 1]) {
        pairs.push([shuffledEntries[i], shuffledEntries[i + 1]])
      }
    }
    
    // If odd number of entries, add the last one in a random pair
    if (shuffledEntries.length % 2 !== 0) {
      const lastEntry = shuffledEntries[shuffledEntries.length - 1]
      const randomIndex = Math.floor(Math.random() * (pairs.length))
      
      // Randomly replace either the first or second entry in a random pair
      const pairToModify = [...pairs[randomIndex]]
      const replaceIndex = Math.round(Math.random())
      pairToModify[replaceIndex] = lastEntry
      
      pairs[randomIndex] = pairToModify as [BattleEntry, BattleEntry]
    }
    
    setPairsToVote(pairs)
    setCurrentPairIndex(0)
  }, [entries])
  
  // Handle voting for an entry
  const handleVote = async (entryId: string) => {
    setVoteSubmitting(true)
    setVoteError(null)
    
    try {
      // Submit vote to server
      const formData = new FormData()
      formData.append('battleId', battleId)
      formData.append('entryId', entryId)
      
      const result = await voteBattleEntry({}, formData)
      
      if (result.success) {
        // Record vote in local store
        recordVote(battleId, entryId)
        
        // If this was the last pair, complete voting
        if (currentPairIndex >= pairsToVote.length - 1) {
          // Trigger success confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          })
          
          // Navigate to results
          onVotingComplete()
        } else {
          // Move to next pair
          setCurrentPairIndex(prev => prev + 1)
        }
      } else {
        setVoteError(result.errors?.form || 'Failed to submit vote')
      }
    } catch (error) {
      console.error('Error submitting vote:', error)
      setVoteError('An unexpected error occurred')
    } finally {
      setVoteSubmitting(false)
    }
  }
  
  // If no pairs to vote on, show a message
  if (pairsToVote.length === 0) {
    return (
      <div className="text-center p-12 bg-zinc-800/50 rounded-lg">
        <h3 className="text-xl font-display text-hype-white mb-3">No Entries to Vote On</h3>
        <p className="text-zinc-400">
          There aren't enough entries to start voting yet. Check back soon!
        </p>
      </div>
    )
  }
  
  // Get current pair
  const currentPair = pairsToVote[currentPairIndex]
  
  return (
    <div className="mt-6">
      {/* Voting progress indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-zinc-400 mb-2">
          <span>Voting Progress</span>
          <span>{currentPairIndex + 1} of {pairsToVote.length}</span>
        </div>
        <Progress value={((currentPairIndex + 1) / pairsToVote.length) * 100} />
      </div>
      
      {/* Error message */}
      {voteError && (
        <div className="bg-roast-red/20 border border-roast-red rounded-md p-4 mb-4">
          <p className="text-roast-red">{voteError}</p>
        </div>
      )}
      
      {/* Voting cards with head-to-head comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left entry */}
        <div className="flex flex-col">
          <EntryDisplay entry={currentPair[0]} />
          <Button
            variant="primary"
            size="lg"
            className="mt-4"
            onClick={() => handleVote(currentPair[0].id)}
            disabled={voteSubmitting}
          >
            {voteSubmitting ? 'Submitting...' : 'Vote for this entry'}
          </Button>
        </div>
        
        {/* VS Indicator for larger screens */}
        <div className="hidden md:flex items-center justify-center">
          <div className="relative">
            <div className="absolute -translate-x-1/2 -translate-y-1/2 bg-battle-yellow text-black text-xl font-bold rounded-full h-12 w-12 flex items-center justify-center">
              VS
            </div>
          </div>
        </div>
        
        {/* VS Indicator for mobile */}
        <div className="flex md:hidden items-center justify-center my-2">
          <div className="bg-battle-yellow text-black text-xl font-bold rounded-full h-12 w-12 flex items-center justify-center">
            VS
          </div>
        </div>
        
        {/* Right entry */}
        <div className="flex flex-col">
          <EntryDisplay entry={currentPair[1]} />
          <Button
            variant="primary"
            size="lg"
            className="mt-4"
            onClick={() => handleVote(currentPair[1].id)}
            disabled={voteSubmitting}
          >
            {voteSubmitting ? 'Submitting...' : 'Vote for this entry'}
          </Button>
        </div>
      </div>
    </div>
  )
}
