/**
 * Media Model
 * 
 * Represents media files in the system including images, videos and other files
 */

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other',
}

export enum MediaStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
  DELETED = 'deleted',
}

/**
 * Dimensions interface for media metadata
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * GeoLocation interface for media metadata
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/**
 * MediaMetadata interface containing metadata extracted from media files
 */
export interface MediaMetadata {
  dimensions?: Dimensions;
  duration?: number;
  format?: string;
  colorSpace?: string;
  orientation?: number;
  hasAudio?: boolean;
  location?: GeoLocation;
  tags?: string[];
  extractedText?: string;
  author?: string;
  copyright?: string;
  createdAt?: Date;
  [key: string]: any; // Allow for additional properties
}

/**
 * MediaVariant interface representing processed variants of media
 */
export interface MediaVariant {
  name: string;
  path: string;
  mimeType: string;
  dimensions?: Dimensions;
  size: number;
  quality?: number;
  format?: string;
}

/**
 * Media entity
 */
export interface Media {
  id: string;
  userId: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: MediaType;
  path: string;
  publicUrl?: string;
  status: MediaStatus;
  metadata?: MediaMetadata;
  variants?: Record<string, MediaVariant>;
  createdAt: Date;
  updatedAt: Date;
  processingCompletedAt?: Date;
}

/**
 * CreateMediaDto for creating new media records
 */
export interface CreateMediaDto {
  userId: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: MediaType;
  path: string;
  publicUrl?: string;
  status?: MediaStatus;
  metadata?: MediaMetadata;
}

/**
 * UpdateMediaDto for updating media records
 */
export interface UpdateMediaDto {
  status?: MediaStatus;
  metadata?: MediaMetadata;
  variants?: Record<string, MediaVariant>;
  processingCompletedAt?: Date;
  publicUrl?: string;
}

/**
 * UploadOptions interface for upload settings
 */
export interface UploadOptions {
  filename: string;
  mimeType: string;
  userId: string;
  generateVariants?: boolean;
  maxSizeBytes?: number; // Default will be set in service
  visibility?: 'public' | 'private'; // Default private
  folder?: string; // Optional subfolder
}

/**
 * StorageOptions interface for storage settings
 */
export interface StorageOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  acl?: 'private' | 'public-read' | 'authenticated-read';
}

/**
 * ValidationResult interface for file validation
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * DeliveryOptions interface for media delivery
 */
export interface DeliveryOptions {
  variant?: string;
  resize?: ResizeOptions;
  format?: string;
  quality?: number;
  download?: boolean;
  transformation?: TransformOptions;
}

/**
 * ResizeOptions interface for image resizing
 */
export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string | number;
}

/**
 * TransformOptions interface for image transformations
 */
export interface TransformOptions {
  resize?: ResizeOptions;
  crop?: CropOptions;
  rotate?: RotateOptions;
  flip?: FlipOptions;
  format?: string;
  quality?: number;
  effect?: string;
  filter?: string;
  watermark?: WatermarkOptions;
}

/**
 * CropOptions interface for image cropping
 */
export interface CropOptions {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * RotateOptions interface for image rotation
 */
export interface RotateOptions {
  angle: number;
  background?: string;
}

/**
 * FlipOptions interface for image flipping
 */
export interface FlipOptions {
  horizontal?: boolean;
  vertical?: boolean;
}

/**
 * WatermarkOptions interface for image watermarking
 */
export interface WatermarkOptions {
  text?: string;
  image?: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity?: number;
  size?: number;
}

/**
 * ImageProcessingOptions interface for image processing
 */
export interface ImageProcessingOptions {
  resize?: ResizeOptions;
  format?: string;
  quality?: number;
  effects?: ImageEffects;
  metadata?: boolean;
}

/**
 * ImageEffects interface for image effects
 */
export interface ImageEffects {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  grayscale?: boolean;
  blur?: number;
  sharpen?: number;
}
