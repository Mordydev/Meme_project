import { NextResponse } from 'next/server'

/**
 * GET /api/token/milestones
 * Returns the token market cap milestones and their status
 */
export async function GET() {
  try {
    // In a real implementation, you would fetch this from a database
    // For now, we're returning mock data for development
    
    // Simulate API response latency
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Return mock milestones data based on Wild 'n Out's milestone targets
    return NextResponse.json({
      milestones: [
        {
          id: '1m',
          target: 1000000,
          label: '$1M',
          description: 'Initial milestone demonstrating project viability',
          benefits: ['Initial community building', 'Baseline platform features'],
          achieved: true
        },
        {
          id: '5m',
          target: 5000000,
          label: '$5M',
          description: 'Early growth milestone demonstrating community interest',
          benefits: ['Enhanced platform features', 'Social engagement campaigns'],
          achieved: true
        },
        {
          id: '10m',
          target: 10000000,
          label: '$10M',
          description: 'Substantial market position establishing credibility',
          benefits: ['All core Battle features', 'Enhanced creation tools', 'First community events'],
          achieved: false
        },
        {
          id: '50m',
          target: 50000000,
          label: '$50M',
          description: 'Major growth milestone indicating mainstream potential',
          benefits: ['Advanced battle formats', 'Creator economy features', 'Live streaming events'],
          achieved: false
        },
        {
          id: '100m',
          target: 100000000,
          label: '$100M',
          description: 'Significant market achievement demonstrating serious position',
          benefits: ['Premiere creator showcases', 'Advanced platform features', 'Celebrity battle events'],
          achieved: false
        },
        {
          id: '200m',
          target: 200000000,
          label: '$200M',
          description: 'Major milestone positioning among top entertainment tokens',
          benefits: ['Advanced social features', 'Mainstream creator integration', 'Enhanced holder benefits'],
          achieved: false
        },
        {
          id: '500m',
          target: 500000000,
          label: '$500M',
          description: 'Ultimate milestone establishing market dominance',
          benefits: ['Full ecosystem integration', 'Major event sponsorships', 'Complete platform functionality'],
          achieved: false
        }
      ]
    })
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestone data' },
      { status: 500 }
    )
  }
}
