/**
 * Realtime Fallback Client
 * 
 * Provides fallback mechanisms for real-time communication when WebSockets
 * are unavailable or experiencing issues.
 */
import { WebSocketMessage, WebSocketEventType } from '@success-kid/types';

/**
 * Polling configuration options
 */
export interface PollingOptions {
  /** Polling interval in milliseconds */
  interval?: number;
  /** Maximum polling interval in milliseconds */
  maxInterval?: number;
  /** Use exponential backoff for polling interval */
  exponentialBackoff?: boolean;
  /** Jitter factor for randomizing polling timing (0-1) */
  jitter?: number;
  /** Maximum number of consecutive errors before giving up */
  maxErrors?: number;
  /** Whether to save events in local storage for offline support */
  persistEvents?: boolean;
}

/**
 * Default polling options
 */
const DEFAULT_POLLING_OPTIONS: Required<PollingOptions> = {
  interval: 5000,
  maxInterval: 60000,
  exponentialBackoff: true,
  jitter: 0.2,
  maxErrors: 5,
  persistEvents: true
};

/**
 * Subscription handler
 */
export type SubscriptionHandler = (data: any) => void;

/**
 * Real-time fallback client that uses polling when WebSockets are unavailable
 */
export class RealtimeFallbackClient {
  private options: Required<PollingOptions>;
  private pollingInterval: number;
  private pollingTimeout: NodeJS.Timeout | null = null;
  private errorCount: number = 0;
  private isPolling: boolean = false;
  private lastEventId: string | null = null;
  private subscriptions: Map<string, Set<SubscriptionHandler>> = new Map();
  private onReconnectCallbacks: Array<() => void> = [];
  private offlineEvents: WebSocketMessage[] = [];
  private userId: string | null = null;
  
  /**
   * Create a new realtime fallback client
   * @param options Polling options
   */
  constructor(options: PollingOptions = {}) {
    this.options = { ...DEFAULT_POLLING_OPTIONS, ...options };
    this.pollingInterval = this.options.interval;
    
    // Load offline events from local storage if enabled
    if (this.options.persistEvents && typeof localStorage !== 'undefined') {
      try {
        const savedEvents = localStorage.getItem('offline_events');
        if (savedEvents) {
          this.offlineEvents = JSON.parse(savedEvents);
        }
      } catch (error) {
        console.error('Failed to load offline events from local storage', error);
      }
    }
  }
  
  /**
   * Start polling for updates
   * @param userId User ID for authenticated polls
   */
  startPolling(userId?: string): void {
    if (this.isPolling) {
      return;
    }
    
    this.userId = userId || null;
    this.isPolling = true;
    this.pollingInterval = this.options.interval;
    this.errorCount = 0;
    
    console.log('Starting fallback polling mechanism');
    this.poll();
  }
  
  /**
   * Stop polling for updates
   */
  stopPolling(): void {
    if (!this.isPolling) {
      return;
    }
    
    this.isPolling = false;
    
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
      this.pollingTimeout = null;
    }
    
    console.log('Stopped fallback polling');
  }
  
  /**
   * Subscribe to a specific event type
   * @param eventType Event type to subscribe to
   * @param handler Event handler function
   * @returns Function to remove the handler
   */
  subscribe(eventType: string, handler: SubscriptionHandler): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }
    
    this.subscriptions.get(eventType)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.subscriptions.delete(eventType);
        }
      }
    };
  }
  
  /**
   * Queue an outgoing event for when we're back online
   * @param message Message to queue
   */
  queueEvent(message: WebSocketMessage): void {
    // Add to offline events queue
    this.offlineEvents.push(message);
    
    // Save to local storage if enabled
    if (this.options.persistEvents && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('offline_events', JSON.stringify(this.offlineEvents));
      } catch (error) {
        console.error('Failed to save offline events to local storage', error);
      }
    }
  }
  
  /**
   * Register callback for reconnection
   * @param callback Function to call on reconnection
   * @returns Function to unregister callback
   */
  onReconnect(callback: () => void): () => void {
    this.onReconnectCallbacks.push(callback);
    
    // Return unregister function
    return () => {
      const index = this.onReconnectCallbacks.indexOf(callback);
      if (index !== -1) {
        this.onReconnectCallbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Poll for updates
   * @returns Promise resolving when poll completes
   */
  private async poll(): Promise<void> {
    if (!this.isPolling) {
      return;
    }
    
    try {
      // Build URL with params
      const url = '/api/realtime/poll';
      const params = new URLSearchParams();
      
      // Add last event ID for incremental updates
      if (this.lastEventId) {
        params.set('since', this.lastEventId);
      }
      
      // Add subscription types
      const subscriptionTypes = Array.from(this.subscriptions.keys());
      if (subscriptionTypes.length > 0) {
        params.set('types', subscriptionTypes.join(','));
      }
      
      // Fetch updates
      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'FallbackClient'
        },
        credentials: 'include' // Include cookies for session
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process updates
      if (data.events && Array.isArray(data.events)) {
        this.processEvents(data.events);
      }
      
      // Send any queued events if we're back online
      if (this.offlineEvents.length > 0) {
        await this.sendQueuedEvents();
      }
      
      // Update last event ID for next poll
      if (data.lastEventId) {
        this.lastEventId = data.lastEventId;
      }
      
      // Reset error count and polling interval on success
      this.errorCount = 0;
      this.pollingInterval = this.options.interval;
      
      // Schedule next poll
      this.schedulePoll();
    } catch (error) {
      console.error('Error polling for updates', error);
      
      // Increase error count
      this.errorCount++;
      
      // Stop polling if too many consecutive errors
      if (this.errorCount >= this.options.maxErrors) {
        console.warn(`Stopping fallback polling after ${this.errorCount} consecutive errors`);
        this.stopPolling();
        return;
      }
      
      // Increase polling interval with exponential backoff
      if (this.options.exponentialBackoff) {
        this.pollingInterval = Math.min(
          this.pollingInterval * 1.5,
          this.options.maxInterval
        );
      }
      
      // Schedule next poll
      this.schedulePoll();
    }
  }
  
  /**
   * Schedule next poll with jitter
   */
  private schedulePoll(): void {
    if (!this.isPolling) {
      return;
    }
    
    // Calculate jitter
    let interval = this.pollingInterval;
    if (this.options.jitter > 0) {
      const jitterRange = interval * this.options.jitter;
      interval = interval - (jitterRange / 2) + (Math.random() * jitterRange);
    }
    
    // Schedule next poll
    this.pollingTimeout = setTimeout(() => this.poll(), interval);
  }
  
  /**
   * Process received events
   * @param events Events to process
   */
  private processEvents(events: any[]): void {
    for (const event of events) {
      const { type, data } = event;
      
      // Notify subscribers for this event type
      const subscribers = this.subscriptions.get(type);
      if (subscribers) {
        subscribers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in event handler for ${type}`, error);
          }
        });
      }
    }
  }
  
  /**
   * Send queued events to server
   */
  private async sendQueuedEvents(): Promise<void> {
    if (this.offlineEvents.length === 0) {
      return;
    }
    
    try {
      // Send queued events
      const response = await fetch('/api/realtime/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: this.offlineEvents
        }),
        credentials: 'include' // Include cookies for session
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      // Clear offline events
      this.offlineEvents = [];
      
      // Clear local storage
      if (this.options.persistEvents && typeof localStorage !== 'undefined') {
        localStorage.removeItem('offline_events');
      }
      
      // Notify reconnect callbacks
      this.onReconnectCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in reconnect callback', error);
        }
      });
    } catch (error) {
      console.error('Failed to send queued events', error);
    }
  }
  
  /**
   * Check if we're currently polling
   * @returns Whether polling is active
   */
  isActive(): boolean {
    return this.isPolling;
  }
  
  /**
   * Get current polling interval
   * @returns Current polling interval in milliseconds
   */
  getCurrentInterval(): number {
    return this.pollingInterval;
  }
  
  /**
   * Get details about the fallback system
   * @returns Status information
   */
  getStatus(): {
    active: boolean;
    pollingInterval: number;
    errorCount: number;
    queuedEvents: number;
    subscriptions: string[];
  } {
    return {
      active: this.isPolling,
      pollingInterval: this.pollingInterval,
      errorCount: this.errorCount,
      queuedEvents: this.offlineEvents.length,
      subscriptions: Array.from(this.subscriptions.keys())
    };
  }
}

// Create and export singleton instance
export const realtimeFallback = typeof window !== 'undefined' ? new RealtimeFallbackClient() : null;
