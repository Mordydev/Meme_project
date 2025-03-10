import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs'

/**
 * GET handler for fetching a specific battle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const battleId = params.id
  
  try {
    // Simulate API call to backend
    // In a real implementation, this would call the backend service
    const battle = generateMockBattle(battleId)
    
    if (!battle) {
      return new Response(JSON.stringify({ error: 'Battle not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    return new Response(JSON.stringify(battle), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error(`Error fetching battle ${battleId}:`, error)
    return new Response(JSON.stringify({ error: 'Failed to fetch battle' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

/**
 * Generate a mock battle for development
 */
function generateMockBattle(battleId: string) {
  const battleTypes = ['wildStyle', 'pickUpKillIt', 'rAndBeef', 'tournament']
  const statuses = ['scheduled', 'active', 'voting', 'completed']
  
  // Generate random battle data
  const now = new Date()
  const battleType = battleTypes[Math.floor(Math.random() * battleTypes.length)]
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  
  // Set time based on status
  let startTime, endTime, votingStartTime, votingEndTime
  
  switch (status) {
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
  
  return {
    id: battleId,
    title: getBattleTitle(battleType),
    description: `This is a ${battleType} battle where participants showcase their talent. Show your skills and compete with other creators on the Wild 'n Out platform!`,
    battleType,
    status,
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
}

/**
 * Get a battle title based on battle type
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
