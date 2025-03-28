/**
 * API Client for the Success Kid platform
 * 
 * Provides typed API methods with standardized error handling and response formatting
 * that aligns with our backend API architecture.
 */
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, ApiResponse, ErrorCode } from '@success-kid/api-types';
import { getAuthToken } from '@/lib/auth/auth-utils';

/**
 * Application error with standardized structure
 */
export class AppError extends Error {
  code: ErrorCode | string;
  details?: any;
  status?: number;

  constructor(message: string, code: ErrorCode | string, details?: any, status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.status = status;
    
    // Ensure prototype chain is properly maintained
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Get API URL from environment variable or fall back to relative path
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10);

/**
 * Generate a transaction ID for idempotent requests
 */
function generateTransactionId(): string {
  return crypto.randomUUID();
}

/**
 * Create and configure axios instance
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for adding auth token, transaction IDs, etc.
  instance.interceptors.request.use(
    async (config) => {
      try {
        // Add auth token if available
        const token = await getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add transaction ID for idempotency on non-GET requests
        if (config.method !== 'get' && config.headers) {
          config.headers['x-transaction-id'] = generateTransactionId();
        }
        
        // Add API version header
        if (config.headers) {
          config.headers['x-api-version'] = '1';
        }
        
        return config;
      } catch (error) {
        console.error('Error in request interceptor:', error);
        return config;
      }
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling and data extraction
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Extract data from standardized API response if it matches our structure
      if (response.data && 'data' in response.data && 'meta' in response.data) {
        // Add metadata to response for access if needed
        const apiResponse = response.data as ApiResponse;
        
        // Extract the actual data payload
        return {
          ...response,
          data: apiResponse.data,
          meta: apiResponse.meta,
          pagination: apiResponse.pagination
        };
      }
      
      return response;
    },
    (error: AxiosError<ApiResponse>) => {
      // Handle API errors with our standardized structure
      if (error.response?.data?.errors?.length) {
        const apiError = error.response.data.errors[0];
        return Promise.reject(
          new AppError(
            apiError.message,
            apiError.code,
            apiError.details,
            error.response.status
          )
        );
      }
      
      // Handle network errors
      if (!error.response) {
        return Promise.reject(
          new AppError(
            'Network error. Please check your connection.',
            ErrorCode.SERVER_ERROR,
            undefined,
            0
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

  return instance;
};

/**
 * Create the API client instance
 */
const axiosInstance = createAxiosInstance();

/**
 * Type-safe API client that handles standardized responses
 */
export const apiClient = {
  /**
   * Make a GET request
   */
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  },
  
  /**
   * Make a POST request
   */
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },
  
  /**
   * Make a PUT request
   */
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  },
  
  /**
   * Make a PATCH request
   */
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  },
  
  /**
   * Make a DELETE request
   */
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },
  
  /**
   * Access the axios instance directly if needed
   */
  instance: axiosInstance,
  
  /**
   * Helper for getting metadata from a response
   */
  getMetadata: <T>(response: T & { meta?: any }): any => {
    return response.meta;
  },
  
  /**
   * Helper for getting pagination from a response
   */
  getPagination: <T>(response: T & { pagination?: any }): any => {
    return response.pagination;
  }
};

/**
 * Error helpers
 */
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
 * Helper for constructing query strings from objects
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(`${key}[]`, String(v)));
      } else if (typeof value === 'object') {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};
