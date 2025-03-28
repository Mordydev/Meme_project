-- Add schema for community features: categories, tags, and moderation

-- Categories - For organizing content
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  slug VARCHAR(50) NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(255),
  color VARCHAR(7),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for category queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories("order");

-- Tags - For content classification
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(30) NOT NULL UNIQUE,
  slug VARCHAR(30) NOT NULL UNIQUE,
  description VARCHAR(200),
  color VARCHAR(7),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for tag queries
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

-- Content Tags - For associating tags with content
CREATE TABLE IF NOT EXISTS content_tags (
  content_id VARCHAR(255) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (content_id, tag_id)
);

-- Create indexes for content-tag relationships
CREATE INDEX IF NOT EXISTS idx_content_tags_content_id ON content_tags(content_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_tag_id ON content_tags(tag_id);

-- Add category_id column to content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_content_category_id ON content(category_id);

-- Add tags array column to content table for efficient querying
ALTER TABLE content ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_content_tags_array ON content USING GIN(tags);

-- Add additional metadata fields to content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS poll_options JSONB DEFAULT NULL;
ALTER TABLE content ADD COLUMN IF NOT EXISTS link_url TEXT DEFAULT NULL;
ALTER TABLE content ADD COLUMN IF NOT EXISTS link_title TEXT DEFAULT NULL;
ALTER TABLE content ADD COLUMN IF NOT EXISTS link_description TEXT DEFAULT NULL;
ALTER TABLE content ADD COLUMN IF NOT EXISTS link_image TEXT DEFAULT NULL;
ALTER TABLE content ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- Content Reports - For content moderation
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  moderator_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  resolution_action VARCHAR(50),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for report queries
CREATE INDEX IF NOT EXISTS idx_content_reports_entity_id ON content_reports(entity_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at);

-- Add full-text search capabilities
ALTER TABLE content ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_content_search_vector ON content USING GIN(search_vector);

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION content_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.content_text, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.link_title, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.link_description, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for search_vector updates
CREATE TRIGGER content_search_vector_update 
BEFORE INSERT OR UPDATE ON content
FOR EACH ROW EXECUTE FUNCTION content_search_vector_update();

-- Update existing content with search vectors
UPDATE content 
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(content_text, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(link_title, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(link_description, '')), 'C')
WHERE search_vector IS NULL;
