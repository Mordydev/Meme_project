import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Battle, BattleEntry } from '@/types/battle'

/**
 * Battle store state interface
 */
interface BattleState {
  // Tracking data
  viewedBattles: string[]
  activeBattleId: string | null
  votedEntries: Record<string, string>
  recentSubmissions: string[]
  
  // UI state
  battleViewMode: 'grid' | 'list'
  battleFilterType: string | null
  battleFilterStatus: 'all' | 'active' | 'voting' | 'completed'
  
  // Actions for tracking
  setActiveBattle: (battleId: string | null) => void
  addViewedBattle: (battleId: string) => void
  recordVote: (battleId: string, entryId: string) => void
  addSubmission: (battleId: string) => void
  
  // Actions for UI state
  setBattleViewMode: (mode: 'grid' | 'list') => void
  setBattleFilterType: (type: string | null) => void
  setBattleFilterStatus: (status: 'all' | 'active' | 'voting' | 'completed') => void
  
  // Selectors
  hasVotedInBattle: (battleId: string) => boolean
  hasViewedBattle: (battleId: string) => boolean
  getVotedEntryId: (battleId: string) => string | undefined
}

/**
 * Battle store with persistence for user preferences and activity tracking
 */
export const useBattleStore = create<BattleState>()(
  persist(
    (set, get) => ({
      // Tracking data
      viewedBattles: [],
      activeBattleId: null,
      votedEntries: {},
      recentSubmissions: [],
      
      // UI state
      battleViewMode: 'grid',
      battleFilterType: null,
      battleFilterStatus: 'active',
      
      // Actions for tracking
      setActiveBattle: (battleId) => set({ activeBattleId: battleId }),
      
      addViewedBattle: (battleId) => 
        set((state) => ({
          viewedBattles: state.viewedBattles.includes(battleId)
            ? state.viewedBattles
            : [...state.viewedBattles, battleId]
        })),
      
      recordVote: (battleId, entryId) =>
        set((state) => ({
          votedEntries: {
            ...state.votedEntries,
            [battleId]: entryId
          }
        })),
        
      addSubmission: (battleId) =>
        set((state) => ({
          recentSubmissions: [
            battleId, 
            ...state.recentSubmissions.filter(id => id !== battleId)
          ].slice(0, 10) // Keep only 10 most recent
        })),
      
      // Actions for UI state
      setBattleViewMode: (mode) => set({ battleViewMode: mode }),
      setBattleFilterType: (type) => set({ battleFilterType: type }),
      setBattleFilterStatus: (status) => set({ battleFilterStatus: status }),
      
      // Selectors
      hasVotedInBattle: (battleId) => {
        const state = get()
        return Boolean(state.votedEntries[battleId])
      },
      
      hasViewedBattle: (battleId) => {
        const state = get()
        return state.viewedBattles.includes(battleId)
      },
      
      getVotedEntryId: (battleId) => {
        const state = get()
        return state.votedEntries[battleId]
      }
    }),
    {
      name: 'battle-store',
      // Only persist relevant user data, not UI state
      partialize: (state) => ({
        viewedBattles: state.viewedBattles,
        votedEntries: state.votedEntries,
        recentSubmissions: state.recentSubmissions,
        battleViewMode: state.battleViewMode
      })
    }
  )
)

/**
 * User content preferences store for personalization
 */
interface ContentPreferencesState {
  preferredBattleTypes: string[]
  followedCreators: string[]
  contentSafeMode: boolean
  
  addPreferredBattleType: (type: string) => void
  removePreferredBattleType: (type: string) => void
  toggleFollowCreator: (creatorId: string) => void
  setContentSafeMode: (enabled: boolean) => void
}

export const useContentPreferencesStore = create<ContentPreferencesState>()(
  persist(
    (set) => ({
      preferredBattleTypes: [],
      followedCreators: [],
      contentSafeMode: false,
      
      addPreferredBattleType: (type) =>
        set((state) => ({
          preferredBattleTypes: state.preferredBattleTypes.includes(type)
            ? state.preferredBattleTypes
            : [...state.preferredBattleTypes, type]
        })),
        
      removePreferredBattleType: (type) =>
        set((state) => ({
          preferredBattleTypes: state.preferredBattleTypes.filter(t => t !== type)
        })),
        
      toggleFollowCreator: (creatorId) =>
        set((state) => ({
          followedCreators: state.followedCreators.includes(creatorId)
            ? state.followedCreators.filter(id => id !== creatorId)
            : [...state.followedCreators, creatorId]
        })),
        
      setContentSafeMode: (enabled) =>
        set({ contentSafeMode: enabled })
    }),
    {
      name: 'content-preferences'
    }
  )
)
