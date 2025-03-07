'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { InfoIcon, Clock, Users } from "lucide-react"

export interface BattleCardProps {
  id: string
  title: string
  type: 'wildStyle' | 'pickUpKillIt' | 'rAndBeef' | 'tournament'
  status: 'upcoming' | 'active' | 'voting' | 'completed'
  participants: number
  timeRemaining?: string
  hasParticipated?: boolean
  className?: string
  onActionClick?: () => void
}

export function BattleCard({
  id,
  title,
  type,
  status,
  participants,
  timeRemaining,
  hasParticipated = false,
  className,
  onActionClick
}: BattleCardProps) {
  // Type label mapping
  const typeLabels = {
    wildStyle: "Wild Style",
    pickUpKillIt: "Pick Up & Kill It",
    rAndBeef: "R&Beef",
    tournament: "Tournament"
  }
  
  // Status badge variants
  const statusVariants = {
    upcoming: "default",
    active: "success",
    voting: "primary",
    completed: "secondary"
  } as const
  
  // Status badge animation
  const statusAnimation = status === 'active' ? 'pulse' : 'none'
  
  // Get action button text based on battle state
  const getActionText = () => {
    if (status === 'upcoming') return "Remind Me"
    if (status === 'active') return hasParticipated ? "View Entry" : "Join Battle"
    if (status === 'voting') return "Vote Now"
    if (status === 'completed') return "See Results"
    return "View Battle"
  }
  
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-md hover:border-zinc-700",
        className
      )}
    >
      {/* Top gradient accent based on battle type */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          type === 'wildStyle' && "bg-battle-yellow",
          type === 'pickUpKillIt' && "bg-flow-blue",
          type === 'rAndBeef' && "bg-roast-red",
          type === 'tournament' && "bg-victory-green"
        )} 
      />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge 
            className="mb-2" 
            variant="primary"
          >
            {typeLabels[type]}
          </Badge>
          <Badge 
            variant={statusVariants[status]} 
            animation={statusAnimation}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <CardTitle className="text-xl leading-tight line-clamp-2">{title}</CardTitle>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex space-x-4 text-sm text-zinc-400">
          <div className="flex items-center">
            <Users className="mr-1 h-4 w-4" />
            <span>{participants} participants</span>
          </div>
          
          {timeRemaining && (
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>{timeRemaining}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between items-center">
        <Button
          variant="primary"
          size="sm"
          onClick={onActionClick}
        >
          {getActionText()}
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <InfoIcon className="h-4 w-4" />
                <span className="sr-only">Battle Info</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View battle details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
      
      {/* Participated indicator */}
      {hasParticipated && (
        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 -mt-8 -mr-8 rotate-45 bg-victory-green/80" />
          <div className="absolute top-0 right-0 mt-1 mr-1 text-wild-black text-xs font-bold rotate-45">
            • • •
          </div>
        </div>
      )}
    </Card>
  )
}
