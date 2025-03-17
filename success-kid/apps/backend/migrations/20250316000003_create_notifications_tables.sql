-- Notifications system migration

-- Create notification types enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'points_earned',
            'points_redeemed',
            'achievement_unlocked',
            'level_up',
            'wallet_connected',
            'content_reaction',
            'content_comment',
            'content_mention',
            'referral_successful',
            'milestone_reached',
            'system_announcement'
        );
    END IF;
END$$;

-- Create notification priority enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority') THEN
        CREATE TYPE notification_priority AS ENUM (
            'low',
            'normal',
            'high',
            'urgent'
        );
    END IF;
END$$;

-- Create notification channel enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE notification_channel AS ENUM (
            'inapp',
            'email',
            'push'
        );
    END IF;
END$$;

-- Notifications table - In-app notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT NULL,
  priority notification_priority NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Notification templates - Templates for different notification types
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type notification_type NOT NULL,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  email_subject_template TEXT,
  email_body_template TEXT,
  push_title_template TEXT,
  push_body_template TEXT,
  data_schema JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

-- Create unique constraint on type and version
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_templates_type_version ON notification_templates(type, version);

-- Notification preferences - User preferences for receiving notifications
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  channels JSONB NOT NULL DEFAULT '{"inapp": true, "email": true, "push": false}'::JSONB,
  categories JSONB NOT NULL DEFAULT '{
    "points": {"enabled": true, "channels": {"inapp": true, "email": true, "push": false}},
    "achievements": {"enabled": true, "channels": {"inapp": true, "email": true, "push": true}},
    "content": {"enabled": true, "channels": {"inapp": true, "email": true, "push": false}},
    "system": {"enabled": true, "channels": {"inapp": true, "email": true, "push": false}}
  }'::JSONB,
  quiet_hours JSONB NOT NULL DEFAULT '{"enabled": false, "start": "22:00", "end": "08:00", "timezone": "UTC"}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification delivery - Tracks notification delivery attempts across channels
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  error_details TEXT,
  external_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for delivery queries
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_channel ON notification_deliveries(channel);

-- Activity feed - For tracking activities that appear in user feeds
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_type VARCHAR(50) NOT NULL,
  object_id VARCHAR(255) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  data JSONB DEFAULT NULL,
  visibility VARCHAR(50) NOT NULL DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activity feed queries
CREATE INDEX IF NOT EXISTS idx_activity_events_actor_id ON activity_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_object_id ON activity_events(object_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_target_id ON activity_events(target_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_visibility ON activity_events(visibility);

-- User activity feeds - Maps activities to user feeds
CREATE TABLE IF NOT EXISTS user_feed_items (
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activity_events(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, activity_id)
);

-- Create indexes for feed queries
CREATE INDEX IF NOT EXISTS idx_user_feed_items_user_id ON user_feed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feed_items_added_at ON user_feed_items(added_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feed_items_read ON user_feed_items(read);

-- Presence tracking - For user online status
CREATE TABLE IF NOT EXISTS user_presence (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'offline',
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connection state - For WebSocket connection recovery
CREATE TABLE IF NOT EXISTS connection_states (
  connection_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscriptions JSONB NOT NULL DEFAULT '[]'::JSONB,
  last_event_id VARCHAR(255),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id and last_seen for cleanup
CREATE INDEX IF NOT EXISTS idx_connection_states_user_id ON connection_states(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_states_last_seen ON connection_states(last_seen);

-- Default notification templates
INSERT INTO notification_templates 
  (type, title_template, body_template, email_subject_template, email_body_template, push_title_template, push_body_template)
VALUES
  ('points_earned', 
   'You earned {{amount}} Success Points!', 
   'You received {{amount}} Success Points for {{source}}.', 
   'You earned {{amount}} Success Points on Success Kid!',
   'Hi {{name}},\n\nYou just earned {{amount}} Success Points for {{source}} on the Success Kid platform.\n\nKeep up the good work!',
   'Success Points: +{{amount}}',
   'Earned for {{source}}'),
   
  ('achievement_unlocked', 
   'Achievement Unlocked: {{name}}!', 
   'Congratulations! You''ve unlocked the "{{name}}" achievement and earned {{points}} Success Points!', 
   'You''ve unlocked a new achievement on Success Kid!',
   'Hi {{name}},\n\nCongratulations! You''ve unlocked the "{{achievementName}}" achievement on Success Kid platform.\n\n{{description}}\n\nYou''ve earned {{points}} Success Points for this achievement.',
   'Achievement Unlocked!',
   '{{name}} - {{points}} points'),
   
  ('level_up', 
   'Level Up!', 
   'Congratulations! You are now Level {{level}}! Keep up the great work!', 
   'You''ve reached Level {{level}} on Success Kid!',
   'Hi {{name}},\n\nAmazing progress! You''ve reached Level {{level}} on the Success Kid platform.\n\nKeep climbing and unlock more rewards!',
   'Level Up!',
   'You''re now Level {{level}}'),
   
  ('milestone_reached', 
   'Milestone Reached: ${{value}}!', 
   'The Success Kid community has reached a major milestone: ${{value}} market cap! Thanks for being part of this journey!', 
   'We''ve reached ${{value}} market cap!',
   'Hi {{name}},\n\nExciting news! The Success Kid community has reached a major milestone: ${{value}} market cap!\n\nThank you for being part of this amazing journey.',
   'Milestone: ${{value}}',
   'We did it together!');
