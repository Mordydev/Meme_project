'use server';

import { cache } from 'react';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Options for fetch with caching
 */
interface FetchOptions extends RequestInit {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

/**
 * Optimized data fetching for server components with caching controls
 * 
 * @param url URL to fetch
 * @param options Fetch options with Next.js caching controls
 * @returns Response data
 */
export async function fetchWithCache<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { next, ...fetchOptions } = options;
  
  // Default cache settings if not provided
  const cacheOptions = {
    // By default, revalidate every 60 seconds
    revalidate: 60,
    // Combine with any provided tags
    tags: next?.tags || [],
    ...next
  };
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      next: cacheOptions,
    });
    
    if (!response.ok) {
      throw new Error(`Fetch error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

/**
 * Cached data fetcher that deduplicates requests within the same render
 * Wraps fetchWithCache with React's cache function
 */
export const cachedFetch = cache(fetchWithCache);

/**
 * Get optimized fetch options based on the content type and context
 */
export function getFetchOptions(
  contentType: 'battle' | 'profile' | 'feed' | 'token' | 'static' | 'dynamic',
  context: 'page' | 'component' | 'api' = 'component'
): FetchOptions {
  // Configure appropriate cache settings based on content type and context
  switch (contentType) {
    case 'battle':
      return {
        next: {
          // Active battles need frequent updates
          revalidate: 30,
          tags: ['battle'],
        },
      };
    
    case 'profile':
      return {
        next: {
          // Profiles don't change that often
          revalidate: 300, // 5 minutes
          tags: ['profile'],
        },
      };
    
    case 'feed':
      return {
        next: {
          // Feeds need to be fresh
          revalidate: 60, // 1 minute
          tags: ['feed', 'content'],
        },
      };
    
    case 'token':
      return {
        next: {
          // Token data needs to be very fresh
          revalidate: 15, // 15 seconds
          tags: ['token'],
        },
      };
    
    case 'static':
      return {
        next: {
          // Static content can be cached for longer
          revalidate: 3600, // 1 hour
          tags: ['static'],
        },
      };
    
    case 'dynamic':
      return {
        next: {
          // Dynamic or user-specific content shouldn't be cached
          revalidate: 0,
        },
        cache: 'no-store',
      };
    
    default:
      return {
        next: {
          // Default case - moderate caching
          revalidate: 60,
        },
      };
  }
}

/**
 * Optimized function to revalidate specific content
 */
export function revalidateContent(
  contentType: 'battle' | 'profile' | 'feed' | 'token' | 'all',
  identifier?: string
): void {
  // Revalidate by tag for general content types
  revalidateTag(contentType);
  
  // If specific identifier provided, also revalidate the specific path
  if (identifier) {
    switch (contentType) {
      case 'battle':
        revalidatePath(`/battle/${identifier}`);
        break;
      case 'profile':
        revalidatePath(`/profile/${identifier}`);
        break;
      case 'feed':
        revalidatePath('/feed');
        break;
      case 'token':
        revalidatePath('/token');
        break;
      case 'all':
        // Revalidate all dynamic content
        revalidateTag('battle');
        revalidateTag('profile');
        revalidateTag('feed');
        revalidateTag('token');
        revalidateTag('content');
        break;
    }
  }
}

/**
 * Examples of using these utilities:
 * 
 * 1. Basic fetch with caching:
 * 
 * async function getBattles() {
 *   const battles = await fetchWithCache('/api/battles', {
 *     next: { revalidate: 60 } // Cache for 60 seconds
 *   });
 *   return battles;
 * }
 * 
 * 2. Cached fetch with deduplication:
 * 
 * export const getBattle = cache(async (id: string) => {
 *   const battle = await fetchWithCache(`/api/battles/${id}`, {
 *     next: { revalidate: 30, tags: ['battle', `battle-${id}`] }
 *   });
 *   return battle;
 * });
 * 
 * 3. Content-specific fetch options:
 * 
 * async function getUserProfile(id: string) {
 *   const options = getFetchOptions('profile');
 *   const profile = await fetchWithCache(`/api/users/${id}`, options);
 *   return profile;
 * }
 * 
 * 4. Revalidating content:
 * 
 * async function updateBattle(id: string, data: BattleData) {
 *   await fetch(`/api/battles/${id}`, {
 *     method: 'PUT',
 *     body: JSON.stringify(data)
 *   });
 *   
 *   // Revalidate this battle's content
 *   revalidateContent('battle', id);
 * }
 */
