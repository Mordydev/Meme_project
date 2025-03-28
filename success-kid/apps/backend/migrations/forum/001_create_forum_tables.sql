-- Create forum tables for community platform

-- Forums table (top-level containers for categories)
CREATE TABLE IF NOT EXISTS forums (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  slug VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL DEFAULT 'public',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  "order" INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(255),
  banner_image VARCHAR(255),
  theme_color VARCHAR(7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create index on forum slug
CREATE INDEX IF NOT EXISTS idx_forums_slug ON forums(slug);

-- Categories table (sections within forums)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY,
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  slug VARCHAR(50) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(255),
  color VARCHAR(7),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(forum_id, slug)
);

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_forum_id ON categories(forum_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Threads table (discussions within categories)
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'discussion',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_post_id UUID,
  last_post_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create indexes for threads
CREATE INDEX IF NOT EXISTS idx_threads_category_id ON threads(category_id);
CREATE INDEX IF NOT EXISTS idx_threads_forum_id ON threads(forum_id);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_content_id ON threads(content_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_activity_at ON threads(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);

-- Thread replies table (posts in a thread)
CREATE TABLE IF NOT EXISTS thread_replies (
  id UUID PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for thread replies
CREATE INDEX IF NOT EXISTS idx_thread_replies_thread_id ON thread_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_replies_content_id ON thread_replies(content_id);

-- Thread subscriptions table (users following threads)
CREATE TABLE IF NOT EXISTS thread_subscriptions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  notification_level VARCHAR(20) NOT NULL DEFAULT 'all',  -- all, mentions, none
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ,
  PRIMARY KEY(user_id, thread_id)
);

-- Create index for thread subscriptions
CREATE INDEX IF NOT EXISTS idx_thread_subscriptions_user_id ON thread_subscriptions(user_id);

-- Thread moderation log
CREATE TABLE IF NOT EXISTS thread_moderation_log (
  id UUID PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_state JSONB,
  new_state JSONB
);

-- Create index for thread moderation log
CREATE INDEX IF NOT EXISTS idx_thread_moderation_log_thread_id ON thread_moderation_log(thread_id);
