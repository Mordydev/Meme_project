'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CompetitionStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompetitionCard } from './CompetitionCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/button';
import { useCompetitions } from '@/hooks/queries/competitions';

interface CompetitionHubProps {
  onCompetitionSelect?: (id: string) => void;
  className?: string;
}

/**
 * CompetitionHub
 * 
 * Component for discovering and exploring available competitions
 */
export function CompetitionHub({ onCompetitionSelect, className }: CompetitionHubProps) {
  const [filter, setFilter] = useState<CompetitionStatus>('active');
  
  const { data, isLoading, isError } = useCompetitions({ status: filter });
  
  // Filter tabs
  const filterTabs: { id: CompetitionStatus; label: string }[] = [
    { id: 'active', label: 'Active' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'all', label: 'All' }
  ];
  
  // Handle empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-4">🏆</div>
      <h3 className="text-lg font-medium">No competitions found</h3>
      <p className="text-muted-foreground mt-2 max-w-md">
        {filter === 'active' && "There are no active competitions at the moment. Check back soon!"}
        {filter === 'upcoming' && "There are no upcoming competitions scheduled yet. Check back soon!"}
        {filter === 'past' && "There are no past competitions to display."}
        {filter === 'all' && "No competitions found. We'll be launching new competitions soon!"}
      </p>
    </div>
  );
  
  // Handle error state
  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium">Unable to load competitions</h3>
      <p className="text-muted-foreground mt-2 max-w-md">
        There was an error loading competitions. Please try again later.
      </p>
      <Button 
        variant="outline" 
        className="mt-4"
        onClick={() => window.location.reload()}
      >
        Refresh
      </Button>
    </div>
  );
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b">
        <CardTitle>Competitions</CardTitle>
        <div className="mt-2">
          <div className="inline-flex rounded-md shadow-sm">
            {filterTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={filter === tab.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-none first:rounded-l-md last:rounded-r-md",
                  filter === tab.id ? "bg-primary text-primary-foreground" : ""
                )}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          renderErrorState()
        ) : (data?.competitions && data.competitions.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.competitions.map((competition) => (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                onSelect={onCompetitionSelect}
              />
            ))}
          </div>
        ) : (
          renderEmptyState()
        )}
      </CardContent>
    </Card>
  );
}
