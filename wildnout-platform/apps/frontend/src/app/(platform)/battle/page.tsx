import { Suspense } from 'react'
import { Metadata } from 'next'
import { BattleFilter } from '@/components/features/battle/battle-filter'
import { BattleCardGrid } from '@/components/features/battle/battle-card-grid'
import { getBattles } from '@/lib/data/battles'
import { useBattleStore } from '@/lib/state/battle-store'

export const metadata: Metadata = {
  title: 'Battle Arena | Wild 'n Out',
  description: 'Compete in Wild 'n Out style battles and showcase your skills',
}

export default function BattlePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display text-hype-white mb-6">Battle Arena</h1>
      
      <BattleDiscovery />
    </div>
  )
}

async function BattleDiscovery() {
  // Default to active battles for initial load
  const battles = await getBattles({ status: 'active' })
  
  return (
    <>
      <BattleFilterClient />
      
      <Suspense fallback={<BattleCardGrid battles={[]} loading={true} onBattleClick={() => {}} />}>
        <BattleList initialBattles={battles} />
      </Suspense>
    </>
  )
}

// Client component for filter to maintain state
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

function BattleFilterClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get filter state from URL or defaults
  const initialStatus = searchParams.get('status') || 'active'
  const initialType = searchParams.get('type') || 'all'
  
  const handleFilterChange = (filters: { status?: string; type?: string }) => {
    // Update URL with new filters
    const params = new URLSearchParams(searchParams)
    
    if (filters.status) {
      params.set('status', filters.status)
    } else {
      params.delete('status')
    }
    
    if (filters.type && filters.type !== 'all') {
      params.set('type', filters.type)
    } else {
      params.delete('type')
    }
    
    router.push(`/battle?${params.toString()}`)
  }
  
  return (
    <BattleFilter 
      onFilterChange={handleFilterChange}
      initialStatus={initialStatus as any}
      initialType={initialType}
    />
  )
}

// Client component for battle list to handle navigation
'use client'
function BattleList({ initialBattles }: { initialBattles: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [battles, setBattles] = useState(initialBattles)
  const [loading, setLoading] = useState(false)
  
  // Fetch battles when filters change
  useEffect(() => {
    const fetchFilteredBattles = async () => {
      setLoading(true)
      
      const status = searchParams.get('status')
      const type = searchParams.get('type')
      
      try {
        // Build query parameters
        const params: Record<string, any> = {}
        if (status) params.status = status
        if (type && type !== 'all') params.type = type
        
        const response = await fetch(
          `/api/battles?${new URLSearchParams(params as any).toString()}`
        )
        
        if (response.ok) {
          const data = await response.json()
          setBattles(data)
        }
      } catch (error) {
        console.error('Error fetching battles:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFilteredBattles()
  }, [searchParams])
  
  const handleBattleClick = (battleId: string) => {
    router.push(`/battle/${battleId}`)
  }
  
  return (
    <BattleCardGrid 
      battles={battles}
      onBattleClick={handleBattleClick}
      loading={loading}
      emptyMessage={
        `No ${searchParams.get('status') || ''} battles found. Adjust your filters or check back later!`
      }
    />
  )
}
