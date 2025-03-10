'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface BattleParticipantListProps {
  participants: {
    id: string
    userId: string
    displayName: string
    avatarUrl?: string
    submissionTime: string
  }[]
}

export function BattleParticipantList({ participants }: BattleParticipantListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter participants based on search query
  const filteredParticipants = participants.filter(participant => 
    participant.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Format the submission time
  const formatSubmissionTime = (submissionTime: string) => {
    return new Date(submissionTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }
  
  if (participants.length === 0) {
    return (
      <div className="text-center p-12 bg-zinc-800/50 rounded-lg">
        <h3 className="text-xl font-display text-hype-white mb-3">No Participants Yet</h3>
        <p className="text-zinc-400">
          Be the first to join this battle! Submit your entry now.
        </p>
      </div>
    )
  }
  
  return (
    <div className="mt-6">
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          type="search"
          placeholder="Search participants..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Participants count */}
      <div className="mb-4 text-sm text-zinc-400">
        {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
      </div>
      
      {/* Participant list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParticipants.map((participant) => (
          <Card key={participant.id} className="bg-zinc-800/60 border-zinc-700">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  {participant.avatarUrl ? (
                    <AvatarImage src={participant.avatarUrl} alt={participant.displayName} />
                  ) : (
                    <AvatarFallback>{participant.displayName[0].toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-hype-white truncate">
                    {participant.displayName}
                  </div>
                  <div className="text-sm text-zinc-400">
                    Joined {formatSubmissionTime(participant.submissionTime)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredParticipants.length === 0 && (
        <div className="text-center p-6 bg-zinc-800/50 rounded-lg">
          <p className="text-zinc-400">
            No participants match your search.
          </p>
        </div>
      )}
    </div>
  )
}
