/**
 * API Client Generator
 * 
 * Generates type-safe API clients and interface definitions from API contracts.
 */
import * as fs from 'fs';
import * as path from 'path';
import { compile } from 'json-schema-to-typescript';
import { ApiContract, ApiEndpoint, GeneratorOptions } from './types';

/**
 * Generate TypeScript interfaces from API contract
 * 
 * @param contract API contract
 * @param options Generator options
 */
export async function generateTypeInterfaces(
  contract: ApiContract,
  options: GeneratorOptions
): Promise<void> {
  const outputDir = path.join(options.outputDir, 'interfaces');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate interfaces for all schemas
  for (const [name, schema] of Object.entries(contract.components.schemas)) {
    try {
      const ts = await compile(schema, name, {
        bannerComment: '',
        style: {
          singleQuote: true,
          semi: true,
          tabWidth: 2,
          trailingComma: 'es5',
          printWidth: 100,
        }
      });
      
      fs.writeFileSync(path.join(outputDir, `${name}.ts`), ts);
    } catch (error) {
      console.error(`Error generating interface for ${name}:`, error);
    }
  }
  
  // Generate index file
  const indexContent = Object.keys(contract.components.schemas)
    .map(name => `export * from './${name}';`)
    .join('\n');
  
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
}

/**
 * Generate TypeScript API client from API contract
 * 
 * @param contract API contract
 * @param options Generator options
 */
export async function generateApiClient(
  contract: ApiContract,
  options: GeneratorOptions
): Promise<void> {
  const outputDir = path.join(options.outputDir, 'client');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate endpoints by tag
  const endpointsByTag = groupEndpointsByTag(contract.endpoints);
  
  for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
    const clientContent = generateClientForTag(tag, endpoints, options);
    fs.writeFileSync(path.join(outputDir, `${toKebabCase(tag)}.ts`), clientContent);
  }
  
  // Generate base client
  const baseClientContent = generateBaseClient(contract);
  fs.writeFileSync(path.join(outputDir, 'base-client.ts'), baseClientContent);
  
  // Generate index file
  const indexContent = [
    `export * from './base-client';`,
    ...Object.keys(endpointsByTag).map(tag => `export * from './${toKebabCase(tag)}';`),
    '',
    `// Main API client export`,
    `import { ApiClient } from './base-client';`,
    ...Object.keys(endpointsByTag).map(tag => `import { ${toPascalCase(tag)}Client } from './${toKebabCase(tag)}';`),
    '',
    `/**`,
    ` * Create main API client with all endpoints`,
    ` */`,
    `export function createApiClient(baseUrl: string, options: ApiClientOptions = {}) {`,
    `  const baseClient = new ApiClient(baseUrl, options);`,
    '',
    `  return {`,
    `    // Base client methods`,
    `    ...baseClient,`,
    '',
    `    // Endpoint groups`,
    ...Object.keys(endpointsByTag).map(tag => `    ${toCamelCase(tag)}: new ${toPascalCase(tag)}Client(baseClient),`),
    `  };`,
    `}`,
  ].join('\n');
  
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
}

/**
 * Group endpoints by tag
 * 
 * @param endpoints API endpoints
 * @returns Endpoints grouped by tag
 */
function groupEndpointsByTag(endpoints: ApiEndpoint[]): Record<string, ApiEndpoint[]> {
  const result: Record<string, ApiEndpoint[]> = {};
  
  for (const endpoint of endpoints) {
    const tags = endpoint.tags || ['default'];
    
    for (const tag of tags) {
      if (!result[tag]) {
        result[tag] = [];
      }
      
      result[tag].push(endpoint);
    }
  }
  
  return result;
}

/**
 * Generate client code for a tag
 * 
 * @param tag Tag name
 * @param endpoints Endpoints for this tag
 * @param options Generator options
 * @returns Generated client code
 */
function generateClientForTag(
  tag: string,
  endpoints: ApiEndpoint[],
  options: GeneratorOptions
): string {
  const lines: string[] = [
    `/**`,
    ` * ${toPascalCase(tag)} API Client`,
    ` * Generated from API contract`,
    ` */`,
    `import { ApiClient } from './base-client';`,
    ``
  ];
  
  // Add imports for request/response types
  const typeImports = new Set<string>();
  
  for (const endpoint of endpoints) {
    if (endpoint.requestSchema?.$ref) {
      const type = getTypeFromRef(endpoint.requestSchema.$ref);
      if (type) typeImports.add(type);
    }
    
    if (endpoint.responseSchema?.$ref) {
      const type = getTypeFromRef(endpoint.responseSchema.$ref);
      if (type) typeImports.add(type);
    }
  }
  
  if (typeImports.size > 0) {
    lines.push(`import { ${Array.from(typeImports).join(', ')} } from '../interfaces';`);
    lines.push('');
  }
  
  // Define client class
  lines.push(`/**`);
  lines.push(` * API client for ${tag} endpoints`);
  lines.push(` */`);
  lines.push(`export class ${toPascalCase(tag)}Client {`);
  lines.push(`  constructor(private client: ApiClient) {}`);
  lines.push('');
  
  // Add methods for each endpoint
  for (const endpoint of endpoints) {
    // Skip deprecated endpoints if configured
    if (!options.includeDeprecated && endpoint.deprecated) {
      continue;
    }
    
    const methodName = getMethodNameFromEndpoint(endpoint);
    const params = getParamsForEndpoint(endpoint);
    const returnType = getReturnTypeForEndpoint(endpoint);
    
    // Add method documentation
    lines.push(`  /**`);
    lines.push(`   * ${endpoint.description}`);
    lines.push(`   *`);
    
    // Document parameters
    if (endpoint.pathParams?.length) {
      for (const param of endpoint.pathParams) {
        lines.push(`   * @param ${param} Path parameter`);
      }
    }
    
    if (endpoint.queryParams) {
      lines.push(`   * @param params Query parameters`);
    }
    
    if (endpoint.requestSchema) {
      lines.push(`   * @param data Request body`);
    }
    
    lines.push(`   */`);
    
    // Add deprecated tag if applicable
    if (endpoint.deprecated) {
      lines.push(`  @deprecated`);
    }
    
    // Generate method signature
    lines.push(`  async ${methodName}(${params}): Promise<${returnType}> {`);
    
    // Generate method body
    const url = generateUrlForEndpoint(endpoint);
    
    lines.push(`    return this.client.request({`);
    lines.push(`      method: '${endpoint.method}',`);
    lines.push(`      url: ${url},`);
    
    if (endpoint.requestSchema) {
      lines.push(`      data,`);
    }
    
    if (endpoint.queryParams) {
      lines.push(`      params,`);
    }
    
    lines.push(`    });`);
    lines.push(`  }`);
    lines.push('');
  }
  
  lines.push(`}`);
  
  return lines.join('\n');
}

/**
 * Generate base client code
 * 
 * @param contract API contract
 * @returns Generated base client code
 */
function generateBaseClient(contract: ApiContract): string {
  return `/**
 * Base API Client
 * Generated from API contract
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * API client options
 */
export interface ApiClientOptions {
  /**
   * Default headers to include with every request
   */
  headers?: Record<string, string>;
  
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Whether to include credentials in cross-origin requests
   */
  withCredentials?: boolean;
  
  /**
   * Authentication token provider
   */
  getAuthToken?: () => string | Promise<string>;
  
  /**
   * Custom error handler
   */
  onError?: (error: any) => void;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  data: null;
  meta: {
    timestamp: string;
    requestId: string;
  };
  errors: Array<{
    code: string;
    message: string;
    details?: any[];
  }>;
}

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

/**
 * Base API client
 */
export class ApiClient {
  private axios: AxiosInstance;
  
  /**
   * Create API client
   * 
   * @param baseURL API base URL
   * @param options Client options
   */
  constructor(baseURL: string, private options: ApiClientOptions = {}) {
    this.axios = axios.create({
      baseURL,
      timeout: options.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      withCredentials: options.withCredentials
    });
    
    // Add request interceptor for auth token
    this.axios.interceptors.request.use(async (config) => {
      // Add auth token if available
      if (this.options.getAuthToken) {
        const token = await this.options.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = \`Bearer \${token}\`;
        }
      }
      
      // Add transaction ID for non-GET requests
      if (config.method !== 'get' && config.headers) {
        config.headers['x-transaction-id'] = this.generateTransactionId();
      }
      
      return config;
    });
    
    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => {
        // Extract data from standardized API response
        if (response.data && 'data' in response.data) {
          return { ...response, data: response.data.data };
        }
        return response;
      },
      (error) => {
        // Handle API errors with standardized structure
        const errorData = error.response?.data as ApiErrorResponse;
        
        if (errorData?.errors?.length) {
          const apiError = errorData.errors[0];
          const appError = new AppError(
            apiError.message,
            apiError.code,
            apiError.details,
            error.response?.status
          );
          
          // Call custom error handler if provided
          if (this.options.onError) {
            this.options.onError(appError);
          }
          
          return Promise.reject(appError);
        }
        
        // Handle network errors
        if (!error.response) {
          const networkError = new AppError(
            'Network error. Please check your connection.',
            'NETWORK_ERROR',
            undefined,
            0
          );
          
          if (this.options.onError) {
            this.options.onError(networkError);
          }
          
          return Promise.reject(networkError);
        }
        
        // Handle other errors
        const genericError = new AppError(
          error.message || 'An unexpected error occurred',
          'UNKNOWN_ERROR',
          undefined,
          error.response?.status
        );
        
        if (this.options.onError) {
          this.options.onError(genericError);
        }
        
        return Promise.reject(genericError);
      }
    );
  }
  
  /**
   * Make a request
   * 
   * @param config Request configuration
   * @returns Response data
   */
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axios(config);
    return response.data;
  }
  
  /**
   * Generate transaction ID
   * 
   * @returns Transaction ID
   */
  private generateTransactionId(): string {
    // Simple UUID v4 implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
`;
}

/**
 * Get method name from endpoint
 * 
 * @param endpoint API endpoint
 * @returns Method name
 */
function getMethodNameFromEndpoint(endpoint: ApiEndpoint): string {
  // Extract base path without version and parameters
  const basePath = endpoint.path
    .replace(/^\/api\/v\d+/, '')
    .replace(/\/{[^}]+}/g, '');
  
  // Split by slash and filter empty segments
  const segments = basePath.split('/').filter(Boolean);
  
  // For typical REST patterns, use the method as prefix
  if (segments.length >= 1) {
    const resource = segments[segments.length - 1];
    const resourceSingular = resource.endsWith('s') ? resource.slice(0, -1) : resource;
    
    switch (endpoint.method) {
      case 'GET':
        // /users -> getUsers, /users/{id} -> getUser
        return endpoint.path.includes('{')
          ? `get${toPascalCase(resourceSingular)}`
          : `get${toPascalCase(resource)}`;
          
      case 'POST':
        // /users -> createUser
        return `create${toPascalCase(resourceSingular)}`;
        
      case 'PUT':
        // /users/{id} -> updateUser
        return `update${toPascalCase(resourceSingular)}`;
        
      case 'PATCH':
        // /users/{id} -> partialUpdateUser
        return `partialUpdate${toPascalCase(resourceSingular)}`;
        
      case 'DELETE':
        // /users/{id} -> deleteUser
        return `delete${toPascalCase(resourceSingular)}`;
        
      default:
        // default fallback
        return `${endpoint.method.toLowerCase()}${toPascalCase(resource)}`;
    }
  }
  
  // Fallback to method + path
  return `${endpoint.method.toLowerCase()}${segments.map(toPascalCase).join('')}`;
}

/**
 * Get parameters for endpoint method
 * 
 * @param endpoint API endpoint
 * @returns Parameters string
 */
function getParamsForEndpoint(endpoint: ApiEndpoint): string {
  const params: string[] = [];
  
  // Add path parameters
  if (endpoint.pathParams?.length) {
    for (const param of endpoint.pathParams) {
      params.push(`${param}: string`);
    }
  }
  
  // Add query parameters
  if (endpoint.queryParams) {
    params.push(`params?: any`); // TODO: Generate proper type
  }
  
  // Add request body
  if (endpoint.requestSchema) {
    params.push(`data: any`); // TODO: Get proper type
  }
  
  return params.join(', ');
}

/**
 * Get return type for endpoint method
 * 
 * @param endpoint API endpoint
 * @returns Return type
 */
function getReturnTypeForEndpoint(endpoint: ApiEndpoint): string {
  // TODO: Extract type from schema
  return 'any';
}

/**
 * Generate URL string for endpoint
 * 
 * @param endpoint API endpoint
 * @returns URL generation code
 */
function generateUrlForEndpoint(endpoint: ApiEndpoint): string {
  if (!endpoint.pathParams?.length) {
    return `'${endpoint.path}'`;
  }
  
  // Use template string for path params
  return '`' + endpoint.path.replace(/\{([^}]+)\}/g, '${$1}') + '`';
}

/**
 * Get type name from schema reference
 * 
 * @param ref Schema reference
 * @returns Type name
 */
function getTypeFromRef(ref: string): string | null {
  const match = ref.match(/#\/components\/schemas\/(.+)/);
  return match ? match[1] : null;
}

/**
 * Convert string to kebab case
 * 
 * @param str Input string
 * @returns Kebab case string
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to pascal case
 * 
 * @param str Input string
 * @returns Pascal case string
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert string to camel case
 * 
 * @param str Input string
 * @returns Camel case string
 */
function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
