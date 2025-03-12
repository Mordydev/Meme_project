import { apiClient, AppError, getErrorMessage } from './api-client';

/**
 * Utility for handling API errors in components
 */
export const handleApiError = (error: unknown, fallbackMessage: string = 'An error occurred'): string => {
  console.error('API error:', error);
  return getErrorMessage(error) || fallbackMessage;
};

/**
 * Helper for making API calls with standard error handling
 */
export const safeApiCall = async <T>(
  apiFunction: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: unknown) => void
): Promise<{ data: T | null; error: AppError | Error | null }> => {
  try {
    const data = await apiFunction();
    onSuccess?.(data);
    return { data, error: null };
  } catch (error) {
    onError?.(error);
    return {
      data: null,
      error: error instanceof AppError || error instanceof Error 
        ? error 
        : new Error('Unknown error'),
    };
  }
};

/**
 * Helper for constructing query strings from objects
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Helper for pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Default values for pagination
 */
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};
