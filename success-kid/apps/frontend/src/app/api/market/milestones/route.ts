import { NextRequest } from 'next/server';

/**
 * Get milestone data for market cap tracking
 */
export async function GET(request: NextRequest) {
  // Current market cap - this would come from real API in production
  const currentMarketCap = 625000;
  
  // Define the milestone progression
  const milestones = [
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
      description: 'Significant market presence',
      achievedAt: null
    },
    {
      id: 'milestone_10m',
      value: 10000000,
      label: '$10M',
      description: 'Established market position',
      achievedAt: null
    },
    {
      id: 'milestone_50m',
      value: 50000000,
      label: '$50M',
      description: 'Major market milestone',
      achievedAt: null
    },
    {
      id: 'milestone_100m',
      value: 100000000,
      label: '$100M',
      description: 'Dream milestone achievement',
      achievedAt: null
    }
  ];
  
  // Find the next milestone
  const nextMilestoneIndex = milestones.findIndex(milestone => !milestone.achievedAt);
  const nextMilestone = milestones[nextMilestoneIndex];
  
  // Calculate progress percentage
  const previousMilestoneValue = nextMilestoneIndex > 0 
    ? milestones[nextMilestoneIndex - 1].value 
    : 0;
  
  const progressRange = nextMilestone.value - previousMilestoneValue;
  const currentProgress = currentMarketCap - previousMilestoneValue;
  const progressPercentage = (currentProgress / progressRange) * 100;
  
  return Response.json({
    data: {
      currentMarketCap,
      milestones,
      nextMilestone: {
        ...nextMilestone,
        progress: progressPercentage
      },
      lastUpdated: new Date().toISOString()
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
