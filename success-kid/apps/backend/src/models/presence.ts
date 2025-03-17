/**
 * Presence Models
 * Defines the data structures for user presence tracking.
 */

/**
 * User presence status options
 */
export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

/**
 * User presence data
 */
export interface PresenceData {
  userId: string;
  status: PresenceStatus;
  lastActive: Date;
  metadata?: Record<string, any>;
  updatedAt: Date;
}

/**
 * Update presence request
 */
export interface UpdatePresenceDto {
  status: PresenceStatus;
  metadata?: Record<string, any>;
}

/**
 * Presence subscription options
 */
export interface PresenceSubscriptionOptions {
  userIds: string[];
  includeMetadata?: boolean;
}

/**
 * Presence visibility levels
 */
export enum PresenceVisibility {
  EVERYONE = 'everyone',
  FOLLOWERS = 'followers',
  FRIENDS = 'friends',
  NOBODY = 'nobody'
}

/**
 * Presence preferences
 */
export interface PresencePreferences {
  userId: string;
  visibility: PresenceVisibility;
  showStatus: boolean;
  showLastActive: boolean;
  updatedAt: Date;
}

/**
 * Update presence preferences request
 */
export interface UpdatePresencePreferencesDto {
  visibility?: PresenceVisibility;
  showStatus?: boolean;
  showLastActive?: boolean;
}

/**
 * Presence event types for WebSocket communication
 */
export enum PresenceEventType {
  STATUS_CHANGED = 'presence.status.changed',
  SUBSCRIBED = 'presence.subscribed',
  SUBSCRIPTION_CHANGED = 'presence.subscription.changed',
  BATCH_UPDATE = 'presence.batch.update'
}

/**
 * Presence event data structure
 */
export interface PresenceEvent {
  type: PresenceEventType;
  data: {
    userId: string;
    status?: PresenceStatus;
    lastActive?: string;
    metadata?: Record<string, any>;
  };
  timestamp: string;
}

/**
 * Batch presence data for multiple users
 */
export interface BatchPresenceData {
  presences: Record<string, {
    status: PresenceStatus;
    lastActive: string;
    metadata?: Record<string, any>;
  }>;
  timestamp: string;
}
