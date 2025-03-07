'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface BattleFilterProps {
  onFilterChange: (filters: {
    status?: string;
    type?: string;
  }) => void;
  initialStatus?: string;
  initialType?: string;
}

export function BattleFilter({
  onFilterChange,
  initialStatus = 'all',
  initialType = 'all',
}: BattleFilterProps) {
  const [activeStatus, setActiveStatus] = useState(initialStatus)
  const [activeType, setActiveType] = useState(initialType)

  // Battle type options
  const battleTypes = [
    { value: 'all', label: 'All Battles' },
    { value: 'wildStyle', label: 'Wild Style' },
    { value: 'pickUpKillIt', label: 'Pick Up & Kill It' },
    { value: 'rAndBeef', label: 'R&Beef' },
    { value: 'tournament', label: 'Tournament' },
  ]

  // Update parent component when filters change
  useEffect(() => {
    const filters: { status?: string; type?: string } = {}
    if (activeStatus !== 'all') filters.status = activeStatus
    if (activeType !== 'all') filters.type = activeType
    onFilterChange(filters)
  }, [activeStatus, activeType, onFilterChange])

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
      {/* Status filter tabs */}
      <Tabs 
        defaultValue={activeStatus} 
        className="w-full md:w-auto"
        onValueChange={(value) => setActiveStatus(value)}
      >
        <TabsList className="w-full md:w-auto grid grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active" className="text-victory-green">
            Active
          </TabsTrigger>
          <TabsTrigger value="voting" className="text-battle-yellow">
            Voting
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-zinc-400">
            Completed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Battle type filter */}
      <div className="flex flex-wrap gap-2">
        {battleTypes.map((type) => (
          <Badge
            key={type.value}
            variant={activeType === type.value ? 'primary' : 'outline'}
            className="cursor-pointer transition-colors"
            onClick={() => setActiveType(type.value)}
          >
            {type.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
