'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EntryList } from './entry-list'
import { VotingInterface } from './voting-interface'
import { ResultsDisplay } from './results-display'
import { BattleParticipantList } from './participant-list'
import { useBattleStore } from '@/lib/state/battle-store'
import { BattleEntry } from '@/types/battle'

interface BattleEntriesProps {
  battleId: string
  status: 'scheduled' | 'active' | 'voting' | 'completed'
  entries: BattleEntry[]
  participants: any[]
}

export function BattleEntries({ 
  battleId, 
  status, 
  entries = [], 
  participants = [] 
}: BattleEntriesProps) {
  // Get user's vote from store if they've already voted
  const { hasVotedInBattle, getVotedEntryId } = useBattleStore()
  const [activeTab, setActiveTab] = useState<string>(getInitialTab())
  
  // Determine the initial tab based on battle status
  function getInitialTab() {
    if (status === 'voting' && !hasVotedInBattle(battleId)) {
      return 'vote'
    } else if (status === 'voting' || status === 'completed') {
      return 'results'
    } else {
      return 'participants'
    }
  }
  
  // Refresh active tab when status changes
  useEffect(() => {
    setActiveTab(getInitialTab())
  }, [status])
  
  // Display message if no entries yet
  if (status === 'voting' && entries.length === 0) {
    return (
      <div className="text-center p-12 bg-zinc-800/50 rounded-lg mt-8">
        <h3 className="text-xl font-display text-hype-white mb-3">No Entries Yet</h3>
        <p className="text-zinc-400">
          Voting will begin once entries have been submitted and reviewed.
        </p>
      </div>
    )
  }
  
  // Display message if no participants yet
  if (status === 'active' && participants.length === 0) {
    return (
      <div className="text-center p-12 bg-zinc-800/50 rounded-lg mt-8">
        <h3 className="text-xl font-display text-hype-white mb-3">No Participants Yet</h3>
        <p className="text-zinc-400">
          Be the first to join this battle! Submit your entry now.
        </p>
      </div>
    )
  }
  
  return (
    <div className="mt-8">
      {/* Tab navigation - different tabs based on status */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-3 lg:w-auto">
          {status === 'active' && (
            <TabsTrigger value="participants">Participants</TabsTrigger>
          )}
          
          {status === 'voting' && !hasVotedInBattle(battleId) && (
            <TabsTrigger value="vote">Vote Now</TabsTrigger>
          )}
          
          {(status === 'voting' || status === 'completed') && (
            <TabsTrigger value="results">Results</TabsTrigger>
          )}
          
          {(status === 'voting' || status === 'completed') && (
            <TabsTrigger value="entries">All Entries</TabsTrigger>
          )}
        </TabsList>
        
        {/* Tab content */}
        {status === 'active' && (
          <TabsContent value="participants">
            <BattleParticipantList participants={participants} />
          </TabsContent>
        )}
        
        {status === 'voting' && !hasVotedInBattle(battleId) && (
          <TabsContent value="vote">
            <VotingInterface
              battleId={battleId}
              entries={entries}
              onVotingComplete={() => setActiveTab('results')}
            />
          </TabsContent>
        )}
        
        {(status === 'voting' || status === 'completed') && (
          <TabsContent value="results">
            <ResultsDisplay
              battleId={battleId}
              entries={entries}
              status={status}
              userVotedEntryId={getVotedEntryId(battleId)}
            />
          </TabsContent>
        )}
        
        {(status === 'voting' || status === 'completed') && (
          <TabsContent value="entries">
            <EntryList
              entries={entries}
              userVotedEntryId={getVotedEntryId(battleId)}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
