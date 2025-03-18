# Real-time Communication Guide

This guide provides an overview of the real-time communication system in the Success Kid Community Platform, including how to use it effectively in your components and services.

## Overview

The platform uses WebSockets as the primary communication mechanism for real-time updates, with fallback to HTTP polling when WebSockets are unavailable. The system is designed to be:

- **Resilient**: Handles connection drops and automatically reconnects
- **Performant**: Uses batching and compression for efficient message transport
- **Secure**: Implements proper authentication and authorization
- **Developer-friendly**: Simple API for subscribing to events and channels

## Frontend Integration

### Basic Usage

To use real-time features in a component:

```tsx
'use client';

import { useWebSocket } from '@/components/providers/EnhancedWebSocketProvider';
import { WebSocketStatusIndicator } from '@/components/features/real-time/WebSocketStatusIndicator';

function MyComponent() {
  const { 
    connected,
    subscribe, 
    subscribeToChannel,
    send 
  } = useWebSocket();
  
  // Subscribe to a specific event type
  useEffect(() => {
    const unsubscribe = subscribe('notification.new', (data) => {
      console.log('New notification received:', data);
      // Handle notification
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [subscribe]);
  
  // Subscribe to a channel
  useEffect(() => {
    subscribeToChannel('content:new');
  }, [subscribeToChannel]);
  
  // Send a message
  const handleAction = () => {
    send({
      type: 'user.action',
      payload: { action: 'something' }
    });
  };
  
  return (
    <div>
      <WebSocketStatusIndicator />
      {connected ? (
        <button onClick={handleAction}>Perform Action</button>
      ) : (
        <div>Connecting...</div>
      )}
    </div>
  );
}
```

### Channel Subscriptions

Channels allow targeted message delivery. Common channels include:

- `user:${userId}` - User-specific messages
- `user:${userId}:notifications` - User notifications
- `public:announcements` - Public announcements
- `content:new` - New content updates
- `market:updates` - Market data updates
- `feed:global` - Global activity feed

To subscribe to a channel:

```tsx
const { subscribeToChannel } = useWebSocket();

useEffect(() => {
  // Subscribe to user-specific channel
  subscribeToChannel(`user:${userId}`);
  
  // Subscribe to notifications channel
  subscribeToChannel(`user:${userId}:notifications`);
}, [subscribeToChannel, userId]);
```

### Optimistic UI Updates

For the best user experience, implement optimistic UI updates:

```tsx
function createPost(content) {
  // Generate temporary ID
  const tempId = `temp-${Date.now()}`;
  
  // Optimistically add to UI
  addPostToFeed({
    id: tempId,
    content,
    status: 'pending',
    timestamp: new Date()
  });
  
  // Send to server
  send({
    type: 'content.create',
    payload: { content }
  });
  
  // Listen for confirmation
  const unsubscribe = subscribe('content.created', (data) => {
    if (data.tempId === tempId) {
      // Update with real data
      updatePost(tempId, {
        ...data,
        status: 'confirmed'
      });
      unsubscribe();
    }
  });
  
  // Set timeout for error handling
  setTimeout(() => {
    const post = getPost(tempId);
    if (post && post.status === 'pending') {
      updatePost(tempId, { status: 'failed' });
    }
    unsubscribe();
  }, 10000);
}
```

## Backend Integration

### Sending Messages to Clients

From a service, you can send messages to clients using the WebSocket service:

```typescript
import { WebSocketService } from '../../websockets/websocket-service';

// In your service method
async function notifyUser(userId: string, data: any) {
  // Send to a specific user
  websocketService.sendToUser(userId, {
    type: 'notification.new',
    data
  });
  
  // Or send to a channel
  websocketService.sendToChannel('content:new', {
    type: 'content.new',
    data
  });
  
  // Or broadcast to all users
  websocketService.sendToAll({
    type: 'announcement',
    data
  });
}
```

### Creating Activity Events

Activity events are automatically distributed to relevant users:

```typescript
import { ActivityFeedService } from '../../services/activity/activity-feed-service';

// In your service method
async function createActivity(userId: string, action: string) {
  await activityFeedService.createActivity({
    actorId: userId,
    verb: action,
    objectId: itemId,
    objectType: 'content',
    data: {
      // Additional data...
    },
    visibility: 'public'
  });
  
  // The activity feed service will handle delivery
}
```

### Sending Notifications

To send notifications across multiple channels:

```typescript
import { NotificationDeliveryService } from '../../services/notifications/notification-delivery-service';

// In your service method
async function notifyUser(userId: string, type: string) {
  await notificationDeliveryService.notify(userId, type, {
    // Delivery through multiple channels
    channels: ['websocket', 'in-app', 'push', 'email'],
    
    // Template variables
    variables: {
      name: 'John',
      value: 500
    },
    
    // Additional data
    data: {
      // Custom data...
    },
    
    // High priority
    priority: 'high'
  });
}
```

## Best Practices

### Performance

1. **Batch Operations**: Group related operations to reduce message count.
2. **Minimize Payload Size**: Send only the data needed for immediate updates.
3. **Use Optimistic UI**: Update UI immediately, then verify with server.
4. **Subscribe Selectively**: Only subscribe to channels you need.

### Security

1. **Validate Input**: Always validate data from client messages.
2. **Check Permissions**: Verify user has permission for requested actions.
3. **Rate Limit**: Apply appropriate rate limits to prevent abuse.
4. **Don't Trust Client Time**: Use server timestamps for time-sensitive operations.

### Reliability

1. **Handle Disconnections**: Design for intermittent connectivity.
2. **Implement Fallbacks**: Use the polling fallback for critical features.
3. **Queue Critical Operations**: Store important actions for retry.
4. **Provide Feedback**: Keep users informed about connection status.

## Common Event Types

| Event Type | Description | Data |
|------------|-------------|------|
| `notification.new` | New notification | `{ id, type, title, body, ... }` |
| `points.awarded` | Points awarded to user | `{ amount, source, ... }` |
| `achievement.unlocked` | User unlocked achievement | `{ achievement, ... }` |
| `content.created` | New content created | `{ id, type, preview, ... }` |
| `feed.update` | Activity feed update | `{ activity, source, ... }` |
| `market.update` | Market data update | `{ price, change, ... }` |

## Troubleshooting

### Connection Issues

1. Check network connectivity and WebSocket support
2. Verify authentication token is valid
3. Check for exceeded connection limits
4. Look for rate limiting issues

### Message Delivery Problems

1. Verify channel subscriptions
2. Check permissions for the channel
3. Ensure message format is correct
4. Verify the recipient is connected

### Performance Issues

1. Check message volume and frequency
2. Reduce payload sizes
3. Implement more aggressive batching
4. Use compression for large messages

## Monitoring

The real-time system provides metrics and monitoring endpoints:

- GET `/api/realtime/status` - System status and statistics
- WebSocket performance metrics in APM tools
- Connection counts and message throughput

## Additional Resources

- Socket.IO documentation (underlying WebSocket implementation)
- Redis Streams documentation (for event distribution)
- WebSocket security best practices
