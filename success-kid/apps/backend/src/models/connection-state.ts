/**
 * Connection State Models
 * Defines the data structures for WebSocket connection state management.
 */

/**
 * Connection state for recovery
 */
export interface ConnectionState {
  connectionId: string;
  userId: string;
  subscriptions: string[];
  lastEventId?: string;
  lastSeen: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Connection state creation DTO
 */
export interface CreateConnectionStateDto {
  connectionId: string;
  userId: string;
  subscriptions?: string[];
  lastEventId?: string;
  metadata?: Record<string, any>;
}

/**
 * Connection state update DTO
 */
export interface UpdateConnectionStateDto {
  subscriptions?: string[];
  lastEventId?: string;
  metadata?: Record<string, any>;
}

/**
 * Result of a reconnection attempt
 */
export interface ReconnectionResult {
  success: boolean;
  reason?: string;
  restoredSubscriptions?: number;
  missedEvents?: number;
}

/**
 * WebSocket message interface
 */
export interface WebSocketMessage {
  type: string;
  payload?: any;
  id?: string;
  timestamp?: number;
}

/**
 * Connection info
 */
export interface ConnectionInfo {
  connectionId: string;
  userId: string;
  authenticated: boolean;
  connectedAt: Date;
  subscriptions: string[];
}

/**
 * WebSocket connection statistics
 */
export interface ConnectionStats {
  totalConnections: number;
  authenticatedConnections: number;
  unauthenticatedConnections: number;
  connectionsByUser: Record<string, number>;
  topUsers: Array<{userId: string, connections: number}>;
}
