-- Seed data for development environment

-- Create test users
INSERT INTO users (id, email, display_name, auth_provider, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@successkid.com', 'Admin User', 'email', NOW() - INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000002', 'charlie@example.com', 'Crypto Charlie', 'email', NOW() - INTERVAL '25 days'),
('00000000-0000-0000-0000-000000000003', 'mia@example.com', 'Content Mia', 'email', NOW() - INTERVAL '20 days'),
('00000000-0000-0000-0000-000000000004', 'chris@example.com', 'Casual Chris', 'email', NOW() - INTERVAL '15 days'),
('00000000-0000-0000-0000-000000000005', 'dev@example.com', 'Developer', 'email', NOW() - INTERVAL '10 days');

-- Create profiles
INSERT INTO profiles (user_id, bio, avatar_url, level, title) VALUES
('00000000-0000-0000-0000-000000000001', 'Platform administrator', 'https://i.pravatar.cc/150?img=1', 10, 'Admin'),
('00000000-0000-0000-0000-000000000002', 'Crypto enthusiast and early adopter', 'https://i.pravatar.cc/150?img=2', 5, 'Crypto Expert'),
('00000000-0000-0000-0000-000000000003', 'Content creator and social media manager', 'https://i.pravatar.cc/150?img=3', 4, 'Content Champion'),
('00000000-0000-0000-0000-000000000004', 'New to crypto, excited to learn', 'https://i.pravatar.cc/150?img=4', 2, 'Newcomer'),
('00000000-0000-0000-0000-000000000005', 'Backend developer working on the platform', 'https://i.pravatar.cc/150?img=5', 8, 'Developer');

-- Create wallet connections for some users
INSERT INTO wallet_connections (user_id, wallet_address, is_verified, connected_at, last_verified_at) VALUES
('00000000-0000-0000-0000-000000000001', 'ANcpgDz1zt5DUTSxbHKdfasgnJPVQWCK24wdtP8Ub3cp', TRUE, NOW() - INTERVAL '29 days', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000002', 'J4mS9MXtLMutGyCzaC5jWHhQm5W9ydTzZh5K9EExGP7R', TRUE, NOW() - INTERVAL '24 days', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000003', 'DB5Q4vFepWfZkPyVL78vrvKFdRuZHshdJhfTLtH7LP9S', TRUE, NOW() - INTERVAL '18 days', NOW() - INTERVAL '3 days');

-- Create content
INSERT INTO content (id, user_id, type, content_text, created_at) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'text', 'Welcome to the Success Kid Community Platform! We''re excited to build this community together.', NOW() - INTERVAL '29 days'),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', 'text', 'Just connected my wallet and loving the integration. The transaction feed is super useful!', NOW() - INTERVAL '23 days'),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', 'text', 'Created my first meme for the platform! Looking forward to earning some points.', NOW() - INTERVAL '19 days'),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000004', 'text', 'New to crypto but this platform makes it really easy to understand. Thanks for the beginner-friendly approach!', NOW() - INTERVAL '14 days'),
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000002', 'text', 'The market cap is growing steadily. Looking forward to hitting our first milestone!', NOW() - INTERVAL '10 days'),
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000003', 'text', 'Just earned my first achievement badge! The gamification on this platform is addictive.', NOW() - INTERVAL '7 days'),
('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'text', 'Exciting news coming soon about our roadmap. Stay tuned!', NOW() - INTERVAL '3 days');

-- Create comments
INSERT INTO comments (content_id, user_id, comment_text, created_at) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'Great to be here from the beginning!', NOW() - INTERVAL '28 days'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003', 'Looking forward to creating content for this community.', NOW() - INTERVAL '28 days'),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Glad you like it! We worked hard on making the wallet integration seamless.', NOW() - INTERVAL '23 days'),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000004', 'Can''t wait to see your memes!', NOW() - INTERVAL '19 days'),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'That''s exactly what we were aiming for! Let us know if you have any questions.', NOW() - INTERVAL '14 days'),
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000002', 'Which badge did you get? I''m still working on the "Content Champion" one.', NOW() - INTERVAL '6 days'),
('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000004', 'Can''t wait to hear the news!', NOW() - INTERVAL '2 days');

-- Create achievements
INSERT INTO achievements (id, name, description, points_reward, difficulty) VALUES
('00000000-0000-0000-0000-000000000020', 'First Post', 'Create your first post in the community', 50, 'common'),
('00000000-0000-0000-0000-000000000021', 'Conversation Starter', 'Receive 5 comments on one of your posts', 100, 'common'),
('00000000-0000-0000-0000-000000000022', 'Daily Devotion', 'Log in for 7 consecutive days', 150, 'common'),
('00000000-0000-0000-0000-000000000023', 'Helpful Hand', 'Have 10 of your comments upvoted', 200, 'uncommon'),
('00000000-0000-0000-0000-000000000024', 'Content Creator', 'Create 25 posts', 250, 'uncommon'),
('00000000-0000-0000-0000-000000000025', 'Wallet Connector', 'Connect your wallet to the platform', 100, 'common'),
('00000000-0000-0000-0000-000000000026', 'Rising Star', 'Reach the daily leaderboard top 10', 400, 'rare'),
('00000000-0000-0000-0000-000000000027', 'Milestone Witness', 'Be active during a market cap milestone achievement', 500, 'rare'),
('00000000-0000-0000-0000-000000000028', 'Community Voice', 'Receive 100 total upvotes on your content', 750, 'epic'),
('00000000-0000-0000-0000-000000000029', 'Community Builder', 'Successfully refer 5 new users who remain active', 1000, 'epic');

-- Assign some achievements to users
INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', NOW() - INTERVAL '29 days'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000025', NOW() - INTERVAL '29 days'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000020', NOW() - INTERVAL '23 days'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000025', NOW() - INTERVAL '24 days'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000020', NOW() - INTERVAL '19 days'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000025', NOW() - INTERVAL '18 days'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000020', NOW() - INTERVAL '14 days');

-- Add some point transactions
INSERT INTO user_points (user_id, amount, source, description, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 100, 'signup', 'Welcome bonus', NOW() - INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000002', 100, 'signup', 'Welcome bonus', NOW() - INTERVAL '25 days'),
('00000000-0000-0000-0000-000000000003', 100, 'signup', 'Welcome bonus', NOW() - INTERVAL '20 days'),
('00000000-0000-0000-0000-000000000004', 100, 'signup', 'Welcome bonus', NOW() - INTERVAL '15 days'),
('00000000-0000-0000-0000-000000000005', 100, 'signup', 'Welcome bonus', NOW() - INTERVAL '10 days'),
('00000000-0000-0000-0000-000000000001', 50, 'content_creation', 'Created a post', NOW() - INTERVAL '29 days'),
('00000000-0000-0000-0000-000000000002', 50, 'content_creation', 'Created a post', NOW() - INTERVAL '23 days'),
('00000000-0000-0000-0000-000000000003', 50, 'content_creation', 'Created a post', NOW() - INTERVAL '19 days'),
('00000000-0000-0000-0000-000000000004', 50, 'content_creation', 'Created a post', NOW() - INTERVAL '14 days'),
('00000000-0000-0000-0000-000000000002', 50, 'content_creation', 'Created a post', NOW() - INTERVAL '10 days'),
('00000000-0000-0000-0000-000000000003', 50, 'content_creation', 'Created a post', NOW() - INTERVAL '7 days'),
('00000000-0000-0000-0000-000000000001', 50, 'content_creation', 'Created a post', NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000002', 15, 'comment', 'Posted a comment', NOW() - INTERVAL '28 days'),
('00000000-0000-0000-0000-000000000003', 15, 'comment', 'Posted a comment', NOW() - INTERVAL '28 days'),
('00000000-0000-0000-0000-000000000001', 15, 'comment', 'Posted a comment', NOW() - INTERVAL '23 days'),
('00000000-0000-0000-0000-000000000004', 15, 'comment', 'Posted a comment', NOW() - INTERVAL '19 days'),
('00000000-0000-0000-0000-000000000001', 15, 'comment', 'Posted a comment', NOW() - INTERVAL '14 days'),
('00000000-0000-0000-0000-000000000002', 15, 'comment', 'Posted a comment', NOW() - INTERVAL '6 days'),
('00000000-0000-0000-0000-000000000004', 15, 'comment', 'Posted a comment', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000001', 100, 'achievement', 'Unlocked "First Post" achievement', NOW() - INTERVAL '29 days'),
('00000000-0000-0000-0000-000000000001', 100, 'achievement', 'Unlocked "Wallet Connector" achievement', NOW() - INTERVAL '29 days'),
('00000000-0000-0000-0000-000000000002', 100, 'achievement', 'Unlocked "First Post" achievement', NOW() - INTERVAL '23 days'),
('00000000-0000-0000-0000-000000000002', 100, 'achievement', 'Unlocked "Wallet Connector" achievement', NOW() - INTERVAL '24 days'),
('00000000-0000-0000-0000-000000000003', 100, 'achievement', 'Unlocked "First Post" achievement', NOW() - INTERVAL '19 days'),
('00000000-0000-0000-0000-000000000003', 100, 'achievement', 'Unlocked "Wallet Connector" achievement', NOW() - INTERVAL '18 days'),
('00000000-0000-0000-0000-000000000004', 100, 'achievement', 'Unlocked "First Post" achievement', NOW() - INTERVAL '14 days');
