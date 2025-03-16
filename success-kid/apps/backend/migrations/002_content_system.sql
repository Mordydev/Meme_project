-- Content System Migration
-- Adds tables for content categories, tags, and moderation

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on parent_id for fast hierarchical queries
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);
CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories(slug);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on tag count for popular tags
CREATE INDEX IF NOT EXISTS tags_count_idx ON tags(count DESC);
CREATE INDEX IF NOT EXISTS tags_slug_idx ON tags(slug);

-- Create content_tags junction table
CREATE TABLE IF NOT EXISTS content_tags (
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (content_id, tag_id)
);

-- Add category_id to content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS content_category_id_idx ON content(category_id);

-- Create content_reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type VARCHAR(20) NOT NULL, -- 'content', 'comment', or 'user'
  reason VARCHAR(50) NOT NULL,
  description VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes VARCHAR(1000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for content reports
CREATE INDEX IF NOT EXISTS content_reports_target_idx ON content_reports(target_id, target_type);
CREATE INDEX IF NOT EXISTS content_reports_status_idx ON content_reports(status);
CREATE INDEX IF NOT EXISTS content_reports_reporter_idx ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS content_reports_reviewer_idx ON content_reports(reviewer_id);

-- Seed some initial categories
INSERT INTO categories (name, description, slug, "order", is_active)
VALUES 
  ('General', 'General discussions and topics', 'general', 1, TRUE),
  ('Announcements', 'Platform announcements and news', 'announcements', 2, TRUE),
  ('Guides', 'Tutorials and how-to guides', 'guides', 3, TRUE),
  ('Community Spotlight', 'Highlighting community achievements', 'community-spotlight', 4, TRUE),
  ('Success Stories', 'Share your success stories', 'success-stories', 5, TRUE);

-- Seed some initial tags
INSERT INTO tags (name, slug, count)
VALUES 
  ('Welcome', 'welcome', 0),
  ('Tutorial', 'tutorial', 0),
  ('Question', 'question', 0),
  ('Discussion', 'discussion', 0),
  ('Feedback', 'feedback', 0),
  ('News', 'news', 0),
  ('Announcement', 'announcement', 0),
  ('Tips', 'tips', 0),
  ('Help', 'help', 0),
  ('Feature', 'feature', 0);
