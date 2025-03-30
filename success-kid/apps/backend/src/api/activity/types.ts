/**
 * Types for the Activity API module
 */
import { ActivityType } from '../../activity'; // Assuming ActivityType is exported from the service index

export interface GetFeedQuery {
  limit?: number;
  before?: string;
  after?: string;
  types?: ActivityType[];
  actors?: string[];
  aggregated?: boolean;
}

export interface MarkReadBody {
  feedItemIds: string[];
}
