/**
 * Types for the Events API module (Development/Testing)
 */

export interface PublishEventBody {
  type: string;
  data: any;
}

export interface SimulateEventParams {
  eventType: string;
}

export interface SimulateEventBody {
  userId?: string;
}
