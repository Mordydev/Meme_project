'use client'

import React from 'react'
import { Celebration, AchievementBadge, StaggerContainer } from '@/components/animation'
import { cn } from '@/lib/utils'

export interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  icon?: React.ReactNode
  unlockedAt?: string
}

export interface AchievementDisplayProps {
  achievements: Achievement[]
  newAchievementId?: string
  className?: string
}

/**
 * Achievement Display component for showing user achievements
 * Uses design system animations and celebration effects
 */
export function AchievementDisplay({
  achievements,
  newAchievementId,
  className,
  ...props
}: AchievementDisplayProps) {
  return (
    <div className={cn("", className)} {...props}>
      <h3 className="text-subhead font-display mb-4">Achievements</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <StaggerContainer staggerAmount={0.05}>
          {achievements.map((achievement) => (
            <div key={achievement.id} className="text-center">
              <AchievementBadge
                name={achievement.name}
                icon={achievement.icon}
                unlocked={achievement.unlocked}
                animate={achievement.id === newAchievementId}
              />
              
              {achievement.unlocked && achievement.unlockedAt && (
                <p className="text-xs text-hype-white/50 mt-1">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </StaggerContainer>
      </div>
      
      {/* New Achievement Celebration */}
      {newAchievementId && (
        <NewAchievementCelebration 
          achievement={achievements.find(a => a.id === newAchievementId)}
        />
      )}
    </div>
  )
}

interface NewAchievementCelebrationProps {
  achievement?: Achievement
}

/**
 * Modal that appears when a new achievement is unlocked
 */
function NewAchievementCelebration({ achievement }: NewAchievementCelebrationProps) {
  const [show, setShow] = React.useState(true)
  
  if (!achievement || !show) return null
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Celebration 
        type="achievement" 
        className="bg-zinc-900 border border-battle-yellow/30 rounded-lg p-6 max-w-md w-full text-center"
      >
        <div className="size-24 rounded-full bg-gradient-to-br from-battle-yellow to-victory-green flex items-center justify-center text-wild-black text-3xl font-bold mx-auto mb-4">
          {achievement.icon || achievement.name.substring(0, 1).toUpperCase()}
        </div>
        
        <h2 className="text-headline font-display text-battle-yellow mb-2">
          Achievement Unlocked!
        </h2>
        
        <h3 className="text-xl mb-4">
          {achievement.name}
        </h3>
        
        <p className="text-hype-white/70 mb-6">
          {achievement.description}
        </p>
        
        <button 
          className="px-6 py-2 bg-battle-yellow text-wild-black rounded-md font-medium"
          onClick={() => setShow(false)}
        >
          Awesome!
        </button>
      </Celebration>
    </div>
  )
}
