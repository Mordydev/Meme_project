-- 
-- Notifications Module Database Schema
--

--
-- Notifications Table
--
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  data JSONB DEFAULT '{}',
  importance VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, delivered, read, failed, canceled, expired
  channels JSONB NOT NULL, -- Array of delivery channels: inapp, email, push
  delivery_status JSONB, -- Delivery results by channel
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_status_idx ON notifications(status);
CREATE INDEX notifications_type_idx ON notifications(type);
CREATE INDEX notifications_created_at_idx ON notifications(created_at);

--
-- Notification Templates Table
--
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  channels JSONB NOT NULL, -- Template for each channel
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX notification_templates_type_version_idx ON notification_templates(type, version);

--
-- User Notification Preferences Table
--
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  preferences JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--
-- Activity Events Table
--
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  actor_id VARCHAR(255) NOT NULL,
  target_id VARCHAR(255),
  object_id VARCHAR(255),
  data JSONB DEFAULT '{}',
  visibility VARCHAR(20) NOT NULL DEFAULT 'public', -- public, followers, private
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX activity_events_actor_id_idx ON activity_events(actor_id);
CREATE INDEX activity_events_target_id_idx ON activity_events(target_id);
CREATE INDEX activity_events_type_idx ON activity_events(type);
CREATE INDEX activity_events_created_at_idx ON activity_events(created_at);

--
-- Activity Feed Table
--
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES activity_events(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX activity_feed_user_id_idx ON activity_feed(user_id);
CREATE INDEX activity_feed_activity_id_idx ON activity_feed(activity_id);
CREATE INDEX activity_feed_is_read_idx ON activity_feed(is_read);
CREATE INDEX activity_feed_created_at_idx ON activity_feed(created_at);
