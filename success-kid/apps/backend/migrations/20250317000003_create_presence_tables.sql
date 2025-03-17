-- Migration: Create Presence Tables
-- Implements user presence tracking for real-time features

-- Create presence status enum
CREATE TYPE presence_status AS ENUM (
  'online', 
  'away', 
  'offline', 
  'busy', 
  'invisible'
);

-- Create user presence table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id VARCHAR(255) PRIMARY KEY,
  status presence_status NOT NULL DEFAULT 'offline',
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL,
  last_location VARCHAR(255),
  status_message VARCHAR(255),
  metadata JSONB,
  room_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create room presence table for fast querying of room members
CREATE TABLE IF NOT EXISTS room_presence (
  room_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Create indexes
CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_user_presence_last_activity ON user_presence(last_activity);
CREATE INDEX idx_user_presence_room_id ON user_presence(room_id);
CREATE INDEX idx_room_presence_user_id ON room_presence(user_id);
CREATE INDEX idx_room_presence_joined_at ON room_presence(joined_at);

-- Add comments
COMMENT ON TABLE user_presence IS 'Tracks user online presence and status';
COMMENT ON TABLE room_presence IS 'Tracks which users are present in which rooms';
COMMENT ON COLUMN user_presence.status IS 'Current user presence status';
COMMENT ON COLUMN user_presence.last_activity IS 'Timestamp of last user activity';
COMMENT ON COLUMN user_presence.last_location IS 'Last location of the user in the application';
COMMENT ON COLUMN user_presence.status_message IS 'Custom status message set by the user';
COMMENT ON COLUMN user_presence.metadata IS 'Additional presence metadata as JSON';
COMMENT ON COLUMN user_presence.room_id IS 'ID of room user is currently in, if any';
