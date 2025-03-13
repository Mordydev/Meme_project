'use client';

import React, { useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner';
import { Trophy } from 'lucide-react';
import { CompetitionCard } from './CompetitionCard';
import { useCompetitionStore } from '@/store';
import { CompetitionStatus } from '@/types/leaderboard';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
];

export interface CompetitionHubProps {
  filter?: CompetitionStatus | 'all';
  onCompetitionSelect?: (id: string) => void;
  className?: string;
}

export const CompetitionHub: React.FC<CompetitionHubProps> = ({
  filter = 'active',
  onCompetitionSelect,
  className,
}) => {
  const {
    competitions,
    statusFilter,
    isLoading,
    fetchCompetitions,
    setStatusFilter,
  } = useCompetitionStore();
  
  // Initial fetch
  useEffect(() => {
    fetchCompetitions(filter);
  }, [fetchCompetitions, filter]);
  
  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setStatusFilter(status as CompetitionStatus | 'all');
  };
  
  // Handle competition selection
  const handleCompetitionSelect = (competitionId: string) => {
    if (onCompetitionSelect) {
      onCompetitionSelect(competitionId);
    }
  };
  
  // Empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-neutral-300 mb-3">
        <Trophy size={64} />
      </div>
      <h3 className="text-lg font-semibold text-neutral-700">No competitions available</h3>
      <p className="text-sm text-neutral-500 mt-1">
        {statusFilter === 'active' 
          ? 'There are no active competitions at the moment. Check back soon!'
          : statusFilter === 'upcoming'
            ? 'There are no upcoming competitions scheduled yet.'
            : statusFilter === 'past'
              ? 'There are no past competitions to display.'
              : 'No competitions found with the current filter.'}
      </p>
    </div>
  );
  
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 text-primary" size={20} />
          Competitions
        </CardTitle>
        <CardDescription>
          Participate in community challenges to earn rewards and recognition
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs
          defaultValue={filter}
          value={statusFilter}
          onValueChange={handleStatusChange}
          className="mb-6"
        >
          <TabsList className="mb-4">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Create a tab content for each status */}
          {STATUS_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {isLoading ? (
                <div className="flex justify-center items-center p-12">
                  <Spinner size="lg" />
                </div>
              ) : competitions.length === 0 ? (
                renderEmptyState()
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                  {competitions.map((competition) => (
                    <CompetitionCard
                      key={competition.id}
                      competition={competition}
                      onClick={() => handleCompetitionSelect(competition.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
