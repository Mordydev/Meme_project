-- Seed initial forum and category data for the Success Kid Community Platform

-- Insert main community forum
INSERT INTO forums (id, name, description, slug, type, status, "order", theme_color)
VALUES (
  '6d2e3ccd-5a8a-4811-a68d-32f12b4c11a8', 
  'Success Kid Community', 
  'Connect with other Success Kid community members, share ideas, and earn rewards through active participation.',
  'community',
  'public',
  'active',
  1,
  '#1E88E5'
)
ON CONFLICT (id) DO NOTHING;

-- Insert categories for the community forum based on PRD requirements
-- General category
INSERT INTO categories (id, forum_id, name, description, slug, "order", color, is_active)
VALUES (
  '61da9ca9-7c31-4cbe-a2b4-63ec0c4c5c8e',
  '6d2e3ccd-5a8a-4811-a68d-32f12b4c11a8',
  'General',
  'General discussion about the Success Kid community, platform, and events.',
  'general',
  1,
  '#4CAF50',
  TRUE
)
ON CONFLICT (forum_id, slug) DO NOTHING;

-- Token Talk category
INSERT INTO categories (id, forum_id, name, description, slug, "order", color, is_active)
VALUES (
  '29d5f49d-6303-4c2e-b5f1-53a32c2b44f9',
  '6d2e3ccd-5a8a-4811-a68d-32f12b4c11a8',
  'Token Talk',
  'Discussions about SKC tokens, trading strategies, and market trends.',
  'token-talk',
  2,
  '#FFC107',
  TRUE
)
ON CONFLICT (forum_id, slug) DO NOTHING;

-- Memes & Media category
INSERT INTO categories (id, forum_id, name, description, slug, "order", color, is_active)
VALUES (
  '86e72b10-d5e4-47cf-b5d3-d91ea236f3ea',
  '6d2e3ccd-5a8a-4811-a68d-32f12b4c11a8',
  'Memes & Media',
  'Share your favorite memes, images, and creative content with the community.',
  'memes-media',
  3,
  '#E91E63',
  TRUE
)
ON CONFLICT (forum_id, slug) DO NOTHING;

-- Success Stories category
INSERT INTO categories (id, forum_id, name, description, slug, "order", color, is_active)
VALUES (
  'b0e51175-c7b4-4a89-a94f-1c060b91a4bc',
  '6d2e3ccd-5a8a-4811-a68d-32f12b4c11a8',
  'Success Stories',
  'Share your success stories and achievements with the community.',
  'success-stories',
  4,
  '#9C27B0',
  TRUE
)
ON CONFLICT (forum_id, slug) DO NOTHING;

-- Strategy & Ideas category
INSERT INTO categories (id, forum_id, name, description, slug, "order", color, is_active)
VALUES (
  '3e1c43d7-2b2e-4f47-9f8c-c4d5a8723d0a',
  '6d2e3ccd-5a8a-4811-a68d-32f12b4c11a8',
  'Strategy & Ideas',
  'Discuss strategies, ideas, and proposals for the community and ecosystem.',
  'strategy-ideas',
  5,
  '#2196F3',
  TRUE
)
ON CONFLICT (forum_id, slug) DO NOTHING;

-- Help & Support category
INSERT INTO categories (id, forum_id, name, description, slug, "order", color, is_active)
VALUES (
  'fa9f1b73-3b3d-4c4e-be1c-9c5210a2f9a0',
  '6d2e3ccd-5a8a-4811-a68d-32f12b4c11a8',
  'Help & Support',
  'Get help with using the platform, wallet connections, and other technical questions.',
  'help-support',
  6,
  '#FF9800',
  TRUE
)
ON CONFLICT (forum_id, slug) DO NOTHING;

-- Insert an announcements forum
INSERT INTO forums (id, name, description, slug, type, status, "order", theme_color)
VALUES (
  'a1d8f6b2-c9e7-4f05-b3a5-7d9e2cb7f8a1', 
  'Announcements', 
  'Official announcements from the Success Kid team.',
  'announcements',
  'public',
  'active',
  0,
  '#F44336'
)
ON CONFLICT (id) DO NOTHING;

-- Insert categories for the announcements forum
INSERT INTO categories (id, forum_id, name, description, slug, "order", color, is_active)
VALUES (
  'b2e7d9c8-f5a4-3e2d-1c0b-9a8f7d6e5c4b',
  'a1d8f6b2-c9e7-4f05-b3a5-7d9e2cb7f8a1',
  'Official Announcements',
  'Important announcements about updates, events, and changes to the platform.',
  'official',
  1,
  '#F44336',
  TRUE
)
ON CONFLICT (forum_id, slug) DO NOTHING;

INSERT INTO categories (id, forum_id, name, description, slug, "order", color, is_active)
VALUES (
  'c3f8e0d9-g6b5-4f3e-2d1c-0b9a8f7d6e5c',
  'a1d8f6b2-c9e7-4f05-b3a5-7d9e2cb7f8a1',
  'Community News',
  'News and updates about the Success Kid community and ecosystem.',
  'community-news',
  2,
  '#9C27B0',
  TRUE
)
ON CONFLICT (forum_id, slug) DO NOTHING;
