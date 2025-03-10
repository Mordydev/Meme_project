'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BattleFilter } from './battle-filter'
import { BattleCardGrid } from './battle-card-grid'
import { Battle } from '@/types/battle'
import { useBattleStore } from '@/lib/state/battle-store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FilterIcon, LayoutGrid, LayoutList, RefreshCw } from 'lucide-react'

interface BattleDiscoveryProps {
  initialBattles: Battle[]
}

export function BattleDiscovery({ initialBattles }: BattleDiscoveryProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { battleViewMode, setBattleViewMode } = useBattleStore()
  
  const [battles, setBattles] = useState<Battle[]>(initialBattles)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  
  // Get filter state from URL or defaults
  const initialStatus = searchParams.get('status') || 'active'
  const initialType = searchParams.get('type') || 'all'
  
  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }
  
  // Toggle view mode between grid and list
  const toggleViewMode = () => {
    const newMode = battleViewMode === 'grid' ? 'list' : 'grid'
    setBattleViewMode(newMode)
  }
  
  // Handle filter changes
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
  
  // Handle battle click to navigate to detail page
  const handleBattleClick = (battleId: string) => {
    router.push(`/battle/${battleId}`)
  }
  
  // Handle refresh to reload battles
  const handleRefresh = () => {
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    
    // Build query parameters
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (type && type !== 'all') params.set('type', type)
    
    // Add timestamp to force refresh
    params.set('_t', Date.now().toString())
    
    router.push(`/battle?${params.toString()}`)
  }
  
  return (
    <div className="battle-discovery mt-6">
      {/* Controls header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFilters}
            className="gap-2"
          >
            <FilterIcon className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleViewMode}
          className="gap-2"
        >
          {battleViewMode === 'grid' ? (
            <>
              <LayoutList className="h-4 w-4" />
              List View
            </>
          ) : (
            <>
              <LayoutGrid className="h-4 w-4" />
              Grid View
            </>
          )}
        </Button>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <BattleFilter
          onFilterChange={handleFilterChange}
          initialStatus={initialStatus as any}
          initialType={initialType}
        />
      )}
      
      {/* Battle grid */}
      <BattleCardGrid
        battles={battles}
        onBattleClick={handleBattleClick}
        loading={loading}
        layout={battleViewMode}
        emptyMessage={
          `No ${searchParams.get('status') || ''} battles found. Adjust your filters or check back later!`
        }
      />
    </div>
  )
}
