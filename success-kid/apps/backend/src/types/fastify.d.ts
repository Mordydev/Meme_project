import { FastifyRequest } from 'fastify';
import { MultipartFile } from '@fastify/multipart'; // Import the type from the plugin

// Augment the FastifyRequest interface
declare module 'fastify' {
  interface FastifyRequest {
    // Define the .file() method signature based on @fastify/multipart
    // Adjust return type if needed based on plugin version/configuration
    file: () => Promise<MultipartFile | undefined>;

    // If you allow multiple files via request.files(), declare it too:
    // files: () => AsyncIterableIterator<MultipartFile>;

    // Properties potentially added by other plugins or hooks (e.g., in app.ts)
    routerPath?: string; // Optional, assuming it might not always be present
    locals?: Record<string, any>; // Generic object for passing data
  }
}

// Optional: Define a more specific type for your multipart file data if needed
// This seems similar to the interface already in handler.ts, maybe consolidate later
// export interface AppMultipartFile extends MultipartFile {
//   // Add any custom properties or methods if necessary
// }
