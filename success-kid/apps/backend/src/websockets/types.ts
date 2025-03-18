/**
 * WebSocket message types
 */
export interface SocketMessage {
  type: string;
  data: any;
}

/**
 * Socket subscription message format
 */
export interface SubscriptionMessage {
  subscribe: boolean;
  channels: string[];
}

/**
 * Socket authentication message format
 */
export interface AuthenticationMessage {
  authenticate: boolean;
  token: string;
}

/**
 * Ping/pong message format
 */
export interface PingMessage {
  type: 'ping' | 'pong';
  timestamp: number;
}
