'use client';

// This file will integrate Clerk authentication with the game

import { supabase } from '@/lib/supabase'; // This would be your Supabase client
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Synchronizes a user's Clerk account with the Supabase database
 * Creates a new profile record if one doesn't exist
 */
export async function syncUserWithDatabase(userId: string) {
  try {
    // In production this would use the actual Clerk client
    // const user = await clerkClient.users.getUser(userId);
    
    // For now, we'll use a mock implementation
    const mockUser = {
      id: userId,
      username: `player_${userId.substring(0, 8)}`,
      emailAddresses: [{ emailAddress: `user_${userId.substring(0, 8)}@example.com` }]
    };
    
    // Check if user exists in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('id', userId)
      .single();
    
    // Handle error, but ignore "not found" error
    if (error && (error as PostgrestError).code !== 'PGRST116') {
      console.error('Error checking user:', error);
      return;
    }
    
    // Create user if doesn't exist
    if (!data) {
      await supabase.from('profiles').insert({
        id: userId,
        username: mockUser.username || `player_${userId.substring(0, 8)}`,
        email: mockUser.emailAddresses[0]?.emailAddress,
        games_played: 0,
        games_remaining: 10,
        last_reset: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    }
    
    return mockUser;
  } catch (error) {
    console.error('Error syncing user:', error);
  }
}

/**
 * Gets the number of remaining games for a user
 */
export async function getRemainingGames(userId?: string) {
  if (!userId) {
    // Anonymous user (1 game limit)
    const playCount = Number(localStorage.getItem('anon_plays') || '0');
    return Math.max(0, 1 - playCount);
  }
  
  // Get today's date in UTC
  const today = new Date().toISOString().split('T')[0];
  
  // Query remaining games
  interface ProfileData {
    games_remaining: number;
    last_reset: string;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('games_remaining, last_reset')
    .eq('id', userId)
    .single<ProfileData>();
  
  if (error) {
    console.error('Error fetching remaining games:', error);
    return 0;
  }
  
  // Check if we need to reset (new day)
  const lastReset = new Date(data.last_reset);
  const resetDate = new Date(today);
  
  if (lastReset < resetDate) {
    // Reset limit for new day
    supabase
      .from('profiles')
      .update({ 
        games_remaining: 10,
        last_reset: new Date().toISOString()
      })
      .eq('id', userId)
      .then((result) => {
        if (result.error) {
          console.error('Error resetting game limit:', result.error);
        }
      });
    
    return 10;
  }
  
  return data.games_remaining;
}

/**
 * Decrements the remaining games count for a user
 */
export async function decrementRemainingGames(userId?: string) {
  if (!userId) {
    // Anonymous user, update local storage
    const playCount = Number(localStorage.getItem('anon_plays') || '0');
    localStorage.setItem('anon_plays', (playCount + 1).toString());
    return;
  }
  
  // Update user's remaining games
  supabase
    .from('profiles')
    .update({ 
      games_remaining: supabase.rpc('decrement', { min_val: 0 }),
      games_played: supabase.rpc('increment')
    })
    .eq('id', userId)
    .then((result) => {
      if (result.error) {
        console.error('Error updating remaining games:', result.error);
      }
    });
}

/**
 * Mock user session that would come from Clerk
 */
export const mockUserSession = {
  id: 'user_123456789',
  username: 'nemo_player',
  email: 'player@example.com',
  isSignedIn: true
};

/**
 * Check if user is authenticated (stub for now)
 */
export function isAuthenticated() {
  return localStorage.getItem('nemo_user_authenticated') === 'true';
}

/**
 * Sign in user (mock implementation)
 */
export function signIn() {
  localStorage.setItem('nemo_user_authenticated', 'true');
  localStorage.setItem('nemo_user_id', mockUserSession.id);
  return Promise.resolve(mockUserSession);
}

/**
 * Sign out user (mock implementation)
 */
export function signOut() {
  localStorage.removeItem('nemo_user_authenticated');
  localStorage.removeItem('nemo_user_id');
  return Promise.resolve();
}

/**
 * Get current user (mock implementation)
 */
export function getCurrentUser() {
  if (isAuthenticated()) {
    return mockUserSession;
  }
  return null;
}