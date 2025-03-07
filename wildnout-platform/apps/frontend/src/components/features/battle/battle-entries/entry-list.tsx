'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EntryDisplay } from './entry-display'
import { BattleEntry } from '@/types/battle'
import { ChevronDown, ChevronUp, ThumbsUp } from 'lucide-react'

interface EntryListProps {
  entries: BattleEntry[]
  userVotedEntryId?: string
}

export function EntryList({
  entries,
  userVotedEntryId
}: EntryListProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('votes')
  
  // Sort entries based on selected sort option
  const sortedEntries = [...entries].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.voteCount - a.voteCount
    } else {
      return new Date(b.submissionTime).getTime() - new Date(a.submissionTime).getTime()
    }
  })
  
  if (entries.length === 0) {
    return (
      <div className="text-center p-12 bg-zinc-800/50 rounded-lg">
        <h3 className="text-xl font-display text-hype-white mb-3">No Entries Yet</h3>
        <p className="text-zinc-400">
          There are no entries to display yet. Check back soon!
        </p>
      </div>
    )
  }
  
  return (
    <div className="mt-6">
      {/* Sorting controls */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display text-hype-white">All Entries</h2>
        
        <div className="flex space-x-2">
          <Button
            variant={sortBy === 'votes' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSortBy('votes')}
            className="gap-2"
          >
            <ThumbsUp className="h-4 w-4" />
            Most Votes
          </Button>
          <Button
            variant={sortBy === 'newest' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSortBy('newest')}
            className="gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Newest
          </Button>
        </div>
      </div>
      
      {/* Entry list */}
      <div className="space-y-6">
        {sortedEntries.map((entry) => (
          <Card 
            key={entry.id} 
            className={`border ${
              entry.id === userVotedEntryId 
                ? 'border-battle-yellow bg-battle-yellow/5' 
                : 'border-zinc-700 bg-zinc-800/50'
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <span className="font-display text-hype-white">
                    {entry.creatorName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {entry.voteCount} {entry.voteCount === 1 ? 'vote' : 'votes'}
                  </Badge>
                  {entry.id === userVotedEntryId && (
                    <Badge variant="secondary">Your Vote</Badge>
                  )}
                </div>
              </div>
              
              <EntryDisplay entry={entry} />
              
              <div className="mt-3 text-sm text-zinc-400 text-right">
                {new Date(entry.submissionTime).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
