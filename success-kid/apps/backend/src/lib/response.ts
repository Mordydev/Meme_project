import { FastifyReply } from 'fastify';

export interface ApiResponse<T> {
  data: T | null;
  meta: {
    timestamp: string;
    requestId?: string;
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

/**
 * Send a successful response
 * 
 * @param reply The Fastify reply object
 * @param data The data to send in the response
 * @param statusCode The HTTP status code (default: 200)
 * @param meta Additional metadata to include
 * @param pagination Pagination information if applicable
 * @returns The Fastify reply object
 */
export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200,
  meta?: Partial<ApiResponse<T>['meta']>,
  pagination?: ApiResponse<T>['pagination']
): FastifyReply {
  const response: ApiResponse<T> = {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: reply.request.id as string,
      ...meta,
    },
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return reply.code(statusCode).send(response);
}

/**
 * Send an error response
 * 
 * @param reply The Fastify reply object
 * @param errors The error details
 * @param statusCode The HTTP status code (default: 400)
 * @param meta Additional metadata to include
 * @returns The Fastify reply object
 */
export function sendError(
  reply: FastifyReply,
  errors: Array<{
    code: string;
    message: string;
    details?: any;
  }>,
  statusCode = 400,
  meta?: Partial<ApiResponse<null>['meta']>
): FastifyReply {
  const response: ApiResponse<null> = {
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: reply.request.id as string,
      ...meta,
    },
    errors,
  };

  return reply.code(statusCode).send(response);
}

/**
 * Calculate pagination parameters
 * 
 * @param params The pagination parameters
 * @returns The calculated pagination information
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  totalItems: number;
}

export function calculatePagination(params: PaginationParams) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const totalItems = params.totalItems;
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}