import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBattle, getBattleParticipants, getBattleEntries } from '@/lib/data/battles'
import { BattleHeader } from '@/components/features/battle/battle-header'
import { BattleActions } from '@/components/features/battle/battle-actions'
import { BattleEntries } from '@/components/features/battle/battle-entries'
import { Card, CardContent } from '@/components/ui/card'

interface BattleDetailPageProps {
  params: {
    id: string
  }
}

// Generate dynamic metadata for the battle page
export async function generateMetadata({ params }: BattleDetailPageProps): Promise<Metadata> {
  try {
    const battle = await getBattle(params.id)
    
    return {
      title: `${battle.title} | Battle Arena | Wild 'n Out`,
      description: battle.description,
      openGraph: {
        title: `${battle.title} | Wild 'n Out Battle Arena`,
        description: battle.description,
        type: 'website'
      }
    }
  } catch (error) {
    return {
      title: 'Battle | Wild 'n Out',
      description: 'Wild 'n Out style battles'
    }
  }
}

export default async function BattleDetailPage({ params }: BattleDetailPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<BattleHeaderSkeleton />}>
        <BattleHeaderSection battleId={params.id} />
      </Suspense>
      
      <Suspense fallback={<div className="h-10 w-full bg-zinc-800 animate-pulse rounded-md mt-6"></div>}>
        <BattleActionsSection battleId={params.id} />
      </Suspense>
      
      <Suspense fallback={<EntriesSkeleton />}>
        <BattleEntriesSection battleId={params.id} />
      </Suspense>
    </div>
  )
}

// Server Component for battle header with data fetching
async function BattleHeaderSection({ battleId }: { battleId: string }) {
  try {
    const battle = await getBattle(battleId)
    
    if (!battle) {
      notFound()
    }
    
    // Extract rules from battle if available
    const rules = {
      mediaTypes: ['text', 'image', 'audio'],
      submissionTimeLimit: 30,
      maxParticipants: 50
    }
    
    return <BattleHeader battle={battle} rules={rules} />
  } catch (error) {
    console.error('Error fetching battle details:', error)
    return (
      <Card className="bg-roast-red/20 border-roast-red">
        <CardContent className="pt-6">
          <h2 className="text-xl font-medium text-roast-red">Error Loading Battle</h2>
          <p className="mt-2">This battle could not be loaded. It may have been removed or is unavailable.</p>
        </CardContent>
      </Card>
    )
  }
}

// Server Component for battle actions with data fetching
async function BattleActionsSection({ battleId }: { battleId: string }) {
  try {
    const battle = await getBattle(battleId)
    
    if (!battle) {
      notFound()
    }
    
    return <BattleActions battleId={battleId} status={battle.status} />
  } catch (error) {
    console.error('Error fetching battle actions:', error)
    return null // Hide actions section on error
  }
}

// Server Component for battle entries with data fetching
async function BattleEntriesSection({ battleId }: { battleId: string }) {
  try {
    const battle = await getBattle(battleId)
    
    if (!battle) {
      notFound()
    }
    
    // Only fetch entries if the battle is in voting or completed state
    let entries = []
    if (battle.status === 'voting' || battle.status === 'completed') {
      entries = await getBattleEntries(battleId)
    }
    
    // Fetch participants for active or completed battles
    let participants = []
    if (battle.status === 'active' || battle.status === 'completed') {
      participants = await getBattleParticipants(battleId)
    }
    
    return (
      <BattleEntries 
        battleId={battleId} 
        status={battle.status} 
        entries={entries} 
        participants={participants} 
      />
    )
  } catch (error) {
    console.error('Error fetching battle entries:', error)
    return (
      <Card className="bg-zinc-800/50 border-zinc-700 mt-6">
        <CardContent className="pt-6">
          <h2 className="text-xl font-medium text-hype-white">Entries Unavailable</h2>
          <p className="mt-2 text-zinc-400">Entries for this battle cannot be displayed right now. Please try again later.</p>
        </CardContent>
      </Card>
    )
  }
}

// Skeleton loaders for suspense boundaries
function BattleHeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-24 bg-zinc-800 rounded-full"></div>
        <div className="h-6 w-16 bg-zinc-800 rounded-full"></div>
      </div>
      <div className="h-10 w-3/4 bg-zinc-800 rounded-md"></div>
      <div className="h-4 w-1/2 bg-zinc-800 rounded-md mt-4"></div>
      <div className="h-4 w-1/4 bg-zinc-800 rounded-md mt-2"></div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-800 rounded-md"></div>
        ))}
      </div>
    </div>
  )
}

function EntriesSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-40 bg-zinc-800 rounded-md"></div>
      ))}
    </div>
  )
}
