/**
 * Types for the Presence API module
 */
import { PresenceStatus } from '../../presence'; // Assuming PresenceStatus is exported from the service index

export interface UpdatePresenceBody {
  status: PresenceStatus;
  customStatus?: string;
}

export interface GetPresenceQuery {
  userIds: string[];
}

export interface SubscribePresenceBody {
  userIds: string[];
}

// Re-export PresenceStatus if needed by handlers/routes directly
export type { PresenceStatus };
