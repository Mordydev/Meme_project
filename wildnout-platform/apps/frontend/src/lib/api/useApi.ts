'use client';

import { useAuthentication } from '@/hooks/useAuthentication';
import { useEffect, useState } from 'react';
import { createApiClient } from './client';

/**
 * Hook that provides an authenticated API client
 */
export default function useApi() {
  const { isAuthenticated, getToken } = useAuthentication();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchToken() {
      if (isAuthenticated) {
        try {
          const newToken = await getToken();
          setToken(newToken);
        } catch (error) {
          console.error('Error fetching auth token:', error);
        }
      }
      setIsLoading(false);
    }

    fetchToken();
  }, [isAuthenticated, getToken]);

  // Create API client with current token
  const api = createApiClient(token);

  return { api, isLoading };
}
