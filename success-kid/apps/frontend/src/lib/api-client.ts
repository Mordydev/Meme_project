import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCode, ErrorWithCode } from './errors';
import { handleApiError } from './monitoring/api-error-handler';
import { logError } from './monitoring/error-logging';
import analytics, { EventCategory, EventAction } from './monitoring/analytics';

// Get API URL from environment variable or fall back to relative path
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * API response interface for success
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * API response interface for errors
 */
export interface ApiErrorResponse {
  data: null;
  meta: {
    timestamp: string;
    requestId?: string;
  };
  errors: Array<{
    code: string;
    message: string;
    details?: any;
  }>;
}

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
    // Add request ID for tracking
    const requestId = uuidv4();
    if (config.headers) {
      config.headers['x-request-id'] = requestId;
    }
    
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
      config.headers['x-transaction-id'] = uuidv4();
    }
    
    // Track API request for analytics
    const apiPath = config.url?.replace(/\/\d+/g, '/:id'); // Normalize path with IDs
    analytics.track({
      category: EventCategory.APP,
      action: 'api_request',
      label: `${config.method?.toUpperCase()} ${apiPath}`,
      properties: {
        method: config.method,
        path: apiPath,
        requestId
      }
    });
    
    return config;
  },
  (error) => {
    // Log request error
    logError(error, {
      component: 'api-client',
      action: 'request',
      data: {
        message: 'Request configuration error'
      }
    });
    
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and data extraction
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiSuccessResponse<any>>) => {
    // Track API response for analytics
    const apiPath = response.config.url?.replace(/\/\d+/g, '/:id'); // Normalize path with IDs
    analytics.track({
      category: EventCategory.APP,
      action: 'api_response',
      label: `${response.config.method?.toUpperCase()} ${apiPath}`,
      properties: {
        method: response.config.method,
        path: apiPath,
        status: response.status,
        duration: response.headers['x-response-time'] || '0',
        requestId: response.config.headers?.['x-request-id']
      }
    });
    
    // Extract data from standardized API response if it matches our structure
    if (response.data && 'data' in response.data) {
      // Return the entire response but with data extracted from the standardized structure
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle authentication errors (redirect to sign-in)
    if (error.response?.status === 401) {
      // Clear token if we get an authentication error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        
        // Track auth failure
        analytics.track({
          category: EventCategory.USER,
          action: 'auth_failure',
          properties: {
            path: error.config?.url,
            method: error.config?.method,
            status: error.response?.status
          }
        });
        
        // Redirect to sign-in page if not already there
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/sign-in')) {
          window.location.href = `/sign-in?redirect=${encodeURIComponent(currentPath)}`;
          // Return a special promise that never resolves to prevent further processing
          return new Promise(() => {});
        }
      }
    }
    
    // Use our centralized API error handler
    const handledError = handleApiError(error, {
      path: error.config?.url,
      method: error.config?.method,
      component: 'api-client'
    });
    
    // Track API error for analytics
    analytics.track({
      category: EventCategory.ERROR,
      action: EventAction.ERROR_OCCURRED,
      label: handledError.code || 'API_ERROR',
      properties: {
        path: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: handledError.message,
        requestId: error.config?.headers?.['x-request-id']
      }
    });
    
    return Promise.reject(handledError);
  }
);

// Type-safe API client wrapper
export const apiClient = {
  /**
   * Make a GET request
   * @param url API endpoint URL
   * @param config Additional Axios config
   * @returns Promise with response data
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get<T, AxiosResponse<T>>(url, config),
  
  /**
   * Make a POST request
   * @param url API endpoint URL
   * @param data Request payload
   * @param config Additional Axios config
   * @returns Promise with response data
   */
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.post<T, AxiosResponse<T>>(url, data, config),
  
  /**
   * Make a PUT request
   * @param url API endpoint URL
   * @param data Request payload
   * @param config Additional Axios config
   * @returns Promise with response data
   */
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.put<T, AxiosResponse<T>>(url, data, config),
  
  /**
   * Make a PATCH request
   * @param url API endpoint URL
   * @param data Request payload
   * @param config Additional Axios config
   * @returns Promise with response data
   */
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.patch<T, AxiosResponse<T>>(url, data, config),
  
  /**
   * Make a DELETE request
   * @param url API endpoint URL
   * @param config Additional Axios config
   * @returns Promise with response data
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete<T, AxiosResponse<T>>(url, config),
  
  /**
   * Access the underlying axios instance directly if needed
   */
  instance: axiosInstance,
};

/**
 * Helper for extracting error messages for display
 * @param error Error object
 * @returns User-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  if ((error as ErrorWithCode).code) {
    return (error as ErrorWithCode).message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
};

/**
 * Helper for getting the error code
 * @param error Error object
 * @returns Error code or default SERVER_ERROR
 */
export const getErrorCode = (error: unknown): ErrorCode => {
  if ((error as ErrorWithCode).code) {
    return (error as ErrorWithCode).code as ErrorCode;
  }
  
  return ErrorCode.SERVER_ERROR;
};

/**
 * Check if error is a specific error code
 * @param error Error object
 * @param code Error code to check
 * @returns Whether the error matches the code
 */
export const isErrorCode = (error: unknown, code: ErrorCode): boolean => {
  return (error as ErrorWithCode).code === code;
};

/**
 * Utility to handle API errors in components
 * @param error Error from API call
 * @param context Context about where the error occurred
 */
export const handleComponentApiError = (error: unknown, context: { component: string; action: string }): void => {
  // Log error to monitoring system
  logError(error, context);
  
  // Track error for analytics
  analytics.trackError(
    getErrorCode(error),
    getErrorMessage(error),
    context.component
  );
};

// Declare Clerk type for TypeScript
declare global {
  interface Window {
    Clerk?: {
      session: {
        getToken(): Promise<string | null>;
      };
    };
  }
}
