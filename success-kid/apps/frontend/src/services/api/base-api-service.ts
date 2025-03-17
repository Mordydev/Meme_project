/**
 * Base API Service
 * Provides common functionality for all API services
 */
import { apiClient, AppError } from '@/lib/api-client';
import { ApiEndpoints } from '@success-kid/types';

/**
 * Base API service that provides common functionality for all API services
 */
export abstract class BaseApiService {
  /**
   * Make a GET request to the API
   * @param endpoint API endpoint or full URL
   * @param params Query parameters
   * @param config Additional Axios config
   * @returns Response data
   */
  protected async get<T>(endpoint: ApiEndpoints | string, params?: Record<string, any>, config = {}) {
    try {
      const response = await apiClient.get<T>(endpoint, { 
        params, 
        ...config 
      });
      return response.data;
    } catch (error) {
      this.handleRequestError(error, 'GET', endpoint);
    }
  }

  /**
   * Make a POST request to the API
   * @param endpoint API endpoint or full URL
   * @param data Request data
   * @param config Additional Axios config
   * @returns Response data
   */
  protected async post<T>(endpoint: ApiEndpoints | string, data?: any, config = {}) {
    try {
      const response = await apiClient.post<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleRequestError(error, 'POST', endpoint);
    }
  }

  /**
   * Make a PUT request to the API
   * @param endpoint API endpoint or full URL
   * @param data Request data
   * @param config Additional Axios config
   * @returns Response data
   */
  protected async put<T>(endpoint: ApiEndpoints | string, data?: any, config = {}) {
    try {
      const response = await apiClient.put<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleRequestError(error, 'PUT', endpoint);
    }
  }

  /**
   * Make a PATCH request to the API
   * @param endpoint API endpoint or full URL
   * @param data Request data
   * @param config Additional Axios config
   * @returns Response data
   */
  protected async patch<T>(endpoint: ApiEndpoints | string, data?: any, config = {}) {
    try {
      const response = await apiClient.patch<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleRequestError(error, 'PATCH', endpoint);
    }
  }

  /**
   * Make a DELETE request to the API
   * @param endpoint API endpoint or full URL
   * @param config Additional Axios config
   * @returns Response data
   */
  protected async delete<T>(endpoint: ApiEndpoints | string, config = {}) {
    try {
      const response = await apiClient.delete<T>(endpoint, config);
      return response.data;
    } catch (error) {
      this.handleRequestError(error, 'DELETE', endpoint);
    }
  }

  /**
   * Replace path parameters in URL
   * @param url URL with path parameters (e.g. /users/:id)
   * @param params Parameters to replace in URL
   * @returns URL with replaced parameters
   */
  protected replacePathParams(url: string, params: Record<string, string | number>) {
    let replacedUrl = url;
    Object.entries(params).forEach(([key, value]) => {
      replacedUrl = replacedUrl.replace(`:${key}`, String(value));
    });
    return replacedUrl;
  }

  /**
   * Handle request errors in a standard way
   * @param error Error from Axios
   * @param method HTTP method
   * @param endpoint API endpoint
   */
  protected handleRequestError(error: any, method: string, endpoint: string): never {
    // Log the error
    console.error(`API ${method} ${endpoint} failed:`, error);
    
    // If it's already an AppError, rethrow it
    if (error instanceof AppError) {
      throw error;
    }
    
    // Otherwise convert to AppError
    if (error instanceof Error) {
      throw new AppError(
        error.message || `Failed to ${method.toLowerCase()} data from ${endpoint}`,
        'REQUEST_FAILED',
        undefined,
        0
      );
    }
    
    // Fallback for unknown error types
    throw new AppError(
      `Unknown error occurred during ${method} ${endpoint}`,
      'UNKNOWN_ERROR',
      undefined,
      0
    );
  }
}
