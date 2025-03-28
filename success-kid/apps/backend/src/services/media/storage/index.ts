/**
 * Storage Providers Index
 * 
 * Exports all storage provider interfaces and implementations
 */
import path from 'path';
import { env } from '../../../config';
import { StorageProvider } from './provider';
import { S3StorageProvider } from './s3-provider';
import { LocalStorageProvider } from './local-provider';

/**
 * Storage provider configuration from environment
 */
const storageConfig = {
  // S3 config (used in production)
  s3: {
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'success-kid-media',
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    baseUrl: process.env.MEDIA_CDN_URL
  },
  
  // Local storage config (used in development)
  local: {
    baseDir: process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'uploads'),
    baseUrl: process.env.LOCAL_STORAGE_URL || 'http://localhost:3001/media'
  },
  
  // Provider selection
  provider: process.env.STORAGE_PROVIDER || (env.NODE_ENV === 'production' ? 's3' : 'local')
};

// Create and export the configured storage provider
let storageProvider: StorageProvider;

if (storageConfig.provider === 's3') {
  // Use S3 provider in production
  storageProvider = new S3StorageProvider({
    region: storageConfig.s3.region,
    bucket: storageConfig.s3.bucket,
    endpoint: storageConfig.s3.endpoint,
    credentials: storageConfig.s3.accessKeyId && storageConfig.s3.secretAccessKey ? {
      accessKeyId: storageConfig.s3.accessKeyId,
      secretAccessKey: storageConfig.s3.secretAccessKey
    } : undefined,
    forcePathStyle: storageConfig.s3.forcePathStyle,
    baseUrl: storageConfig.s3.baseUrl
  });
} else {
  // Use local file system provider in development
  storageProvider = new LocalStorageProvider({
    baseDir: storageConfig.local.baseDir,
    baseUrl: storageConfig.local.baseUrl
  });
}

// Export types and provider
export * from './provider';
export { S3StorageProvider } from './s3-provider';
export { LocalStorageProvider } from './local-provider';

// Export singleton provider instance
export const storage = storageProvider;
