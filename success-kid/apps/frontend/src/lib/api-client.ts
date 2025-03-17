import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiSuccessResponse, ApiErrorResponse, ErrorCode } from '@success-kid/types';

/**
 * Application error with standardized structure
 */
export class AppError extends Error {
  code: string;
  details?: any;
  status?: number;

  constructor(message: string, code: string, details?: any, status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

// Get API URL from environment variable or fall back to relative path
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Create axios instance with common configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token, etc.
axiosInstance.interceptors.request.use(
  async (config) => {
    // Add auth token if available (for client-side requests)
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('auth_token');
      
      // If in a browser environment, try to get token from Clerk as a backup
      // This is in case the localStorage token is missing or expired
      if (!token && window.Clerk?.session) {
        try {
          token = await window.Clerk.session.getToken();
          // Save token to localStorage for future use
          if (token) {
            localStorage.setItem('auth_token', token);
          }
        } catch (error) {
          console.warn('Failed to get token from Clerk:', error);
        }
      }
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Add transaction ID for idempotency on non-GET requests
    if (config.method !== 'get' && config.headers) {
      config.headers['x-transaction-id'] = crypto.randomUUID();
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and data extraction
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiSuccessResponse<any>>) => {
    // Extract data from standardized API response if it matches our structure
    if (response.data && 'data' in response.data) {
      // Return the entire response but with data extracted from the standardized structure
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Handle API errors with our standardized structure
    const errorData = error.response?.data;
    
    // Handle authentication errors (redirect to sign-in)
    if (error.response?.status === 401) {
      // Clear token if we get an authentication error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        
        // Redirect to sign-in page if not already there
        // This is a simplified approach - in a real app you might want to use a more sophisticated approach
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/sign-in')) {
          window.location.href = `/sign-in?redirect=${encodeURIComponent(currentPath)}`;
          // Return a special promise that never resolves to prevent further processing
          return new Promise(() => {});
        }
      }
    }
    
    // Extract standardized error structure
    if (errorData?.errors?.length) {
      const apiError = errorData.errors[0];
      return Promise.reject(
        new AppError(
          apiError.message,
          apiError.code,
          apiError.details,
          error.response?.status
        )
      );
    }
    
    // Handle network errors
    if (!error.response) {
      return Promise.reject(
        new AppError(
          'Network error. Please check your connection.',
          ErrorCode.NETWORK_ERROR,
          undefined,
          0
        )
      );
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new AppError(
          'Request timed out. Please try again.',
          ErrorCode.TIMEOUT_ERROR,
          undefined,
          408
        )
      );
    }
    
    // Handle other types of errors
    return Promise.reject(
      new AppError(
        error.message || 'An unexpected error occurred',
        ErrorCode.SERVER_ERROR,
        undefined,
        error.response?.status
      )
    );
  }
);

// Type-safe API client wrapper
export const apiClient = {
  /**
   * Make a GET request
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get<T, AxiosResponse<T>>(url, config),
  
  /**
   * Make a POST request
   */
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.post<T, AxiosResponse<T>>(url, data, config),
  
  /**
   * Make a PUT request
   */
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.put<T, AxiosResponse<T>>(url, data, config),
  
  /**
   * Make a PATCH request
   */
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.patch<T, AxiosResponse<T>>(url, data, config),
  
  /**
   * Make a DELETE request
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete<T, AxiosResponse<T>>(url, config),
  
  /**
   * Access the underlying axios instance directly if needed
   */
  instance: axiosInstance,
};

// Export utility functions for API error handling
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

/**
 * Helper for extracting error messages for display
 */
export const getErrorMessage = (error: unknown): string => {
  if (isAppError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
};

/**
 * Helper for getting the error code
 */
export const getErrorCode = (error: unknown): string => {
  if (isAppError(error)) {
    return error.code;
  }
  
  return ErrorCode.SERVER_ERROR;
};

/**
 * Check if error is a specific error code
 */
export const isErrorCode = (error: unknown, code: ErrorCode): boolean => {
  return isAppError(error) && error.code === code;
};
