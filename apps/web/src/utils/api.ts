/**
 * API client for communicating with the backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Base options for fetch requests
 */
const defaultOptions: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Helper to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An unknown error occurred',
    }));
    throw new Error(error.message || `API error: ${response.status}`);
  }
  
  return response.json() as Promise<T>;
}

/**
 * Generic API request method
 */
async function request<T>(
  endpoint: string,
  method: string = 'GET',
  data?: unknown,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const requestOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    method,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  if (data) {
    requestOptions.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, requestOptions);
  return handleResponse<T>(response);
}

/**
 * API client methods
 */
export const api = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, options: RequestInit = {}) =>
    request<T>(endpoint, 'GET', undefined, options),
  
  /**
   * POST request
   */
  post: <T>(endpoint: string, data: unknown, options: RequestInit = {}) =>
    request<T>(endpoint, 'POST', data, options),
  
  /**
   * PUT request
   */
  put: <T>(endpoint: string, data: unknown, options: RequestInit = {}) =>
    request<T>(endpoint, 'PUT', data, options),
  
  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, data: unknown, options: RequestInit = {}) =>
    request<T>(endpoint, 'PATCH', data, options),
  
  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, options: RequestInit = {}) =>
    request<T>(endpoint, 'DELETE', undefined, options),
};