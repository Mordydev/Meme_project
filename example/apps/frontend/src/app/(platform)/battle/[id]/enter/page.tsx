import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ContentCreation } from '@/components/features/creation'

interface BattleEntryPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: BattleEntryPageProps): Promise<Metadata> {
  const battle = await getBattle(params.id)
  
  if (!battle) {
    return {
      title: 'Battle Not Found | Wild 'n Out',
    }
  }
  
  return {
    title: `Enter ${battle.title} | Wild 'n Out`,
    description: `Create and submit your entry for ${battle.title} on the Wild 'n Out platform`,
  }
}

// Mock function to get battle data - would be a real API call in production
async function getBattle(id: string) {
  // For demonstration purposes, using static data
  const MOCK_BATTLES = [
    {
      id: 'battle-123',
      title: 'Wild Style Battle',
      description: 'Show your freestyle skills with celebrity impressions.',
      battleType: 'wildStyle',
      creatorId: 'user-1',
      status: 'active',
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(), // 5 hours from now
      votingStartTime: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(), // 5 hours from now
      votingEndTime: new Date(Date.now() + 1000 * 60 * 60 * 29).toISOString(), // 29 hours from now
      participantCount: 15,
      entryCount: 15,
      voteCount: 0,
      featured: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    },
    {
      id: 'battle-456',
      title: 'R&Beef Challenge',
      description: 'Create a short rap about your favorite Wild 'n Out moment.',
      battleType: 'rAndBeef',
      creatorId: 'user-1',
      status: 'active',
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString(), // 10 hours from now
      votingStartTime: new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString(), // 10 hours from now
      votingEndTime: new Date(Date.now() + 1000 * 60 * 60 * 34).toISOString(), // 34 hours from now
      participantCount: 25,
      entryCount: 25,
      voteCount: 0,
      featured: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    },
    {
      id: 'battle-789',
      title: 'Pick Up & Kill It',
      description: 'Make up a funny joke using these three words: stage, mic, laugh.',
      battleType: 'pickUpKillIt',
      creatorId: 'user-1',
      status: 'active',
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), // 10 hours ago
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 14).toISOString(), // 14 hours from now
      votingStartTime: new Date(Date.now() + 1000 * 60 * 60 * 14).toISOString(), // 14 hours from now
      votingEndTime: new Date(Date.now() + 1000 * 60 * 60 * 38).toISOString(), // 38 hours from now
      participantCount: 35,
      entryCount: 35,
      voteCount: 0,
      featured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    }
  ]
  
  return MOCK_BATTLES.find(battle => battle.id === id) || null
}

export default async function BattleEntryPage({ params }: BattleEntryPageProps) {
  const battle = await getBattle(params.id)
  
  if (!battle) {
    notFound()
  }
  
  if (battle.status !== 'active') {
    // In a real app, redirect to battle page with explanation
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-roast-red/10 border border-roast-red rounded-lg p-6 text-center">
          <h1 className="text-2xl font-display text-roast-red mb-4">Battle Not Available</h1>
          <p className="text-zinc-300 mb-4">
            This battle is no longer accepting entries. The battle is currently in {battle.status} status.
          </p>
          <a href={`/battle/${params.id}`} className="inline-block px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md">
            View Battle Details
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a href={`/battle/${params.id}`} className="text-flow-blue hover:underline flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Battle
        </a>
      </div>
      
      <h1 className="text-3xl font-display text-hype-white mb-2">Enter {battle.title}</h1>
      <p className="text-zinc-400 mb-6">{battle.description}</p>
      
      <div className="bg-zinc-800/50 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-battle-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span className="text-zinc-300">
            Submission deadline: <span className="text-battle-yellow font-medium">
              {new Date(battle.endTime).toLocaleString()}
            </span>
          </span>
        </div>
      </div>
      
      <ContentCreation
        initialContext="battle"
        battleId={params.id}
        availableBattles={[battle]}
      />
    </div>
  )
}
