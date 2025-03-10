import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs'

/**
 * GET handler for fetching battles with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    
    // Simulate API call to backend
    // In a real implementation, this would call the backend service
    const mockBattles = generateMockBattles(status, type, limit)
    
    return new Response(JSON.stringify(mockBattles), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error fetching battles:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch battles' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

/**
 * POST handler for creating a new battle
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  const { userId } = auth()
  
  // Check if user is authenticated
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
  
  try {
    const battleData = await request.json()
    
    // Validate required fields
    if (!battleData.title || !battleData.battleType || !battleData.endTime) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    // Simulate battle creation
    // In a real implementation, this would call the backend service
    const newBattle = {
      id: `battle-${Date.now()}`,
      creatorId: userId,
      title: battleData.title,
      description: battleData.description || '',
      battleType: battleData.battleType,
      status: 'active',
      startTime: new Date().toISOString(),
      endTime: battleData.endTime,
      votingStartTime: battleData.endTime,
      votingEndTime: new Date(new Date(battleData.endTime).getTime() + 24 * 60 * 60 * 1000).toISOString(),
      participantCount: 0,
      entryCount: 0,
      voteCount: 0,
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    return new Response(JSON.stringify(newBattle), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error creating battle:', error)
    return new Response(JSON.stringify({ error: 'Failed to create battle' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

/**
 * Generate mock battles for development
 */
function generateMockBattles(
  status: string | null, 
  type: string | null, 
  limit: number
) {
  const battleTypes = ['wildStyle', 'pickUpKillIt', 'rAndBeef', 'tournament']
  const statuses = ['scheduled', 'active', 'voting', 'completed']
  
  // Filter by status and type if provided
  const filteredTypes = type && type !== 'all' ? [type] : battleTypes
  const filteredStatuses = status && status !== 'all' ? [status] : statuses
  
  // Generate random battles
  const battles = []
  
  for (let i = 0; i < 20; i++) {
    const battleType = filteredTypes[Math.floor(Math.random() * filteredTypes.length)]
    const battleStatus = filteredStatuses[Math.floor(Math.random() * filteredStatuses.length)]
    
    // Set time based on status
    const now = new Date()
    let startTime, endTime, votingStartTime, votingEndTime
    
    switch (battleStatus) {
      case 'scheduled':
        startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
        endTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
        votingStartTime = endTime
        votingEndTime = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days from now
        break
      case 'active':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
        endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
        votingStartTime = endTime
        votingEndTime = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days from now
        break
      case 'voting':
        startTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        endTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
        votingStartTime = endTime
        votingEndTime = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
        break
      case 'completed':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        endTime = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        votingStartTime = endTime
        votingEndTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        break
    }
    
    const battle = {
      id: `battle-${i + 1}`,
      title: getBattleTitle(battleType),
      description: `This is a ${battleType} battle. Show your skills and compete with other creators!`,
      battleType,
      status: battleStatus,
      creatorId: `user-${Math.floor(Math.random() * 100)}`,
      startTime,
      endTime,
      votingStartTime,
      votingEndTime,
      participantCount: Math.floor(Math.random() * 50) + 1,
      entryCount: Math.floor(Math.random() * 30) + 1,
      voteCount: Math.floor(Math.random() * 200),
      featured: Math.random() > 0.8,
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString()
    }
    
    battles.push(battle)
  }
  
  return battles.slice(0, limit)
}

/**
 * Get a random battle title based on battle type
 */
function getBattleTitle(battleType: string) {
  const titles = {
    wildStyle: [
      'Freestyle Frenzy',
      'Wild Style Wednesday',
      'Bars & Laughs Battle',
      'Monday Night Wordplay',
      'Improv Comedy Clash'
    ],
    pickUpKillIt: [
      'Beat Masters Showdown',
      'Flow & Rhythm Battle',
      'Pick Up the Beat',
      'Rhythm Riders Battle',
      'Beat Flow Showcase'
    ],
    rAndBeef: [
      'Melody & Punchlines',
      'Singer's Roast Battle',
      'R&Beef Throwdown',
      'Singing Showdown',
      'Melodic Diss Track'
    ],
    tournament: [
      'Championship Rounds',
      'Tournament of Champions',
      'Elimination Challenge',
      'Wild Card Tournament',
      'Final Showdown Series'
    ]
  }
  
  const typeList = titles[battleType as keyof typeof titles] || titles.wildStyle
  return typeList[Math.floor(Math.random() * typeList.length)]
}
