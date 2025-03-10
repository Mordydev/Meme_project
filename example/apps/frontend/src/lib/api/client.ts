'use client';

import { auth } from '@clerk/nextjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Server-side API client
 */
export async function serverApiClient() {
  // Get auth token from Clerk on the server
  const { getToken } = auth();
  const token = await getToken();

  return createApiClient(token);
}

/**
 * Creates an API client with authentication
 */
export function createApiClient(token?: string | null) {
  /**
   * Makes authenticated API requests
   */
  const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { message: 'An unknown error occurred' }
        }));
        
        throw new Error(
          errorData.error?.message || `API Error: ${response.status}`
        );
      }
      
      // Parse JSON response if content exists
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  };

  return {
    get: <T>(endpoint: string, options?: RequestInit) => 
      apiRequest(endpoint, { method: 'GET', ...options }) as Promise<T>,
      
    post: <T>(endpoint: string, data: any, options?: RequestInit) =>
      apiRequest(endpoint, { 
        method: 'POST', 
        body: JSON.stringify(data), 
        ...options 
      }) as Promise<T>,
      
    put: <T>(endpoint: string, data: any, options?: RequestInit) =>
      apiRequest(endpoint, { 
        method: 'PUT', 
        body: JSON.stringify(data), 
        ...options 
      }) as Promise<T>,
      
    patch: <T>(endpoint: string, data: any, options?: RequestInit) =>
      apiRequest(endpoint, { 
        method: 'PATCH', 
        body: JSON.stringify(data), 
        ...options 
      }) as Promise<T>,
      
    delete: <T>(endpoint: string, options?: RequestInit) =>
      apiRequest(endpoint, { method: 'DELETE', ...options }) as Promise<T>,
  };
}
