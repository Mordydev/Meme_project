/**
 * Version-aware Router
 * 
 * A router that understands API versioning and routes requests accordingly.
 */
import { FastifyInstance, FastifyRequest, FastifyReply, RouteOptions } from 'fastify';
import { VersioningConfig, extractVersion, getVersionHeaders, defaultVersioningConfig } from './strategies';
import { logger } from '@/lib/logger';

/**
 * Versioned route handler
 */
export interface VersionedRouteHandler {
  version: string;
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<any>;
}

/**
 * Request with API version
 */
export interface VersionedRequest extends FastifyRequest {
  apiVersion?: string;
}

/**
 * Version router for managing versioned routes
 */
export class VersionRouter {
  private app: FastifyInstance;
  private config: VersioningConfig;
  
  /**
   * Create a version router
   * 
   * @param app Fastify instance
   * @param config Versioning configuration
   */
  constructor(app: FastifyInstance, config: VersioningConfig = defaultVersioningConfig) {
    this.app = app;
    this.config = config;
    
    // Add request hook for version extraction
    this.setupVersioningMiddleware();
  }
  
  /**
   * Set up versioning middleware to extract version from request
   */
  private setupVersioningMiddleware(): void {
    this.app.addHook('onRequest', async (request: VersionedRequest, reply) => {
      try {
        // Extract version based on strategy
        let version = extractVersion(request, this.config);
        
        // Use default version if none found or not in supported versions
        if (!version || !this.config.versions.includes(version)) {
          version = this.config.defaultVersion;
        }
        
        // Set version in request for later use
        request.apiVersion = version;
        
        // Set version response header
        reply.header('X-API-Version', version);
        
        // Add deprecation headers if version is deprecated
        if (this.config.deprecatedVersions && this.config.deprecatedVersions[version]) {
          const headers = getVersionHeaders(version, this.config);
          
          // Add headers to response
          for (const [key, value] of Object.entries(headers)) {
            reply.header(key, value);
          }
          
          // Log deprecation warning
          logger.warn(`Request using deprecated API version: ${version}`, {
            url: request.url,
            method: request.method,
            sunsetDate: this.config.deprecatedVersions[version].sunsetDate
          });
        }
      } catch (error) {
        // Don't fail request on version extraction error
        logger.error('Error in versioning middleware', { error });
      }
    });
  }
  
  /**
   * Register a versioned route
   * 
   * @param method HTTP method
   * @param path Route path
   * @param handlers Array of versioned handlers
   * @param options Additional route options
   */
  registerVersionedRoute(
    method: string,
    path: string,
    handlers: VersionedRouteHandler[],
    options: Partial<RouteOptions> = {}
  ): void {
    // Register the route with a handler that delegates based on version
    this.app.route({
      method: method as any,
      url: path,
      ...options,
      handler: async (request: VersionedRequest, reply) => {
        const version = request.apiVersion || this.config.defaultVersion;
        
        // Find handler for requested version
        const versionedHandler = handlers.find(h => h.version === version);
        
        // Use handler for requested version or fall back to default version
        if (versionedHandler) {
          return versionedHandler.handler(request, reply);
        }
        
        // If no handler for requested version, try to find most recent compatible version
        const compatibleHandler = this.findCompatibleHandler(version, handlers);
        
        if (compatibleHandler) {
          // Add warning header about version adaptation
          reply.header('Warning', `299 api.successkid.com "API version ${version} is not available, using ${compatibleHandler.version} instead"`);
          
          return compatibleHandler.handler(request, reply);
        }
        
        // No compatible handler found
        reply.status(400).send({
          errors: [{
            code: 'UNSUPPORTED_VERSION',
            message: `API version ${version} is not supported. Supported versions: ${this.config.versions.join(', ')}`
          }]
        });
      }
    });
  }
  
  /**
   * Find a compatible handler for the requested version
   * 
   * @param requestedVersion Requested API version
   * @param handlers Available handlers
   * @returns Compatible handler or undefined
   */
  private findCompatibleHandler(
    requestedVersion: string,
    handlers: VersionedRouteHandler[]
  ): VersionedRouteHandler | undefined {
    // Get version number from version string
    const versionNumber = this.parseVersionNumber(requestedVersion);
    
    if (versionNumber === undefined) {
      return undefined;
    }
    
    // Find handlers with lower version numbers, sorted in descending order
    const compatibleHandlers = handlers
      .map(h => ({
        handler: h,
        versionNumber: this.parseVersionNumber(h.version)
      }))
      .filter(h => h.versionNumber !== undefined && h.versionNumber <= versionNumber)
      .sort((a, b) => b.versionNumber! - a.versionNumber!);
    
    // Return handler with highest compatible version
    return compatibleHandlers.length > 0 ? compatibleHandlers[0].handler : undefined;
  }
  
  /**
   * Parse version number from version string (v1, v2, etc.)
   * 
   * @param version Version string
   * @returns Version number or undefined
   */
  private parseVersionNumber(version: string): number | undefined {
    const match = version.match(/v(\d+)/i);
    return match ? parseInt(match[1], 10) : undefined;
  }
  
  /**
   * Register URL-based versioned routes
   * 
   * @param prefix URL prefix for all routes (e.g., '/api')
   */
  registerUrlVersionedRoutes(prefix: string = '/api'): void {
    // Register version-specific routes
    for (const version of this.config.versions) {
      this.app.register((instance, opts, done) => {
        // Add hook to set version
        instance.addHook('onRequest', (request: VersionedRequest, reply, done) => {
          request.apiVersion = version;
          done();
        });
        
        // Register version-specific routes
        this.registerVersionRoutes(instance, version);
        
        done();
      }, { prefix: `${prefix}/${version}` });
    }
  }
  
  /**
   * Register routes for a specific version
   * 
   * @param instance Fastify instance
   * @param version API version
   */
  private registerVersionRoutes(instance: FastifyInstance, version: string): void {
    // This method should be overridden by subclasses to register specific routes
    // For example:
    
    // if (version === 'v1') {
    //   instance.register(userRoutesV1, { prefix: '/users' });
    //   instance.register(pointsRoutesV1, { prefix: '/points' });
    // } else if (version === 'v2') {
    //   instance.register(userRoutesV2, { prefix: '/users' });
    //   instance.register(pointsRoutesV2, { prefix: '/points' });
    // }
  }
}

/**
 * Create a versioning middleware function
 * 
 * @param config Versioning configuration
 * @returns Middleware function
 */
export function createVersioningMiddleware(config: VersioningConfig = defaultVersioningConfig) {
  return async (request: VersionedRequest, reply: FastifyReply) => {
    // Extract version based on strategy
    let version = extractVersion(request, config);
    
    // Use default version if none found or not in supported versions
    if (!version || !config.versions.includes(version)) {
      version = config.defaultVersion;
    }
    
    // Set version in request for later use
    request.apiVersion = version;
    
    // Set version response header
    reply.header('X-API-Version', version);
    
    // Check if version is deprecated
    if (config.deprecatedVersions && config.deprecatedVersions[version]) {
      const deprecation = config.deprecatedVersions[version];
      reply.header('Deprecation', 'true');
      reply.header('Sunset', deprecation.sunsetDate.toUTCString());
    }
  };
}

/**
 * Set up API versioning for a Fastify instance
 * 
 * @param app Fastify instance
 * @param config Versioning configuration
 * @returns Version router instance
 */
export function setupApiVersioning(
  app: FastifyInstance,
  config: VersioningConfig = defaultVersioningConfig
): VersionRouter {
  return new VersionRouter(app, config);
}
