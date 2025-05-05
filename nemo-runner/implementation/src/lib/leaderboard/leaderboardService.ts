'use client';

import { supabase } from '@/lib/supabase';

export type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'all-time';

export interface Score {
  id: string;
  user_id: string;
  score: number;
  distance: number;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
}

export interface ScoreEntry extends Score {
  username: string;
}

/**
 * Retrieves leaderboard data for a specific timeframe
 */
export async function getLeaderboard(
  timeframe: TimeFrame = 'daily',
  page = 0,
  limit = 10
): Promise<ScoreEntry[]> {
  const now = new Date();
  let startDate: Date;
  
  // Calculate date range based on timeframe
  switch (timeframe) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'weekly':
      const day = now.getDay();
      startDate = new Date(now.setDate(now.getDate() - day));
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'all-time':
    default:
      startDate = new Date(0); // Beginning of time
  }
  
  // Query leaderboard data
  try {
    const result = await supabase
      .from('scores')
      .select(`
        id,
        user_id,
        score,
        distance,
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .order('score', { ascending: false })
      .limit(limit)
      .offset(page * limit)
      .then();
    
    const { data, error } = result;
    
    if (error) throw error;
    
    // Mock username fetching (in a real implementation, this would be a join)
    const scoresWithUsernames: ScoreEntry[] = [];
    
    if (data) {
      for (const score of data as Score[]) {
        // Get user info
        const userResult = await supabase
          .from('profiles')
          .select('username')
          .eq('id', score.user_id)
          .single();
          
        const { data: userData } = userResult;
        
        scoresWithUsernames.push({
          id: score.id,
          user_id: score.user_id,
          score: score.score,
          distance: score.distance,
          created_at: score.created_at,
          username: (userData as Profile)?.username || 'Unknown Player'
        });
      }
    }
    
    return scoresWithUsernames;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Submits a new score to the leaderboard
 */
export async function submitScore(
  userId: string,
  score: number,
  distance: number
): Promise<boolean> {
  try {
    const result = await supabase
      .from('scores')
      .insert({
        user_id: userId,
        score,
        distance,
        created_at: new Date().toISOString()
      });
      
    const { error } = result;
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error submitting score:', error);
    return false;
  }
}

/**
 * Verifies that a score is valid based on certain criteria
 */
export function verifyScore(score: number, distance: number, gameTime: number): boolean {
  // Simple verification logic (in a real implementation, this would be more sophisticated)
  
  // Check if score is reasonable for the distance
  const maxPossibleScore = distance * 20; // Approximate max score based on distance
  if (score > maxPossibleScore * 1.5) {
    console.warn('Score exceeds possible maximum', {score, maxPossible: maxPossibleScore});
    return false;
  }
  
  // Check if distance is reasonable for the game time
  const maxPossibleDistance = gameTime * 100; // Approximate max distance based on time
  if (distance > maxPossibleDistance * 1.5) {
    console.warn('Distance exceeds possible maximum', {distance, maxPossible: maxPossibleDistance});
    return false;
  }
  
  return true;
}

/**
 * Gets a player's rank on the leaderboard
 */
export async function getPlayerRank(
  userId: string,
  timeframe: TimeFrame = 'daily'
): Promise<number | null> {
  // This is a simplified mock implementation
  // In a real implementation, this would use a more efficient query
  
  try {
    const leaderboard = await getLeaderboard(timeframe, 0, 100);
    const playerIndex = leaderboard.findIndex(entry => entry.user_id === userId);
    
    if (playerIndex === -1) return null;
    return playerIndex + 1;
  } catch (error) {
    console.error('Error getting player rank:', error);
    return null;
  }
}