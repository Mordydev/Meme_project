/**
 * Presence Model
 * 
 * Defines the data structures for user presence
 */

/**
 * User presence status
 */
export enum PresenceStatus {
  /**
   * User is online and active
   */
  ONLINE = 'online',
  
  /**
   * User is online but inactive
   */
  AWAY = 'away',
  
  /**
   * User is offline
   */
  OFFLINE = 'offline',
  
  /**
   * User is busy/do not disturb
   */
  BUSY = 'busy',
  
  /**
   * User is invisible (appears offline to others)
   */
  INVISIBLE = 'invisible'
}

/**
 * User presence data
 */
export interface Presence {
  /**
   * User ID
   */
  userId: string;
  
  /**
   * Presence status
   */
  status: PresenceStatus;
  
  /**
   * Last activity timestamp
   */
  lastActivity: Date;
  
  /**
   * Last seen location in the app
   */
  lastLocation?: string;
  
  /**
   * Custom status message
   */
  statusMessage?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
  
  /**
   * Room ID if in a room
   */
  roomId?: string;
  
  /**
   * Created at timestamp
   */
  createdAt: Date;
  
  /**
   * Updated at timestamp
   */
  updatedAt: Date;
}

/**
 * Presence update DTO
 */
export interface PresenceUpdateDto {
  /**
   * Presence status
   */
  status: PresenceStatus;
  
  /**
   * Last seen location in the app
   */
  lastLocation?: string;
  
  /**
   * Custom status message
   */
  statusMessage?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
  
  /**
   * Room ID if in a room
   */
  roomId?: string;
}

/**
 * Presence availability levels
 */
export enum AvailabilityLevel {
  /**
   * Fully available
   */
  AVAILABLE = 'available',
  
  /**
   * Partially available
   */
  PARTIALLY_AVAILABLE = 'partially_available',
  
  /**
   * Not available
   */
  UNAVAILABLE = 'unavailable'
}

/**
 * Get availability level from presence status
 * @param status Presence status
 * @returns Availability level
 */
export function getAvailabilityLevel(status: PresenceStatus): AvailabilityLevel {
  switch (status) {
    case PresenceStatus.ONLINE:
      return AvailabilityLevel.AVAILABLE;
      
    case PresenceStatus.AWAY:
      return AvailabilityLevel.PARTIALLY_AVAILABLE;
      
    case PresenceStatus.BUSY:
      return AvailabilityLevel.PARTIALLY_AVAILABLE;
      
    case PresenceStatus.OFFLINE:
    case PresenceStatus.INVISIBLE:
      return AvailabilityLevel.UNAVAILABLE;
      
    default:
      return AvailabilityLevel.UNAVAILABLE;
  }
}
