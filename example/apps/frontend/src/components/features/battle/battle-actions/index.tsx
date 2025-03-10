'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useBattleStore } from '@/lib/state/battle-store'
import { BattleEntryForm } from './battle-entry-form'
import { Share, BadgeCheck, Clock, AlertTriangle, Vote, Award } from 'lucide-react'

interface BattleActionsProps {
  battleId: string
  status: 'scheduled' | 'active' | 'voting' | 'completed'
}

export function BattleActions({ battleId, status }: BattleActionsProps) {
  const [showEntryForm, setShowEntryForm] = useState(false)
  const { hasVotedInBattle, recordVote } = useBattleStore()
  
  // Determine if user can participate
  const canParticipate = status === 'active'
  
  // Determine if user can vote
  const canVote = status === 'voting' && !hasVotedInBattle(battleId)
  
  // Handle join battle button
  const handleJoinBattle = () => {
    setShowEntryForm(true)
  }
  
  // Handle canceling entry
  const handleCancelEntry = () => {
    setShowEntryForm(false)
  }
  
  // Handle successful submission
  const handleSuccessfulSubmission = () => {
    setShowEntryForm(false)
    // Add any other success handling (notifications, etc.)
  }
  
  // Handle going to voting section
  const handleGoToVoting = () => {
    // Scroll to voting section or navigate to it
    document.querySelector('#voting-section')?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // If battle is scheduled
  if (status === 'scheduled') {
    return (
      <div className="flex flex-wrap gap-3 items-center bg-zinc-800/40 border border-zinc-700 p-4 rounded-lg">
        <div className="flex items-center text-hype-white mr-auto">
          <Clock className="h-5 w-5 mr-2 text-zinc-400" />
          <span>This battle hasn't started yet. Check back when it's active!</span>
        </div>
        
        <Button variant="outline" className="gap-2" onClick={() => {}}>
          <Share className="h-4 w-4" />
          Share
        </Button>
      </div>
    )
  }
  
  // If battle is active
  if (status === 'active') {
    if (showEntryForm) {
      return (
        <BattleEntryForm 
          battleId={battleId} 
          onCancel={handleCancelEntry}
          onSuccess={handleSuccessfulSubmission}
        />
      )
    }
    
    return (
      <div className="flex flex-wrap gap-3 items-center bg-zinc-800/40 border border-zinc-700 p-4 rounded-lg">
        <div className="flex items-center text-hype-white mr-auto">
          <BadgeCheck className="h-5 w-5 mr-2 text-victory-green" />
          <span>This battle is active! Submit your entry before it ends.</span>
        </div>
        
        <Button onClick={handleJoinBattle} variant="primary" className="gap-2">
          Join Battle
        </Button>
        
        <Button variant="outline" className="gap-2" onClick={() => {}}>
          <Share className="h-4 w-4" />
          Share
        </Button>
      </div>
    )
  }
  
  // If battle is in voting phase
  if (status === 'voting') {
    return (
      <div className="flex flex-wrap gap-3 items-center bg-zinc-800/40 border border-zinc-700 p-4 rounded-lg">
        <div className="flex items-center text-hype-white mr-auto">
          <Vote className="h-5 w-5 mr-2 text-battle-yellow" />
          <span>
            {hasVotedInBattle(battleId) 
              ? "You've cast your vote! Check out the preliminary results." 
              : "Voting is now open! Review entries and vote for your favorites."}
          </span>
        </div>
        
        {canVote && (
          <Button onClick={handleGoToVoting} variant="primary" className="gap-2">
            Vote Now
          </Button>
        )}
        
        <Button variant="outline" className="gap-2" onClick={() => {}}>
          <Share className="h-4 w-4" />
          Share
        </Button>
      </div>
    )
  }
  
  // If battle is completed
  if (status === 'completed') {
    return (
      <div className="flex flex-wrap gap-3 items-center bg-zinc-800/40 border border-zinc-700 p-4 rounded-lg">
        <div className="flex items-center text-hype-white mr-auto">
          <Award className="h-5 w-5 mr-2 text-battle-yellow" />
          <span>This battle has ended. Check out the final results!</span>
        </div>
        
        <Button variant="outline" className="gap-2" onClick={() => {}}>
          <Share className="h-4 w-4" />
          Share Results
        </Button>
      </div>
    )
  }
  
  // Default fallback
  return null
}
