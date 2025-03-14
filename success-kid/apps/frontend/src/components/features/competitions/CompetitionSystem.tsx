'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CompetitionHub } from './CompetitionHub';
import { CompetitionDetail } from './CompetitionDetail';

interface CompetitionSystemProps {
  className?: string;
}

/**
 * CompetitionSystem
 * 
 * Main component for the competition system, handling navigation between competition list and details
 */
export function CompetitionSystem({ className }: CompetitionSystemProps) {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  
  // Handle competition selection
  const handleCompetitionSelect = (id: string) => {
    setSelectedCompetitionId(id);
  };
  
  // Handle back to list
  const handleBackToList = () => {
    setSelectedCompetitionId(null);
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {selectedCompetitionId ? (
        <CompetitionDetail
          competitionId={selectedCompetitionId}
          onBack={handleBackToList}
        />
      ) : (
        <CompetitionHub
          onCompetitionSelect={handleCompetitionSelect}
        />
      )}
    </div>
  );
}
