/**
 * API Versioning Strategies
 * 
 * Defines strategies for API versioning to enable backward compatibility and smooth evolution.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '@/lib/logger';

/**
 * Versioning strategy type
 */
export type VersioningStrategy = 'url' | 'header' | 'mediaType';

/**
 * Versioning configuration interface
 */
export interface VersioningConfig {
  strategy: VersioningStrategy;
  defaultVersion: string;
  headerName?: string;
  mediaTypePrefix?: string;
  versions: string[];
  deprecatedVersions?: Record<string, {
    date: Date;
    sunsetDate: Date;
  }>;
}

/**
 * Default versioning configuration
 */
export const defaultVersioningConfig: VersioningConfig = {
  strategy: 'url',
  defaultVersion: 'v1',
  headerName: 'X-API-Version',
  mediaTypePrefix: 'application/vnd.successkid',
  versions: ['v1'],
  deprecatedVersions: {}
};

/**
 * Extract version from request based on strategy
 * 
 * @param request Fastify request
 * @param config Versioning configuration
 * @returns Extracted version or undefined
 */
export function extractVersion(
  request: FastifyRequest,
  config: VersioningConfig
): string | undefined {
  // Extract version based on strategy
  switch (config.strategy) {
    case 'url':
      return extractVersionFromUrl(request.url);
    
    case 'header':
      if (!config.headerName) {
        logger.warn('Header name not specified for header versioning strategy');
        return undefined;
      }
      return extractVersionFromHeader(request, config.headerName);
    
    case 'mediaType':
      if (!config.mediaTypePrefix) {
        logger.warn('Media type prefix not specified for mediaType versioning strategy');
        return undefined;
      }
      return extractVersionFromMediaType(request, config.mediaTypePrefix);
    
    default:
      logger.warn(`Unknown versioning strategy: ${config.strategy}`);
      return undefined;
  }
}

/**
 * Extract version from URL path
 * 
 * @param url URL to extract version from
 * @returns Extracted version or undefined
 */
export function extractVersionFromUrl(url: string): string | undefined {
  // Match version pattern in URL path (e.g., /api/v1/users)
  const match = url.match(/\/api\/([^\/]+)/);
  return match ? match[1] : undefined;
}

/**
 * Extract version from request header
 * 
 * @param request Fastify request
 * @param headerName Header name to extract version from
 * @returns Extracted version or undefined
 */
export function extractVersionFromHeader(
  request: FastifyRequest,
  headerName: string
): string | undefined {
  const headerValue = request.headers[headerName.toLowerCase()];
  return headerValue ? headerValue as string : undefined;
}

/**
 * Extract version from media type
 * 
 * @param request Fastify request
 * @param mediaTypePrefix Media type prefix
 * @returns Extracted version or undefined
 */
export function extractVersionFromMediaType(
  request: FastifyRequest,
  mediaTypePrefix: string
): string | undefined {
  const acceptHeader = request.headers['accept'];
  
  if (!acceptHeader) {
    return undefined;
  }
  
  // Match version in Accept header (e.g., application/vnd.successkid.v1+json)
  const match = (acceptHeader as string).match(
    new RegExp(`${mediaTypePrefix.replace(/\./g, '\\.')}\\.(v\\d+)\\+json`)
  );
  
  return match ? match[1] : undefined;
}

/**
 * Get version-specific headers
 * 
 * @param version API version
 * @param config Versioning configuration
 * @returns Headers to add to response
 */
export function getVersionHeaders(
  version: string,
  config: VersioningConfig
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-API-Version': version
  };
  
  // Add deprecation headers if version is deprecated
  if (config.deprecatedVersions && config.deprecatedVersions[version]) {
    const deprecation = config.deprecatedVersions[version];
    headers['Deprecation'] = 'true';
    headers['Sunset'] = deprecation.sunsetDate.toUTCString();
    
    // Add link to latest version documentation
    headers['Link'] = `<${config.defaultVersion}/documentation>; rel="deprecation"; type="text/html"`;
  }
  
  return headers;
}
