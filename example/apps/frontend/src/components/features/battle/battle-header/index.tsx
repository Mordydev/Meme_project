'use client'

import { useEffect } from 'react'
import { Clock, Users, Award, AlertTriangle } from 'lucide-react'
import { Battle } from '@/types/battle'
import { useBattleStore } from '@/lib/state/battle-store'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BattleCountdown } from './battle-countdown'
import { formatTimeRemaining, formatRelativeTime } from '@/lib/utils'

interface BattleHeaderProps {
  battle: Battle
  rules?: any
}

/**
 * Battle header component for displaying battle details
 * Demonstrates using Zustand store within a Client Component
 */
export function BattleHeader({ battle, rules }: BattleHeaderProps) {
  // Access the battle store to track viewed battles
  const { addViewedBattle } = useBattleStore()
  
  // Mark this battle as viewed on mount
  useEffect(() => {
    addViewedBattle(battle.id)
  }, [battle.id, addViewedBattle])
  
  // Format battle timestamps
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }
  
  // Determine status badge color
  const getBadgeVariant = (status: Battle['status']) => {
    switch (status) {
      case 'scheduled': return 'secondary'
      case 'active': return 'success'
      case 'voting': return 'warning'
      case 'completed': return 'default'
      default: return 'default'
    }
  }
  
  // Battle type label mapping
  const battleTypeLabels = {
    wildStyle: "Wild Style",
    pickUpKillIt: "Pick Up & Kill It",
    rAndBeef: "R&Beef",
    tournament: "Tournament"
  }
  
  // Determine if battle is active and has a countdown
  const isActive = battle.status === 'active'
  const isUpcoming = battle.status === 'scheduled'
  const hasTimeRemaining = isActive && new Date(battle.endTime) > new Date()
  
  // Calculate remaining time for active battles
  const endTimeDate = new Date(battle.endTime)
  const now = new Date()
  const msRemaining = endTimeDate.getTime() - now.getTime()
  const hoursRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)))
  
  return (
    <div className="mb-8">
      {/* Battle type and status badges */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Badge 
          variant="outline" 
          className={`text-lg font-display py-1 ${
            battle.battleType === 'wildStyle' ? 'text-battle-yellow border-battle-yellow' :
            battle.battleType === 'pickUpKillIt' ? 'text-flow-blue border-flow-blue' :
            battle.battleType === 'rAndBeef' ? 'text-roast-red border-roast-red' :
            'text-victory-green border-victory-green'
          }`}
        >
          {battleTypeLabels[battle.battleType as keyof typeof battleTypeLabels]}
        </Badge>
        
        <Badge 
          variant={getBadgeVariant(battle.status)}
          className={`text-md animate-${isActive ? 'pulse' : 'none'} ml-2`}
        >
          {battle.status.charAt(0).toUpperCase() + battle.status.slice(1)}
        </Badge>
      </div>
      
      {/* Battle title */}
      <h1 className="text-4xl font-display text-hype-white mb-3">
        {battle.title}
      </h1>
      
      {/* Battle description */}
      <p className="text-hype-white/80 mb-6 text-lg max-w-3xl">
        {battle.description}
      </p>
      
      {/* Battle status indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Time remaining indicator */}
        <Card className={`bg-zinc-800/60 border border-zinc-700 ${isActive ? 'border-victory-green/50' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-zinc-400" />
                <h3 className="font-medium text-hype-white">
                  {isActive ? 'Time Remaining' : isUpcoming ? 'Starts In' : 'Ended'}
                </h3>
              </div>
            </div>
            
            {hasTimeRemaining ? (
              <div className="mt-2">
                <BattleCountdown endTime={battle.endTime} className="text-2xl font-display text-battle-yellow" />
                <div className="text-zinc-400 text-sm mt-1">
                  {formatRelativeTime(new Date(battle.endTime))}
                </div>
              </div>
            ) : (
              <div className="text-xl font-display mt-2">
                {isUpcoming 
                  ? formatTimeRemaining(battle.startTime) 
                  : formatDate(battle.endTime)}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Participants indicator */}
        <Card className="bg-zinc-800/60 border border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <Users className="h-5 w-5 mr-2 text-zinc-400" />
              <h3 className="font-medium text-hype-white">Participants</h3>
            </div>
            <div className="text-xl font-display mt-2">
              {battle.participantCount} 
              <span className="text-zinc-400 text-sm ml-2">
                {battle.participantCount === 1 ? 'participant' : 'participants'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Entries indicator */}
        <Card className="bg-zinc-800/60 border border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <Award className="h-5 w-5 mr-2 text-zinc-400" />
              <h3 className="font-medium text-hype-white">Entries</h3>
            </div>
            <div className="text-xl font-display mt-2">
              {battle.entryCount}
              <span className="text-zinc-400 text-sm ml-2">
                {battle.entryCount === 1 ? 'submission' : 'submissions'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Voting schedule (if active or upcoming) */}
        {(isActive || isUpcoming) && (
          <Card className="bg-zinc-800/60 border border-zinc-700">
            <CardContent className="pt-6">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 mr-2 text-battle-yellow" />
                <h3 className="font-medium text-hype-white">Voting Begins</h3>
              </div>
              <div className="text-base font-display mt-2">
                {formatDate(battle.votingStartTime)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Battle rules section */}
      {rules && (
        <div className="mb-6">
          <h2 className="text-xl font-display text-hype-white mb-3">Battle Rules</h2>
          <Card className="bg-zinc-800/50 border border-zinc-700">
            <CardContent className="pt-6">
              <ul className="space-y-2">
                {rules.mediaTypes && (
                  <li className="flex items-start">
                    <span className="text-battle-yellow mr-2">•</span>
                    <span>
                      <strong className="text-hype-white">Accepted formats:</strong>{' '}
                      {rules.mediaTypes.join(', ')}
                    </span>
                  </li>
                )}
                
                {rules.submissionTimeLimit && (
                  <li className="flex items-start">
                    <span className="text-battle-yellow mr-2">•</span>
                    <span>
                      <strong className="text-hype-white">Time limit:</strong>{' '}
                      {rules.submissionTimeLimit} seconds per submission
                    </span>
                  </li>
                )}
                
                {rules.maxParticipants && (
                  <li className="flex items-start">
                    <span className="text-battle-yellow mr-2">•</span>
                    <span>
                      <strong className="text-hype-white">Maximum participants:</strong>{' '}
                      {rules.maxParticipants}
                    </span>
                  </li>
                )}
                
                {/* Additional battle-type specific rules */}
                {battle.battleType === 'wildStyle' && (
                  <li className="flex items-start">
                    <span className="text-battle-yellow mr-2">•</span>
                    <span>
                      <strong className="text-hype-white">Wild Style Format:</strong>{' '}
                      Your best freestyle in Wild 'n Out style - be creative and bring energy!
                    </span>
                  </li>
                )}
                
                {battle.battleType === 'pickUpKillIt' && (
                  <li className="flex items-start">
                    <span className="text-battle-yellow mr-2">•</span>
                    <span>
                      <strong className="text-hype-white">Pick Up & Kill It Format:</strong>{' '}
                      Continue the beat and make it your own. Keep the flow going!
                    </span>
                  </li>
                )}
                
                {battle.battleType === 'rAndBeef' && (
                  <li className="flex items-start">
                    <span className="text-battle-yellow mr-2">•</span>
                    <span>
                      <strong className="text-hype-white">R&Beef Format:</strong>{' '}
                      Sing and roast simultaneously - make it melodic but keep the punchlines strong.
                    </span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Separator className="my-6 bg-zinc-700" />
    </div>
  )
}
