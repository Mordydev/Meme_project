import { Suspense } from 'react'
import { Metadata } from 'next'
import { getBattles } from '@/lib/data/battles'
import { BattleDiscovery } from '@/components/features/battle/battle-discovery'

export const metadata: Metadata = {
  title: 'Battle Arena | Wild 'n Out',
  description: 'Compete in Wild 'n Out style battles and showcase your skills',
}

export default function BattlePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display text-hype-white mb-6">Battle Arena</h1>
      
      <Suspense fallback={<BattleLoadingSkeleton />}>
        <BattleDiscoverySection />
      </Suspense>
    </div>
  )
}

async function BattleDiscoverySection() {
  // Default to active battles for initial load
  const battles = await getBattles({ status: 'active' })
  
  return <BattleDiscovery initialBattles={battles} />
}

function BattleLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-9 w-32 bg-zinc-800 rounded-md"></div>
        <div className="h-9 w-32 bg-zinc-800 rounded-md"></div>
      </div>
      
      <div className="h-16 w-full bg-zinc-800 rounded-md mb-6"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-zinc-800 rounded-lg"></div>
        ))}
      </div>
    </div>
  )
}
