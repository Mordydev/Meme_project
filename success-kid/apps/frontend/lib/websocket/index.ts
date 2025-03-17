/**
 * WebSocket module exports
 * 
 * Re-exports WebSocket functionality for easy imports
 */

// Re-export WebSocket client
export {
  WebSocketClient,
  getWebSocketClient,
  closeWebSocketClient,
  ConnectionState,
  type WebSocketMessage,
  type WebSocketOptions,
} from './ws-client';

// Re-export React hooks
export {
  useWebSocket,
  useWebSocketMessage,
  useWebSocketChannel,
  useWebSocketConnectionState,
  WebSocketProvider,
  type UseWebSocketReturn,
  type UseWebSocketOptions,
} from './use-websocket';
