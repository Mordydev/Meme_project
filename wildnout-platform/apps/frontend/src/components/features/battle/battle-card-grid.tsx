import { BattleCard } from './battle-card'
import { formatTimeRemaining } from '@/lib/utils'
import { Battle } from '@/types/battle'

export interface BattleCardGridProps {
  battles: Battle[];
  onBattleClick: (battleId: string) => void;
  loading?: boolean;
  layout?: 'grid' | 'list';
  emptyMessage?: string;
}

export function BattleCardGrid({
  battles,
  onBattleClick,
  loading = false,
  layout = 'grid',
  emptyMessage = 'No battles found. Check back soon for new battles!'
}: BattleCardGridProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 ${layout === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <BattleCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (battles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 bg-zinc-800/50 rounded-full mb-4">
          <span className="text-4xl">🎤</span>
        </div>
        <h3 className="text-xl font-display text-hype-white mb-2">No Battles Found</h3>
        <p className="text-zinc-400 max-w-md">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 ${layout === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
      {battles.map((battle) => (
        <BattleCard
          key={battle.id}
          id={battle.id}
          title={battle.title}
          type={battle.battleType}
          status={battle.status === 'scheduled' ? 'upcoming' : battle.status}
          participants={battle.participantCount}
          timeRemaining={formatTimeRemaining(battle.endTime)}
          onActionClick={() => onBattleClick(battle.id)}
        />
      ))}
    </div>
  )
}

function BattleCardSkeleton() {
  return (
    <div className="rounded-lg bg-zinc-800 p-6 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="bg-zinc-700 h-6 w-24 rounded-full"></div>
        <div className="bg-zinc-700 h-6 w-16 rounded-full"></div>
      </div>
      <div className="h-7 bg-zinc-700 w-3/4 rounded-md mb-4"></div>
      <div className="flex space-x-4 mb-4">
        <div className="h-4 bg-zinc-700 w-24 rounded-md"></div>
        <div className="h-4 bg-zinc-700 w-24 rounded-md"></div>
      </div>
      <div className="h-10 bg-zinc-700 rounded-md"></div>
    </div>
  )
}
