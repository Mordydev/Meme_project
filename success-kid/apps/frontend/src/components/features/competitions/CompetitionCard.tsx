'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, ChevronRight, Check, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompetitionSummary } from '@/types/leaderboard';
import { cn, formatDate } from '@/lib/utils';
import { useReducedMotion } from '@/hooks';

// Status badge styles
const STATUS_BADGE = {
  active: { variant: 'default', icon: Trophy, label: 'Active' },
  upcoming: { variant: 'secondary', icon: Clock, label: 'Upcoming' },
  past: { variant: 'outline', icon: Check, label: 'Completed' },
};

export interface CompetitionCardProps {
  competition: CompetitionSummary;
  onClick?: () => void;
  className?: string;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  onClick,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const {
    id,
    title,
    description,
    status,
    startDate,
    endDate,
    participantCount,
    isTeamBased,
    rewards,
    userStatus,
  } = competition;
  
  // Status badge configuration
  const badge = STATUS_BADGE[status];
  const BadgeIcon = badge.icon;
  
  // Format dates
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  
  // Determine if competition is active and open for participation
  const isActive = status === 'active';
  const canParticipate = isActive && userStatus !== 'participating';
  
  return (
    <motion.div
      initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={!prefersReducedMotion ? { y: -5 } : undefined}
      className={cn(className)}
    >
      <Card className={cn(
        'h-full transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer'
      )} onClick={onClick}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            
            <Badge variant={badge.variant as any} className="flex items-center gap-1 px-2">
              <BadgeIcon size={14} />
              <span>{badge.label}</span>
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Competition details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center text-sm">
                <Calendar size={16} className="mr-2 text-neutral-500" />
                <div>
                  <div className="font-medium">Dates</div>
                  <div className="text-neutral-500">
                    {formattedStartDate} - {formattedEndDate}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-sm">
                <Users size={16} className="mr-2 text-neutral-500" />
                <div>
                  <div className="font-medium">Participants</div>
                  <div className="text-neutral-500">
                    {participantCount} {isTeamBased ? 'teams' : 'users'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top rewards */}
            <div>
              <h4 className="text-sm font-medium mb-2">Top Rewards</h4>
              <div className="grid grid-cols-2 gap-2">
                {rewards.slice(0, 2).map((reward, index) => (
                  <div 
                    key={`reward-${index}`}
                    className="p-2 bg-neutral-50 rounded border border-neutral-200 text-sm"
                  >
                    <div className="font-medium">
                      {typeof reward.rank === 'number' ? `${reward.rank}${getOrdinalSuffix(reward.rank)} Place` : reward.rank}
                    </div>
                    <div className="text-neutral-600">
                      {reward.value} {reward.type === 'points' ? 'SP' : reward.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-4 border-t">
          {userStatus === 'participating' ? (
            <Badge variant="success" className="mr-2">Participating</Badge>
          ) : userStatus === 'ineligible' ? (
            <Badge variant="outline" className="mr-2">Not Eligible</Badge>
          ) : null}
          
          <Button 
            variant="outline" 
            className="ml-auto flex items-center"
            onClick={onClick}
          >
            View Details
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// Helper function to get ordinal suffix
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}
