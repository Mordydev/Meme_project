'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EntryDisplay } from './entry-display'
import { BattleEntry } from '@/types/battle'
import { Crown, Trophy, Award, Medal, Share } from 'lucide-react'
import confetti from 'canvas-confetti'

interface ResultsDisplayProps {
  battleId: string
  entries: BattleEntry[]
  status: 'voting' | 'completed'
  userVotedEntryId?: string
}

export function ResultsDisplay({
  battleId,
  entries,
  status,
  userVotedEntryId
}: ResultsDisplayProps) {
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false)
  
  // Sort entries by vote count (descending)
  const sortedEntries = [...entries].sort((a, b) => b.voteCount - a.voteCount)
  
  // Get top 3 entries
  const topEntries = sortedEntries.slice(0, 3)
  
  // Find entry that the user voted for
  const userVotedEntry = userVotedEntryId 
    ? entries.find(entry => entry.id === userVotedEntryId)
    : undefined
  
  // Trigger celebration effect on first render for completed battles
  useEffect(() => {
    if (status === 'completed' && !hasTriggeredCelebration && topEntries.length > 0) {
      // Celebration confetti effect
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      })
      
      setHasTriggeredCelebration(true)
    }
  }, [status, hasTriggeredCelebration, topEntries.length])
  
  // Get rank badge based on position
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-8 w-8 text-battle-yellow" />
      case 1:
        return <Medal className="h-7 w-7 text-flow-blue" />
      case 2:
        return <Award className="h-6 w-6 text-victory-green" />
      default:
        return null
    }
  }
  
  // If voting is still in progress and there are no entries yet
  if (status === 'voting' && entries.length === 0) {
    return (
      <div className="text-center p-12 bg-zinc-800/50 rounded-lg">
        <h3 className="text-xl font-display text-hype-white mb-3">Voting in Progress</h3>
        <p className="text-zinc-400">
          Results will be available once voting is complete.
        </p>
      </div>
    )
  }
  
  return (
    <div className="mt-6">
      {/* Status badge */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display text-hype-white">Battle Results</h2>
        <Badge variant={status === 'completed' ? 'secondary' : 'warning'}>
          {status === 'completed' ? 'Final Results' : 'Preliminary Results'}
        </Badge>
      </div>
      
      {/* Top entries section */}
      <div className="mb-8">
        <h3 className="text-xl font-medium mb-4">Top Entries</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topEntries.map((entry, index) => (
            <Card key={entry.id} className={`
              border 
              ${index === 0 ? 'border-battle-yellow bg-battle-yellow/5' : ''}
              ${index === 1 ? 'border-flow-blue bg-flow-blue/5' : ''}
              ${index === 2 ? 'border-victory-green bg-victory-green/5' : ''}
              ${index > 2 ? 'border-zinc-700 bg-zinc-800/50' : ''}
            `}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getRankBadge(index)}
                    <span className="font-display text-lg">
                      {index === 0 ? '1st Place' : index === 1 ? '2nd Place' : '3rd Place'}
                    </span>
                  </div>
                  <Badge variant="outline">{entry.voteCount} votes</Badge>
                </div>
                
                <EntryDisplay entry={entry} />
                
                {/* Show indicator if this is the entry the user voted for */}
                {entry.id === userVotedEntryId && (
                  <div className="mt-3 bg-zinc-800 p-2 rounded-md">
                    <p className="text-sm text-center text-hype-white">
                      You voted for this entry
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* User's voted entry (if not in top 3) */}
      {userVotedEntry && !topEntries.slice(0, 3).find(e => e.id === userVotedEntry.id) && (
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4">Your Vote</h3>
          
          <Card className="border border-zinc-700 bg-zinc-800/50">
            <CardContent className="pt-6">
              <EntryDisplay entry={userVotedEntry} />
              <div className="mt-3 bg-zinc-700/50 p-2 rounded-md">
                <p className="text-sm text-center text-hype-white">
                  This entry received {userVotedEntry.voteCount} votes and ranked #{
                    sortedEntries.findIndex(e => e.id === userVotedEntry.id) + 1
                  } out of {entries.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Share results button (for completed battles) */}
      {status === 'completed' && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" className="gap-2">
            <Share className="h-4 w-4" />
            Share Results
          </Button>
        </div>
      )}
    </div>
  )
}
