/**
 * WebSocket Message Batcher
 * 
 * Optimizes WebSocket communication by batching messages and
 * managing high-frequency updates.
 */
import { WebSocket } from 'ws';
import { logger } from '../lib/logger';

/**
 * Message type for batched messages
 */
interface BatchedMessage {
  type: string;
  data: any;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
}

/**
 * Message priority determines batching behavior
 * - high: Send immediately without batching
 * - normal: Standard batching
 * - low: May be dropped during high load
 */
export type MessagePriority = 'high' | 'normal' | 'low';

/**
 * Batching strategy options
 */
export interface BatchingOptions {
  batchIntervalMs: number;        // Time between batches
  maxBatchSize: number;           // Maximum messages per batch
  compressionThreshold: number;   // Compress messages larger than this (bytes)
  dropLowPriorityThreshold: number; // Drop low priority when queue exceeds this
  maxQueueSize: number;           // Maximum queue size before applying backpressure
}

/**
 * Default batching options
 */
const DEFAULT_BATCHING_OPTIONS: BatchingOptions = {
  batchIntervalMs: 50,            // 50ms between batches
  maxBatchSize: 50,               // Max 50 messages per batch
  compressionThreshold: 1024,     // Compress messages > 1KB
  dropLowPriorityThreshold: 100,  // Drop low priority when queue > 100
  maxQueueSize: 500,              // Max 500 messages in queue
};

/**
 * WebSocket message batcher for optimizing high-frequency messages
 */
export class MessageBatcher {
  private options: BatchingOptions;
  private queues: Map<WebSocket, BatchedMessage[]> = new Map();
  private timers: Map<WebSocket, NodeJS.Timeout> = new Map();
  private overloadedWebSockets: Set<WebSocket> = new Set();
  private readonly HIGH_LOAD_THRESHOLD = 0.7; // 70% of max queue size
  
  /**
   * Create a new message batcher
   * @param options Batching options
   */
  constructor(options: Partial<BatchingOptions> = {}) {
    this.options = { ...DEFAULT_BATCHING_OPTIONS, ...options };
  }
  
  /**
   * Queue a message for batched delivery
   * 
   * @param socket WebSocket to send message to
   * @param type Message type
   * @param data Message data
   * @param priority Message priority
   */
  queueMessage(
    socket: WebSocket,
    type: string,
    data: any,
    priority: MessagePriority = 'normal'
  ): void {
    // Don't queue if socket is not open
    if (socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // For high priority messages, send immediately
    if (priority === 'high') {
      this.sendImmediate(socket, { type, data });
      return;
    }
    
    // Initialize queue if needed
    if (!this.queues.has(socket)) {
      this.queues.set(socket, []);
    }
    
    const queue = this.queues.get(socket)!;
    
    // Check if queue is overloaded
    const isOverloaded = queue.length >= this.options.dropLowPriorityThreshold;
    
    // Handle backpressure if queue is at max capacity
    if (queue.length >= this.options.maxQueueSize) {
      // Only allow high priority messages
      if (priority !== 'high') {
        // Track overloaded state for monitoring
        if (!this.overloadedWebSockets.has(socket)) {
          this.overloadedWebSockets.add(socket);
          logger.warn('WebSocket queue at capacity, applying backpressure', {
            queueSize: queue.length,
            maxSize: this.options.maxQueueSize
          });
        }
        return;
      }
    } else if (
      // Drop low priority messages when under high load
      isOverloaded && priority === 'low'
    ) {
      return;
    }
    
    // Reset overloaded state if queue size decreases
    if (
      this.overloadedWebSockets.has(socket) && 
      queue.length < this.options.maxQueueSize * this.HIGH_LOAD_THRESHOLD
    ) {
      this.overloadedWebSockets.delete(socket);
    }
    
    // Add message to queue
    queue.push({
      type,
      data,
      priority,
      timestamp: Date.now()
    });
    
    // Start timer if not already running
    this.ensureTimerRunning(socket);
  }
  
  /**
   * Update a key in a message if it exists in the queue
   * 
   * Useful for efficiently updating values without sending multiple messages
   * 
   * @param socket WebSocket connection
   * @param type Message type to match
   * @param keyPath Path to the key to update (e.g., 'user.points')
   * @param value New value
   * @returns True if message was found and updated
   */
  updateMessageValue(
    socket: WebSocket,
    type: string,
    keyPath: string,
    value: any
  ): boolean {
    const queue = this.queues.get(socket);
    
    if (!queue || queue.length === 0) {
      return false;
    }
    
    // Find matching message
    for (const message of queue) {
      if (message.type === type) {
        // Update nested property using keyPath
        const keys = keyPath.split('.');
        let target = message.data;
        
        // Navigate to the nested object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) {
            target[keys[i]] = {};
          }
          target = target[keys[i]];
        }
        
        // Update the value
        const lastKey = keys[keys.length - 1];
        target[lastKey] = value;
        
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Send a message immediately without batching
   * 
   * @param socket WebSocket to send to
   * @param message Message to send
   */
  private sendImmediate(socket: WebSocket, message: { type: string; data: any }): void {
    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    } catch (error) {
      logger.error('Error sending immediate WebSocket message', { error });
    }
  }
  
  /**
   * Ensure timer is running for a socket
   * 
   * @param socket WebSocket connection
   */
  private ensureTimerRunning(socket: WebSocket): void {
    if (!this.timers.has(socket)) {
      const timer = setTimeout(() => {
        this.processQueue(socket);
      }, this.options.batchIntervalMs);
      
      this.timers.set(socket, timer);
      
      // Clean up when socket closes
      socket.once('close', () => {
        this.cleanup(socket);
      });
    }
  }
  
  /**
   * Process the message queue for a socket
   * 
   * @param socket WebSocket connection
   */
  private processQueue(socket: WebSocket): void {
    // Clear timer
    if (this.timers.has(socket)) {
      clearTimeout(this.timers.get(socket)!);
      this.timers.delete(socket);
    }
    
    // Get queue
    const queue = this.queues.get(socket);
    
    if (!queue || queue.length === 0) {
      return;
    }
    
    try {
      // Check if socket is still open
      if (socket.readyState !== WebSocket.OPEN) {
        this.cleanup(socket);
        return;
      }
      
      // Process messages
      const messagesToSend = queue.splice(0, this.options.maxBatchSize);
      
      // If only one message, send directly
      if (messagesToSend.length === 1) {
        const message = messagesToSend[0];
        socket.send(JSON.stringify({
          type: message.type,
          payload: message.data
        }));
      } else {
        // Send as batch
        socket.send(JSON.stringify({
          type: 'batch',
          payload: messagesToSend.map(msg => ({
            type: msg.type,
            payload: msg.data,
            timestamp: msg.timestamp
          }))
        }));
      }
      
      // If more messages in queue, schedule next batch
      if (queue.length > 0) {
        this.ensureTimerRunning(socket);
      }
    } catch (error) {
      logger.error('Error processing WebSocket message batch', { error });
      
      // Clean up on error
      this.cleanup(socket);
    }
  }
  
  /**
   * Clean up resources for a socket
   * 
   * @param socket WebSocket connection
   */
  private cleanup(socket: WebSocket): void {
    // Clear timer
    if (this.timers.has(socket)) {
      clearTimeout(this.timers.get(socket)!);
      this.timers.delete(socket);
    }
    
    // Clear queue
    this.queues.delete(socket);
    
    // Clear overloaded state
    this.overloadedWebSockets.delete(socket);
  }
  
  /**
   * Flush all queued messages immediately
   * 
   * @param socket WebSocket connection (optional, all if not specified)
   */
  flush(socket?: WebSocket): void {
    if (socket) {
      // Flush specific socket
      this.processQueue(socket);
    } else {
      // Flush all sockets
      for (const [sock] of this.queues) {
        this.processQueue(sock);
      }
    }
  }
  
  /**
   * Get the queue length for a socket
   * 
   * @param socket WebSocket connection
   * @returns Queue length
   */
  getQueueLength(socket: WebSocket): number {
    return this.queues.get(socket)?.length || 0;
  }
  
  /**
   * Get total queued messages across all sockets
   * 
   * @returns Total queued messages
   */
  getTotalQueuedMessages(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }
  
  /**
   * Check if a socket is experiencing backpressure
   * 
   * @param socket WebSocket connection
   * @returns True if socket is overloaded
   */
  isOverloaded(socket: WebSocket): boolean {
    return this.overloadedWebSockets.has(socket);
  }
  
  /**
   * Get the number of overloaded sockets
   * 
   * @returns Number of overloaded sockets
   */
  getOverloadedCount(): number {
    return this.overloadedWebSockets.size;
  }
}

// Export singleton instance
export const messageBatcher = new MessageBatcher();