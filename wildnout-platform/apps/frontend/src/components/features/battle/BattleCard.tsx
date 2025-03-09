'use client'

import React from 'react'
import Link from 'next/link'
import { formatTimeRemaining } from '@/lib/utils'
import { HoverEffect, Transition } from '@/components/animation'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface BattleCardProps {
  id: string
  title: string
  description: string
  battleType: string
  status: 'scheduled' | 'open' | 'voting' | 'completed'
  endTime?: string | Date
  participantCount: number
  hasParticipated?: boolean
  featured?: boolean
  className?: string
}

/**
 * Battle Card component for displaying battle information
 * Uses design system tokens and animation components
 */
export function BattleCard({
  id,
  title,
  description,
  battleType,
  status,
  endTime,
  participantCount,
  hasParticipated = false,
  featured = false,
  className,
  ...props
}: BattleCardProps) {
  // Get appropriate status label
  const getStatusLabel = () => {
    if (status === 'scheduled') return 'Starting Soon'
    if (status === 'open') return 'Open Now'
    if (status === 'voting') return 'Voting Now'
    if (status === 'completed') return 'Completed'
    return ''
  }
  
  // Get appropriate status color
  const getStatusColor = () => {
    if (status === 'scheduled') return 'bg-flow-blue/20 text-flow-blue'
    if (status === 'open') return 'bg-victory-green/20 text-victory-green'
    if (status === 'voting') return 'bg-battle-yellow/20 text-battle-yellow'
    if (status === 'completed') return 'bg-zinc-500/20 text-zinc-400'
    return ''
  }
  
  // Get appropriate action button
  const getActionButton = () => {
    if (status === 'scheduled') {
      return (
        <Button variant="secondary" size="sm">
          Remind Me
        </Button>
      )
    }
    
    if (status === 'open') {
      return (
        <Button variant="primary" size="sm">
          {hasParticipated ? 'View Your Entry' : 'Join Battle'}
        </Button>
      )
    }
    
    if (status === 'voting') {
      return (
        <Button variant="primary" size="sm">
          Vote Now
        </Button>
      )
    }
    
    if (status === 'completed') {
      return (
        <Button variant="ghost" size="sm">
          See Results
        </Button>
      )
    }
  }
  
  return (
    <Transition type="scale" className={cn("", className)}>
      <HoverEffect type={featured ? 'glow' : 'float'}>
        <Link href={`/battle/${id}`}>
          <div 
            className={cn(
              "battle-card relative overflow-hidden rounded-lg border p-5", 
              featured 
                ? "border-battle-yellow/30 bg-zinc-900 shadow-md hover:border-battle-yellow/60" 
                : "border-zinc-800 bg-zinc-900/70"
            )}
            {...props}
          >
            {/* Battle Type Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-accent uppercase text-battle-yellow tracking-wide">
                {battleType}
              </span>
              
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs",
                getStatusColor()
              )}>
                {getStatusLabel()}
              </span>
            </div>
            
            {/* Battle Title & Description */}
            <h3 className="text-xl font-display text-hype-white mb-2 line-clamp-1">
              {title}
            </h3>
            <p className="text-sm text-hype-white/70 mb-4 line-clamp-2">
              {description}
            </p>
            
            {/* Battle Meta */}
            <div className="flex justify-between text-xs text-hype-white/60 mb-4">
              <span>{participantCount} participants</span>
              {endTime && (
                <span>{formatTimeRemaining(endTime)}</span>
              )}
            </div>
            
            {/* Action Button */}
            <div>
              {getActionButton()}
            </div>
            
            {/* Featured Badge (if featured) */}
            {featured && (
              <div className="absolute top-0 right-0 border-l border-b border-battle-yellow/20 bg-wild-black/90 px-3 py-1 rounded-bl-md">
                <span className="text-xs font-medium text-battle-yellow">
                  Featured
                </span>
              </div>
            )}
          </div>
        </Link>
      </HoverEffect>
    </Transition>
  )
}
