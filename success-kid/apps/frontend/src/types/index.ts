/**
 * Type exports
 * 
 * This file exports all types for easier imports throughout the application.
 */

export * from './points';
export * from './community';
export * from './market';

/**
 * API response wrapper type
 */
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    [key: string]: any;
  };
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  errors?: Array<{
    code: string;
    message: string;
    details?: any;
  }>;
}
