/**
 * Multer Plugin
 * 
 * Fastify plugin for file uploads using multer
 */
import { FastifyPlugin } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import multer from 'fastify-multer';
import { mediaConfig } from '../config';

const multerPlugin: FastifyPlugin = async (fastify) => {
  // Register multer for file uploads
  fastify.register(multer.contentParser);
  
  // Create upload middleware with various presets
  const upload = {
    // Single file upload with default options
    single: multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: mediaConfig.uploadLimits.maxFileSize,
        files: 1
      }
    }).single('file'),
    
    // Image upload with image-specific limits
    image: multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: mediaConfig.uploadLimits.imageMaxSize,
        files: 1
      },
      fileFilter: (req, file, cb) => {
        if (mediaConfig.allowedMimeTypes.image.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${mediaConfig.allowedMimeTypes.image.join(', ')}`), false);
        }
      }
    }).single('file'),
    
    // Video upload with video-specific limits
    video: multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: mediaConfig.uploadLimits.videoMaxSize,
        files: 1
      },
      fileFilter: (req, file, cb) => {
        if (mediaConfig.allowedMimeTypes.video.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${mediaConfig.allowedMimeTypes.video.join(', ')}`), false);
        }
      }
    }).single('file'),
    
    // Document upload with document-specific limits
    document: multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: mediaConfig.uploadLimits.documentMaxSize,
        files: 1
      },
      fileFilter: (req, file, cb) => {
        if (mediaConfig.allowedMimeTypes.document.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${mediaConfig.allowedMimeTypes.document.join(', ')}`), false);
        }
      }
    }).single('file'),
    
    // Multiple file upload (up to 10 files)
    array: multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: mediaConfig.uploadLimits.maxFileSize,
        files: 10
      }
    }).array('files', 10)
  };
  
  // Decorate fastify instance with upload middleware
  fastify.decorate('upload', upload);
};

export default fastifyPlugin(multerPlugin);
