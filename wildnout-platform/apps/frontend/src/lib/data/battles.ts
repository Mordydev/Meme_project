import { cache } from 'react'
import { notFound } from 'next/navigation'
import { Battle } from '@/types/battle'

/**
 * Fetches a battle by its ID with caching to prevent duplicate requests
 * @param battleId - The ID of the battle to fetch
 * @returns The battle object or throws notFound if not found
 */
export const getBattle = cache(async (battleId: string): Promise<Battle> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/battles/${battleId}`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        notFound()
      }
      throw new Error(`Failed to fetch battle: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching battle:', error)
    throw error
  }
})

/**
 * Fetches all battles with optional filtering
 * @param params - Optional parameters for filtering battles
 * @returns Array of battles
 */
export const getBattles = cache(async (params?: { 
  status?: 'active' | 'voting' | 'completed',
  type?: string,
  limit?: number 
}): Promise<Battle[]> => {
  try {
    const queryParams = new URLSearchParams()
    
    if (params?.status) queryParams.set('status', params.status)
    if (params?.type) queryParams.set('type', params.type)
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    
    const queryString = queryParams.toString()
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/battles${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(url, {
      next: { revalidate: 30 } // Cache for 30 seconds
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch battles: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching battles:', error)
    return []
  }
})

/**
 * Fetches battle participants
 * @param battleId - The ID of the battle
 * @returns Array of battle participants
 */
export const getBattleParticipants = cache(async (battleId: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/battles/${battleId}/participants`, {
      next: { revalidate: 30 }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      throw new Error(`Failed to fetch battle participants: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching battle participants:', error)
    return []
  }
})

/**
 * Fetches battle entries for voting
 * @param battleId - The ID of the battle
 * @returns Array of battle entries
 */
export const getBattleEntries = cache(async (battleId: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/battles/${battleId}/entries`, {
      next: { revalidate: 15 } // Lower cache time for more frequent updates during voting
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      throw new Error(`Failed to fetch battle entries: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching battle entries:', error)
    return []
  }
})
