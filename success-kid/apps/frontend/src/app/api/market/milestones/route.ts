import { NextRequest } from 'next/server';

/**
 * Get market milestone data
 */
export async function GET(request: NextRequest) {
  // Mock current market cap
  const currentMarketCap = 625000;
  
  // Define milestones
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
      label: '$100M+',
      description: 'Long-term vision',
      achievedAt: null
    }
  ];
  
  // Find next milestone
  let nextMilestone = milestones.find(m => !m.achievedAt);
  
  // Calculate progress toward next milestone
  let progress = 0;
  if (nextMilestone) {
    // Find previous milestone
    const previousMilestoneIndex = milestones.indexOf(nextMilestone) - 1;
    const previousMilestoneValue = previousMilestoneIndex >= 0 ? milestones[previousMilestoneIndex].value : 0;
    
    // Calculate progress percentage
    const range = nextMilestone.value - previousMilestoneValue;
    const achieved = currentMarketCap - previousMilestoneValue;
    progress = Math.round((achieved / range) * 100);
  }
  
  return Response.json({
    data: {
      currentMarketCap,
      milestones,
      nextMilestone: nextMilestone ? {
        id: nextMilestone.id,
        value: nextMilestone.value,
        label: nextMilestone.label,
        description: nextMilestone.description,
        progress
      } : null,
      lastUpdated: new Date().toISOString()
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`
    }
  });
}
