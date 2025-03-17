/**
 * WebSocket Performance Optimization
 * 
 * Implements performance optimizations for WebSocket communication,
 * including message batching, compression, and efficient resource usage.
 */
import { WebSocket } from 'ws';
import { logger } from '../lib/logger';
import zlib from 'zlib';
import { promisify } from 'util';

/**
 * Message to be sent
 */
interface QueuedMessage {
  /** Message content */
  message: any;
  
  /** Message priority (higher = higher priority) */
  priority: number;
  
  /** Message type (for batching) */
  type: string;
  
  /** Message ID */
  id: string;
  
  /** Should this message be compressed? */
  compress: boolean;
  
  /** When the message was queued */
  timestamp: number;
}

/**
 * Message batch options
 */
export interface MessageBatchOptions {
  /** Maximum messages per batch */
  maxBatchSize?: number;
  
  /** Maximum batch interval in milliseconds */
  batchInterval?: number;
  
  /** Minimum batch size before sending early */
  minBatchSize?: number;
  
  /** Maximum age of messages in milliseconds before forcing send */
  maxMessageAge?: number;
  
  /** Use compression for large messages */
  enableCompression?: boolean;
  
  /** Minimum size in bytes before compressing */
  compressionThreshold?: number;
  
  /** Enable priority queue for important messages */
  enablePriority?: boolean;
}

/**
 * Default batch options
 */
const DEFAULT_BATCH_OPTIONS: Required<MessageBatchOptions> = {
  maxBatchSize: 50,
  batchInterval: 50, // 50ms
  minBatchSize: 5,
  maxMessageAge: 500, // 500ms
  enableCompression: true,
  compressionThreshold: 1024, // 1KB
  enablePriority: true
};

/**
 * Message statistics
 */
interface MessageStats {
  /** Total messages sent */
  messagesSent: number;
  
  /** Total bytes sent */
  bytesSent: number;
  
  /** Average batch size */
  averageBatchSize: number;
  
  /** Messages per second */
  messagesPerSecond: number;
  
  /** Compression ratio */
  compressionRatio: number;
  
  /** Messages dropped due to overload */
  messagesDropped: number;
  
  /** Current queue size */
  queueSize: number;
}

/**
 * Promisified compression functions
 */
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

/**
 * WebSocket message batcher
 * Efficiently batches messages for improved performance
 */
export class MessageBatcher {
  private options: Required<MessageBatchOptions>;
  private queue: QueuedMessage[] = [];
  private timer: NodeJS.Timeout | null = null;
  private stats: MessageStats;
  private startTime: number;
  private lastFlushTime: number;
  
  /**
   * Create message batcher
   * @param sendFunction Function to send messages
   * @param options Batching options
   */
  constructor(
    private sendFunction: (data: string | Buffer) => void,
    options: MessageBatchOptions = {}
  ) {
    this.options = { ...DEFAULT_BATCH_OPTIONS, ...options };
    this.startTime = Date.now();
    this.lastFlushTime = this.startTime;
    this.stats = {
      messagesSent: 0,
      bytesSent: 0,
      averageBatchSize: 0,
      messagesPerSecond: 0,
      compressionRatio: 1,
      messagesDropped: 0,
      queueSize: 0
    };
  }
  
  /**
   * Queue a message for sending
   * @param message Message to send
   * @param priority Message priority (higher = higher priority)
   * @param type Message type for batching
   * @param compress Whether to compress the message
   */
  queue(
    message: any, 
    priority: number = 0, 
    type: string = 'default',
    compress: boolean = false
  ): void {
    // Skip if queue is too large (prevent memory issues)
    if (this.queue.length >= 1000) {
      logger.warn('Message queue full, dropping message', { type, messageCount: this.queue.length });
      this.stats.messagesDropped++;
      return;
    }
    
    // Add to queue
    this.queue.push({
      message,
      priority,
      type,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      compress: compress && this.options.enableCompression,
      timestamp: Date.now()
    });
    
    this.stats.queueSize = this.queue.length;
    
    // Schedule batch processing if not already scheduled
    if (!this.timer) {
      this.timer = setTimeout(() => this.processBatch(), this.options.batchInterval);
    }
    
    // Process immediately if high priority
    if (priority > 10 && this.options.enablePriority) {
      this.processBatch();
    }
    
    // Process immediately if we've reached max batch size
    if (this.queue.length >= this.options.maxBatchSize) {
      this.processBatch();
    }
  }
  
  /**
   * Process the current batch of messages
   */
  private async processBatch(): Promise<void> {
    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    // Skip if queue is empty
    if (this.queue.length === 0) {
      return;
    }
    
    // Check if we should wait for more messages
    const now = Date.now();
    const oldestMessage = this.queue[0].timestamp;
    const messageAge = now - oldestMessage;
    
    // Wait for more messages if:
    // 1. We haven't reached minimum batch size
    // 2. Oldest message isn't too old
    // 3. We don't have any high priority messages
    if (
      this.queue.length < this.options.minBatchSize &&
      messageAge < this.options.maxMessageAge &&
      !this.queue.some(msg => msg.priority > 5)
    ) {
      // Schedule another check
      this.timer = setTimeout(() => this.processBatch(), Math.min(
        this.options.batchInterval,
        this.options.maxMessageAge - messageAge
      ));
      return;
    }
    
    try {
      // Sort by priority if enabled
      if (this.options.enablePriority) {
        this.queue.sort((a, b) => b.priority - a.priority);
      }
      
      // Limit to max batch size
      const batch = this.queue.slice(0, this.options.maxBatchSize);
      
      // Remove processed messages from queue
      this.queue = this.queue.slice(batch.length);
      
      // Convert batch to a single message
      const batchMessage = {
        type: 'batch',
        messages: batch.map(item => ({
          ...item.message,
          _meta: {
            id: item.id,
            type: item.type,
            timestamp: item.timestamp
          }
        })),
        timestamp: now
      };
      
      // Convert to string
      const messageString = JSON.stringify(batchMessage);
      
      // Check if we should compress
      let sendData: string | Buffer = messageString;
      let compressed = false;
      
      if (
        this.options.enableCompression &&
        messageString.length > this.options.compressionThreshold
      ) {
        try {
          const compressedData = await deflate(Buffer.from(messageString));
          
          // Only use compressed data if it's smaller
          if (compressedData.length < messageString.length) {
            sendData = compressedData;
            compressed = true;
            
            // Update compression ratio
            const ratio = messageString.length / compressedData.length;
            this.stats.compressionRatio = (this.stats.compressionRatio + ratio) / 2;
          }
        } catch (error) {
          // Fall back to uncompressed on error
          logger.error('Compression error', { error });
        }
      }
      
      // Send the batch
      this.sendFunction(sendData);
      
      // Update stats
      this.updateStats(batch.length, typeof sendData === 'string' ? sendData.length : sendData.byteLength);
      
      // Check for remaining messages
      if (this.queue.length > 0) {
        this.timer = setTimeout(() => this.processBatch(), this.options.batchInterval);
      }
    } catch (error) {
      logger.error('Error processing message batch', { error });
      
      // Schedule retry for remaining messages
      if (this.queue.length > 0) {
        this.timer = setTimeout(() => this.processBatch(), this.options.batchInterval * 2);
      }
    }
  }
  
  /**
   * Flush all pending messages
   */
  flush(): void {
    if (this.queue.length > 0) {
      this.processBatch();
    }
  }
  
  /**
   * Update performance statistics
   * @param messageCount Number of messages sent
   * @param byteCount Number of bytes sent
   */
  private updateStats(messageCount: number, byteCount: number): void {
    const now = Date.now();
    
    // Update message stats
    this.stats.messagesSent += messageCount;
    this.stats.bytesSent += byteCount;
    
    // Update average batch size
    this.stats.averageBatchSize = (this.stats.averageBatchSize + messageCount) / 2;
    
    // Update messages per second
    const timeSinceStart = (now - this.startTime) / 1000;
    this.stats.messagesPerSecond = this.stats.messagesSent / timeSinceStart;
    
    // Update queue size
    this.stats.queueSize = this.queue.length;
    
    // Save last flush time
    this.lastFlushTime = now;
  }
  
  /**
   * Get performance statistics
   * @returns Current statistics
   */
  getStats(): MessageStats {
    return { ...this.stats };
  }
}

/**
 * WebSocket connection with performance optimizations
 */
export class OptimizedWebSocket {
  private batcher: MessageBatcher;
  private socket: WebSocket;
  private isCompressSupported: boolean = false;
  
  /**
   * Create optimized WebSocket wrapper
   * @param socket WebSocket connection
   * @param options Performance options
   */
  constructor(
    socket: WebSocket,
    options: MessageBatchOptions = {}
  ) {
    this.socket = socket;
    this.batcher = new MessageBatcher(
      this.sendRaw.bind(this),
      options
    );
    
    // Check if compression is supported (client indicates in upgrade headers)
    // This is a simplified check - in production, use proper extension negotiation
    if (socket.protocol && socket.protocol.includes('permessage-deflate')) {
      this.isCompressSupported = true;
    }
  }
  
  /**
   * Send a message through the optimized WebSocket
   * @param message Message to send
   * @param priority Message priority
   * @param type Message type
   * @param compress Whether to compress
   */
  send(
    message: any,
    priority: number = 0,
    type: string = 'default',
    compress: boolean = false
  ): void {
    // Queue message for sending
    this.batcher.queue(message, priority, type, compress && this.isCompressSupported);
  }
  
  /**
   * Send raw data directly to the WebSocket
   * @param data Data to send
   */
  private sendRaw(data: string | Buffer): void {
    try {
      if (this.socket.readyState === WebSocket.OPEN) {
        // If data is a Buffer and compression is supported, mark as binary message
        const options = Buffer.isBuffer(data) && this.isCompressSupported
          ? { binary: true, compress: false } // Already compressed
          : undefined;
          
        this.socket.send(data, options);
      }
    } catch (error) {
      logger.error('Error sending WebSocket data', { error });
    }
  }
  
  /**
   * Flush all pending messages
   */
  flush(): void {
    this.batcher.flush();
  }
  
  /**
   * Close the WebSocket connection
   * @param code Close code
   * @param reason Close reason
   */
  close(code?: number, reason?: string): void {
    // Flush any pending messages
    this.flush();
    
    // Close the socket
    this.socket.close(code, reason);
  }
  
  /**
   * Get the underlying WebSocket
   * @returns WebSocket instance
   */
  getSocket(): WebSocket {
    return this.socket;
  }
  
  /**
   * Get performance statistics
   * @returns Current statistics
   */
  getStats(): MessageStats {
    return this.batcher.getStats();
  }
}

/**
 * WebSocket message processor for the client side
 * Handles batched and compressed messages
 */
export class WebSocketMessageProcessor {
  /**
   * Process incoming WebSocket message
   * @param data Message data
   * @param handlers Message handlers
   * @returns Process result with handled message count
   */
  static async processMessage(
    data: string | ArrayBuffer | Buffer,
    handlers: Map<string, Set<(data: any) => void>>
  ): Promise<{ handled: number; errors: number }> {
    try {
      let messageText: string;
      
      // Handle compressed data (binary message)
      if (data instanceof ArrayBuffer || Buffer.isBuffer(data)) {
        try {
          const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
          const decompressed = await inflate(buffer);
          messageText = decompressed.toString('utf8');
        } catch (error) {
          // Not compressed or invalid compression
          messageText = Buffer.isBuffer(data)
            ? data.toString('utf8')
            : new TextDecoder().decode(data);
        }
      } else {
        // Already text
        messageText = data;
      }
      
      // Parse the message
      const message = JSON.parse(messageText);
      
      // Check if it's a batch
      if (message.type === 'batch' && Array.isArray(message.messages)) {
        // Process each message in the batch
        let handled = 0;
        let errors = 0;
        
        for (const msg of message.messages) {
          try {
            // Extract metadata
            const meta = msg._meta || {};
            const type = meta.type || msg.type;
            
            // Remove metadata before passing to handlers
            if (msg._meta) {
              delete msg._meta;
            }
            
            // Call handlers for this message type
            if (this.callHandlers(type, msg, handlers)) {
              handled++;
            }
          } catch (error) {
            errors++;
          }
        }
        
        return { handled, errors };
      } else {
        // Single message
        const handled = this.callHandlers(message.type, message, handlers) ? 1 : 0;
        return { handled, errors: 0 };
      }
    } catch (error) {
      console.error('Error processing WebSocket message', error);
      return { handled: 0, errors: 1 };
    }
  }
  
  /**
   * Call handlers for a specific message type
   * @param type Message type
   * @param message Message data
   * @param handlers Message handlers
   * @returns Whether message was handled
   */
  private static callHandlers(
    type: string,
    message: any,
    handlers: Map<string, Set<(data: any) => void>>
  ): boolean {
    let handled = false;
    
    // Get handlers for this type
    const typeHandlers = handlers.get(type);
    if (typeHandlers && typeHandlers.size > 0) {
      typeHandlers.forEach(handler => {
        try {
          handler(message);
          handled = true;
        } catch (error) {
          console.error(`Error in handler for ${type}`, error);
        }
      });
    }
    
    // Call wildcard handlers
    const wildcardHandlers = handlers.get('*');
    if (wildcardHandlers && wildcardHandlers.size > 0) {
      wildcardHandlers.forEach(handler => {
        try {
          handler({ type, ...message });
          handled = true;
        } catch (error) {
          console.error(`Error in wildcard handler for ${type}`, error);
        }
      });
    }
    
    return handled;
  }
}
