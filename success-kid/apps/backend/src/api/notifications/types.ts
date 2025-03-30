/**
 * Types for the Notifications API module
 */
import { NotificationFilter } from '../../notifications'; // Assuming NotificationFilter is exported from the service index

export interface GetNotificationsQuery {
  limit?: number;
  offset?: number;
  status?: string; // Consider using an enum if available
  category?: string; // Consider using an enum if available
  channel?: string; // Consider using an enum if available
  startDate?: string;
  endDate?: string;
  includeRead?: boolean;
}

export interface NotificationIdParam {
  id: string;
}

// Define more specific types based on likely service expectations
interface ChannelPreferences {
  inapp: boolean; // Make required
  email: boolean; // Make required
  push: boolean; // Make required
}

interface CategoryPreferences {
  enabled: boolean; // Make enabled required
  channels?: ChannelPreferences;
}

interface TypePreferences {
  enabled: boolean; // Make enabled required
  channels?: ChannelPreferences;
}

export interface PreferencesBody {
  channels?: ChannelPreferences; // Use specific type
  categories?: Record<string, CategoryPreferences>; // Use specific type for values
  types?: Record<string, TypePreferences>; // Use specific type for values
  quietHours?: {
    enabled: boolean; // Make required
    start: string; // Make required, consider time format validation
    end: string; // Make required, consider time format validation
    timezone: string; // Make required, consider timezone validation
  };
}

// Re-export NotificationFilter if needed by handlers/routes directly
export type { NotificationFilter };
