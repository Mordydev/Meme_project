import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface DiscoveryItem {
  id: string;
  type: string;
  title: string;
  snippet: string;
  thumbnailUrl?: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  createdAt: string;
  reason: 'trending' | 'recommended' | 'interest' | 'popular';
}

export interface UserSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  reason: 'similar_interests' | 'popular' | 'mutual_connections';
  mutualConnections?: number;
  followerCount: number;
}

export interface DiscoveryFeedResponse {
  items: DiscoveryItem[];
  interests: string[];
}

export interface UserRecommendationsResponse {
  users: UserSuggestion[];
}

/**
 * Hook to fetch and manage discovery feed items
 */
export function useDiscoveryFeed(
  interests: string[] = [],
  excludeIds: string[] = [],
  limit: number = 10
) {
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItem[]>([]);
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchDiscoveryFeed = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Build query params
        const params = new URLSearchParams({ limit: limit.toString() });
        
        // Add interests to query params
        interests.forEach((interest) => {
          params.append('interests', interest);
        });
        
        // Add excludeIds to query params
        excludeIds.forEach((id) => {
          params.append('excludeIds', id);
        });
        
        const response = await apiClient.get<DiscoveryFeedResponse>(
          `/api/v1/discovery/feed?${params.toString()}`
        );
        
        setDiscoveryItems(response.data.items);
        setAvailableInterests(response.data.interests);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch discovery feed'));
        setDiscoveryItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDiscoveryFeed();
  }, [interests, JSON.stringify(excludeIds), limit]);
  
  return {
    discoveryItems,
    availableInterests,
    isLoading,
    error
  };
}

/**
 * Hook to fetch and manage user recommendations
 */
export function useUserRecommendations(
  limit: number = 5,
  excludeFollowing: boolean = false
) {
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchUserRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          excludeFollowing: excludeFollowing.toString()
        });
        
        const response = await apiClient.get<UserRecommendationsResponse>(
          `/api/v1/discovery/users?${params.toString()}`
        );
        
        setUserSuggestions(response.data.users);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user recommendations'));
        setUserSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserRecommendations();
  }, [limit, excludeFollowing]);
  
  return {
    userSuggestions,
    isLoading,
    error
  };
}
