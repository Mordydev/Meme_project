'use client';

import React from 'react';
import { CompetitionHub } from '@/components/features/competitions';
import { useRouter } from 'next/navigation';

export default function CompetitionsPage() {
  const router = useRouter();
  
  // Handle competition selection
  const handleCompetitionSelect = (competitionId: string) => {
    router.push(`/competitions/${competitionId}`);
  };
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <h1 className="text-3xl font-bold mb-2">Competitions</h1>
      <p className="text-neutral-500 mb-8">
        Join competitions, complete objectives, and earn rewards by working together with the community
      </p>
      
      <CompetitionHub 
        filter="active"
        onCompetitionSelect={handleCompetitionSelect}
      />
    </div>
  );
}
