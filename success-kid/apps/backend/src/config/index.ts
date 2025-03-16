/**
 * Configuration
 * 
 * Application configuration from environment variables
 */

// Database configuration
export const databaseConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/success_kid',
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  },
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Redis configuration
export const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'sk:',
  options: {
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    retry_strategy: (times: number) => Math.min(times * 50, 2000), // exponential backoff
    enableReadyCheck: true,
  },
};

// Media Storage configuration
export const mediaConfig = {
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  localStorage: {
    basePath: process.env.STORAGE_LOCAL_PATH || './uploads',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  },
  s3Storage: {
    bucketName: process.env.S3_BUCKET_NAME || 'media-bucket',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    cdnBaseUrl: process.env.S3_CDN_BASE_URL,
  },
  uploadLimits: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760', 10), // 10MB
    imageMaxSize: parseInt(process.env.UPLOAD_IMAGE_MAX_SIZE || '10485760', 10), // 10MB
    videoMaxSize: parseInt(process.env.UPLOAD_VIDEO_MAX_SIZE || '104857600', 10), // 100MB
    documentMaxSize: parseInt(process.env.UPLOAD_DOCUMENT_MAX_SIZE || '20971520', 10), // 20MB
  },
  allowedMimeTypes: {
    image: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml').split(','),
    video: (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm,video/ogg').split(','),
    document: (process.env.ALLOWED_DOCUMENT_TYPES || 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv').split(','),
    audio: (process.env.ALLOWED_AUDIO_TYPES || 'audio/mpeg,audio/ogg,audio/wav,audio/webm').split(','),
  },
};
