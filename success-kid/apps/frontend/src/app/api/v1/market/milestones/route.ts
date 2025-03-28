import { NextResponse } from 'next/server';
import { Milestone, NextMilestone } from '@/types';

// Defined market cap milestones
const milestoneDefinitions: Milestone[] = [
  {
    id: 'milestone_100k',
    value: 100000,
    label: '$100K',
    description: 'Initial growth milestone',
    achievedAt: '2025-02-15T08:23:12Z'
  },
  {
    id: 'milestone_500k',
    value: 500000,
    label: '$500K',
    description: 'Established community milestone',
    achievedAt: '2025-03-01T12:45:30Z'
  },
  {
    id: 'milestone_1m',
    value: 1000000,
    label: '$1M',
    description: 'Major growth milestone',
    achievedAt: null
  },
  {
    id: 'milestone_5m',
    value: 5000000,
    label: '$5M',
    description: 'Expansion milestone',
    achievedAt: null
  },
  {
    id: 'milestone_10m',
    value: 10000000,
    label: '$10M',
    description: 'Medium-term goal',
    achievedAt: null
  },
  {
    id: 'milestone_50m',
    value: 50000000,
    label: '$50M',
    description: 'Ambitious target',
    achievedAt: null
  },
  {
    id: 'milestone_100m',
    value: 100000000,
    label: '$100M',
    description: 'Long-term vision',
    achievedAt: null
  }
];

// Mock current market cap
const currentMarketCap = 625000;

// Find the next milestone and calculate progress
const findNextMilestone = (marketCap: number, milestones: Milestone[]): NextMilestone => {
  // Find the first milestone that hasn't been achieved yet
  const nextMilestone = milestones.find(milestone => !milestone.achievedAt);
  
  if (!nextMilestone) {
    // All milestones achieved, use the last one as a reference
    const lastMilestone = milestones[milestones.length - 1];
    return {
      ...lastMilestone,
      progress: 100
    };
  }
  
  // Find the previous milestone for calculating progress
  const milestoneIndex = milestones.findIndex(m => m.id === nextMilestone.id);
  const prevMilestone = milestoneIndex > 0 ? milestones[milestoneIndex - 1] : { value: 0 };
  
  // Calculate progress percentage
  const totalRange = nextMilestone.value - prevMilestone.value;
  const currentProgress = marketCap - prevMilestone.value;
  const progressPercentage = Math.min(100, Math.max(0, (currentProgress / totalRange) * 100));
  
  return {
    ...nextMilestone,
    progress: progressPercentage
  };
};

export async function GET() {
  // Get the next milestone with progress
  const nextMilestone = findNextMilestone(currentMarketCap, milestoneDefinitions);
  
  return NextResponse.json({
    data: {
      currentMarketCap,
      milestones: milestoneDefinitions,
      nextMilestone,
      lastUpdated: new Date().toISOString()
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
