-- Migration: Create Connection States Table
-- This table stores WebSocket connection state for reconnection and state recovery

-- Create connection_states table
CREATE TABLE IF NOT EXISTS connection_states (
  connection_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  subscriptions JSONB DEFAULT '[]'::jsonb,
  last_event_id VARCHAR(255),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_connection_states_user_id ON connection_states(user_id);

-- Create index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_connection_states_last_seen ON connection_states(last_seen);

-- Add comments for documentation
COMMENT ON TABLE connection_states IS 'Stores WebSocket connection state for reconnection and recovery';
COMMENT ON COLUMN connection_states.connection_id IS 'Unique identifier for the connection';
COMMENT ON COLUMN connection_states.user_id IS 'User ID associated with this connection';
COMMENT ON COLUMN connection_states.subscriptions IS 'JSON array of channel subscriptions';
COMMENT ON COLUMN connection_states.last_event_id IS 'ID of the last event received for event replay';
COMMENT ON COLUMN connection_states.last_seen IS 'Timestamp of last activity for cleanup';
COMMENT ON COLUMN connection_states.metadata IS 'Additional connection metadata as JSON';
COMMENT ON COLUMN connection_states.created_at IS 'Timestamp when the connection was created';
COMMENT ON COLUMN connection_states.updated_at IS 'Timestamp when the connection was last updated';
