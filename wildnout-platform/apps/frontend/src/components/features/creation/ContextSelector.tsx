'use client'

import React from 'react'
import { Battle } from '@/types/battle'

interface ContextSelectorProps {
  selectedContext: 'battle' | 'community' | null
  selectedBattleId?: string | null
  availableBattles: Battle[]
  onChange: (context: 'battle' | 'community', battleId?: string) => void
  className?: string
}

export default function ContextSelector({
  selectedContext,
  selectedBattleId,
  availableBattles,
  onChange,
  className = '',
}: ContextSelectorProps) {
  // Filter to active battles only
  const activeBattles = availableBattles.filter(battle => battle.status === 'active')
  
  return (
    <div className={`${className}`}>
      <h2 className="text-xl font-display text-hype-white mb-4">Where Would You Like to Share?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => onChange('community')}
          className={`p-6 rounded-lg text-left transition-all ${
            selectedContext === 'community'
              ? 'bg-flow-blue text-hype-white ring-2 ring-offset-2 ring-offset-wild-black ring-flow-blue'
              : 'bg-zinc-800 text-hype-white hover:bg-zinc-700'
          }`}
        >
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <h3 className="text-lg font-medium">Community Feed</h3>
          </div>
          <p className="text-sm opacity-80">
            Share with the entire Wild 'n Out community. Your content will appear in the community feed.
          </p>
        </button>
        
        <div>
          <button
            type="button"
            onClick={() => onChange('battle', selectedBattleId || undefined)}
            className={`p-6 rounded-lg text-left transition-all w-full ${
              selectedContext === 'battle'
                ? 'bg-battle-yellow text-wild-black ring-2 ring-offset-2 ring-offset-wild-black ring-battle-yellow'
                : 'bg-zinc-800 text-hype-white hover:bg-zinc-700'
            }`}
          >
            <div className="flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <h3 className="text-lg font-medium">Battle Entry</h3>
            </div>
            <p className="text-sm opacity-80">
              Submit your content as an entry to an active battle. Compete with others and get votes!
            </p>
          </button>
          
          {selectedContext === 'battle' && (
            <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
              <label className="block text-sm text-zinc-300 mb-2">
                Select a Battle
              </label>
              
              {activeBattles.length === 0 ? (
                <div className="text-sm text-zinc-400 p-3 bg-zinc-700/50 rounded">
                  No active battles available at the moment.
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {activeBattles.map(battle => (
                    <div 
                      key={battle.id}
                      onClick={() => onChange('battle', battle.id)}
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        selectedBattleId === battle.id 
                          ? 'bg-zinc-700 ring-1 ring-battle-yellow' 
                          : 'bg-zinc-700/50 hover:bg-zinc-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-hype-white">{battle.title}</h4>
                        <span className="bg-victory-green/20 text-victory-green text-xs px-2 py-0.5 rounded-full">
                          {battle.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{battle.description}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                        <span>{battle.participantCount} participants</span>
                        <span>Ends in {getTimeRemaining(battle.endTime)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate time remaining
function getTimeRemaining(endTimeString: string): string {
  const endTime = new Date(endTimeString).getTime()
  const now = new Date().getTime()
  const timeRemaining = endTime - now
  
  if (timeRemaining <= 0) {
    return 'Ended'
  }
  
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
  
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  } else {
    const days = Math.floor(hours / 24)
    return `${days} day${days !== 1 ? 's' : ''}`
  }
}
