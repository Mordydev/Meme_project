-- Wild 'n Out Meme Coin Platform - Database Schema Part 2
-- This part includes remaining tables, functions, triggers, RLS, and initial data

-- =============================================
-- CONTENT SYSTEM
-- =============================================

-- CONTENT
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- text, image, audio, video, mixed
  title VARCHAR(200) NOT NULL,
  body TEXT,
  media_url TEXT,
  additional_media TEXT[] DEFAULT '{}',
  battle_id UUID REFERENCES battles(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'published', -- draft, published, archived, removed
  moderation JSONB NOT NULL DEFAULT '{
    "status": "pending",
    "reviewerId": null,
    "reviewedAt": null,
    "reason": null
  }',
  metrics JSONB NOT NULL DEFAULT '{
    "viewCount": 0,
    "commentCount": 0,
    "shareCount": 0,
    "reactionCounts": {}
  }',
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_creator ON content(creator_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_created ON content(created_at DESC);
CREATE INDEX idx_content_moderation ON content((moderation->>'status'));
CREATE INDEX idx_content_battle ON content(battle_id) WHERE battle_id IS NOT NULL;
CREATE INDEX idx_content_tags ON content USING gin(tags);
CREATE INDEX idx_content_creator_status ON content(creator_id, status, created_at DESC);
CREATE INDEX content_search_idx ON content USING gin(search_vector);

-- COMMENTS
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'visible', -- visible, hidden, deleted
  metrics JSONB NOT NULL DEFAULT '{
    "reactionCounts": {}
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_content ON comments(content_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_created ON comments(created_at);
CREATE INDEX idx_comments_status ON comments(status);

-- REACTIONS
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL, -- content, comment
  target_id UUID NOT NULL,
  reaction_type VARCHAR(20) NOT NULL, -- like, love, haha, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id, reaction_type)
);

CREATE INDEX idx_reactions_user ON reactions(user_id);
CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX idx_reactions_type ON reactions(reaction_type);

-- CONTENT REPORTS
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL, -- content, comment, battle_entry, user
  target_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL, -- inappropriate, spam, offensive, copyright, etc.
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, reviewed, ignored, actioned
  reviewer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_reports_target ON content_reports(target_type, target_id);
CREATE INDEX idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_content_reports_created ON content_reports(created_at);

-- =============================================
-- COMMUNITY SYSTEM
-- =============================================

-- FORUMS CATEGORIES
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  order_position INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FORUM THREADS
CREATE TABLE forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- open, closed, pinned, archived
  view_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_forum_threads_category ON forum_threads(category_id);
CREATE INDEX idx_forum_threads_creator ON forum_threads(creator_id);
CREATE INDEX idx_forum_threads_status ON forum_threads(status);
CREATE INDEX idx_forum_threads_activity ON forum_threads(last_activity_at DESC);
CREATE INDEX idx_forum_threads_created ON forum_threads(created_at DESC);
CREATE INDEX forum_threads_search_idx ON forum_threads USING gin(search_vector);

-- THREAD REPLIES
CREATE TABLE thread_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES thread_replies(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'visible', -- visible, hidden, deleted
  metrics JSONB NOT NULL DEFAULT '{
    "reactionCounts": {}
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_thread_replies_thread ON thread_replies(thread_id);
CREATE INDEX idx_thread_replies_user ON thread_replies(user_id);
CREATE INDEX idx_thread_replies_parent ON thread_replies(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_thread_replies_created ON thread_replies(created_at);
CREATE INDEX idx_thread_replies_status ON thread_replies(status);

-- USER INTERESTS
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  interest VARCHAR(50) NOT NULL,
  source VARCHAR(20) NOT NULL, -- user_selected, system_inferred
  score FLOAT NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, interest)
);

CREATE INDEX idx_user_interests_user ON user_interests(user_id);
CREATE INDEX idx_user_interests_interest ON user_interests(interest);
CREATE INDEX idx_user_interests_score ON user_interests(score DESC);

-- =============================================
-- NOTIFICATION SYSTEM
-- =============================================

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, -- achievement, battle, content, follow, token, system
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  image TEXT,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read, created_at DESC);

-- FEED ITEMS
CREATE TABLE feed_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- content, battle, achievement, follow
  item_id UUID NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feed_items_user ON feed_items(user_id);
CREATE INDEX idx_feed_items_created ON feed_items(created_at DESC);
CREATE INDEX idx_feed_items_priority ON feed_items(priority DESC);
CREATE INDEX idx_feed_items_type ON feed_items(type);

-- =============================================
-- PLATFORM MANAGEMENT
-- =============================================

-- MODERATORS
CREATE TABLE moderators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_moderators_user_id ON moderators(user_id);
CREATE INDEX idx_moderators_profile_id ON moderators(profile_id);
CREATE INDEX idx_moderators_is_active ON moderators(is_active);

-- PLATFORM SETTINGS
CREATE TABLE platform_settings (
  id VARCHAR(100) PRIMARY KEY, -- setting key
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FEATURE FLAGS
CREATE TABLE feature_flags (
  id VARCHAR(100) PRIMARY KEY, -- feature key
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  audience JSONB DEFAULT '{"percentage": 100, "user_ids": []}', -- For gradual rollout
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ANALYTICS EVENTS
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- page_view, button_click, feature_use, etc.
  object_type VARCHAR(50), -- content, battle, profile, etc.
  object_id UUID,
  properties JSONB NOT NULL DEFAULT '{}',
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_object ON analytics_events(object_type, object_id) WHERE object_id IS NOT NULL;
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id) WHERE session_id IS NOT NULL;

-- =============================================
-- FUNCTIONS & PROCEDURES
-- =============================================

-- NOTIFICATION CREATION FUNCTION
CREATE OR REPLACE FUNCTION create_notification(
  user_id_param UUID,
  notification_type TEXT,
  title_param TEXT,
  body_param TEXT,
  image_param TEXT DEFAULT NULL,
  data_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    body,
    image,
    data,
    created_at,
    updated_at
  ) VALUES (
    user_id_param,
    notification_type,
    title_param,
    body_param,
    image_param,
    data_param,
    NOW(),
    NOW()
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- USER INTERACTION CHECK FUNCTION
CREATE OR REPLACE FUNCTION can_interact_with_user(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_blocked BOOLEAN;
BEGIN
  -- Check if either user has blocked the other
  SELECT EXISTS (
    SELECT 1 
    FROM user_relationships 
    WHERE 
      ((user_id = user1_id AND target_id = user2_id) OR 
       (user_id = user2_id AND target_id = user1_id)) 
      AND type = 'block'
  ) INTO is_blocked;
  
  RETURN NOT is_blocked;
END;
$$ LANGUAGE plpgsql;

-- UPDATE LOGIN STREAK FUNCTION
CREATE OR REPLACE FUNCTION update_login_streak()
RETURNS TRIGGER AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  today DATE := CURRENT_DATE;
BEGIN
  -- Get or create streak record
  INSERT INTO user_login_streaks (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update the streak
  UPDATE user_login_streaks
  SET 
    current_streak = CASE
      -- First login today
      WHEN last_login_date < today AND last_login_date = yesterday THEN current_streak + 1
      -- Already logged in today
      WHEN last_login_date = today THEN current_streak
      -- Streak broken
      ELSE 1
    END,
    longest_streak = GREATEST(
      longest_streak, 
      CASE
        WHEN last_login_date < today AND last_login_date = yesterday THEN current_streak + 1
        WHEN last_login_date = today THEN current_streak
        ELSE 1
      END
    ),
    last_login_date = today,
    streak_updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- INCREMENT BATTLE VOTE COUNT FUNCTION
CREATE OR REPLACE FUNCTION increment_battle_vote_count(battle_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE battles
  SET vote_count = vote_count + 1
  WHERE id = battle_id
  RETURNING vote_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- INCREMENT VOTE COUNT FUNCTION
CREATE OR REPLACE FUNCTION increment_vote_count(entry_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
  metrics_json JSONB;
BEGIN
  SELECT metrics INTO metrics_json FROM battle_entries WHERE id = entry_id;
  
  -- If metrics JSON doesn't have voteCount, initialize it
  IF metrics_json->>'voteCount' IS NULL THEN
    metrics_json = metrics_json || '{"voteCount": 1}'::jsonb;
  ELSE
    metrics_json = jsonb_set(
      metrics_json,
      '{voteCount}',
      to_jsonb((metrics_json->>'voteCount')::int + 1)
    );
  END IF;
  
  UPDATE battle_entries
  SET metrics = metrics_json
  WHERE id = entry_id
  RETURNING (metrics->>'voteCount')::int INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- USER POINTS RANK FUNCTION
CREATE OR REPLACE FUNCTION get_user_points_rank(user_id_param UUID)
RETURNS TABLE(user_id UUID, rank BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    (SELECT COUNT(*) + 1 FROM user_points WHERE total_points > up.total_points)::BIGINT AS rank
  FROM
    user_points up
  WHERE
    up.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- USER POINTS RANK IN PERIOD FUNCTION
CREATE OR REPLACE FUNCTION get_user_points_rank_in_period(
  user_id_param UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE(user_id UUID, rank BIGINT) AS $$
DECLARE
  user_points INTEGER;
BEGIN
  -- Get total points for the user in the period
  SELECT COALESCE(SUM(amount), 0) INTO user_points
  FROM point_transactions
  WHERE user_id = user_id_param
  AND created_at >= start_date
  AND created_at <= end_date;
  
  -- Return rank
  RETURN QUERY
  SELECT 
    user_id_param AS user_id,
    (
      SELECT COUNT(*) + 1 FROM (
        SELECT pt.user_id, SUM(pt.amount) AS total
        FROM point_transactions pt
        WHERE pt.created_at >= start_date
        AND pt.created_at <= end_date
        GROUP BY pt.user_id
        HAVING SUM(pt.amount) > user_points
      ) AS higher_users
    )::BIGINT AS rank;
END;
$$ LANGUAGE plpgsql;

-- CHECK MARKET CAP MILESTONES FUNCTION
CREATE OR REPLACE FUNCTION check_market_cap_milestones()
RETURNS void AS $$
DECLARE
  current_market_cap NUMERIC(20, 2);
  milestone RECORD;
BEGIN
  -- Get the most recent market cap
  SELECT market_cap INTO current_market_cap
  FROM token_price_history
  ORDER BY timestamp DESC
  LIMIT 1;
  
  -- Check against each milestone
  FOR milestone IN 
    SELECT * 
    FROM market_cap_milestones 
    WHERE achieved_at IS NULL 
    AND milestone_value <= current_market_cap
    ORDER BY milestone_value
  LOOP
    -- Mark milestone as achieved
    UPDATE market_cap_milestones
    SET 
      achieved_at = NOW(),
      updated_at = NOW()
    WHERE id = milestone.id;
    
    -- Create system notification for milestone (implementation simplified)
    PERFORM create_notification(
      user_id, -- This would be in a loop for all users in practice
      'token',
      'Market Cap Milestone Reached!',
      'The Wild ''n Out token has reached $' || milestone.milestone_value || '! ' || milestone.description,
      NULL,
      jsonb_build_object('milestoneId', milestone.id, 'value', milestone.milestone_value)
    )
    FROM user_profiles
    LIMIT 5; -- Limited for demo purposes
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- MATERIALIZED VIEWS
-- BATTLE LEADERBOARD
CREATE MATERIALIZED VIEW battle_leaderboard AS
SELECT
  up.id AS user_id,
  up.username,
  up.display_name,
  up.image_url,
  COALESCE((up.stats->>'battleCount')::int, 0) AS battle_count,
  COALESCE((up.stats->>'battleWins')::int, 0) AS battle_wins,
  CASE 
    WHEN COALESCE((up.stats->>'battleCount')::int, 0) > 0 
    THEN ROUND((COALESCE((up.stats->>'battleWins')::int, 0)::numeric / COALESCE((up.stats->>'battleCount')::int, 0)::numeric) * 100, 1)
    ELSE 0
  END AS win_percentage
FROM 
  user_profiles up
WHERE 
  COALESCE((up.stats->>'battleCount')::int, 0) > 0
ORDER BY 
  battle_wins DESC, win_percentage DESC, battle_count DESC;

CREATE UNIQUE INDEX battle_leaderboard_user_id ON battle_leaderboard(user_id);
CREATE INDEX battle_leaderboard_wins ON battle_leaderboard(battle_wins DESC);

-- POINTS LEADERBOARD
CREATE MATERIALIZED VIEW points_leaderboard AS
SELECT
  up.id AS user_id,
  up.username,
  up.display_name,
  up.image_url,
  p.total_points,
  p.level,
  DENSE_RANK() OVER (ORDER BY p.total_points DESC) AS rank
FROM 
  user_profiles up
JOIN 
  user_points p ON up.id = p.user_id
ORDER BY 
  p.total_points DESC, up.id;

CREATE UNIQUE INDEX points_leaderboard_user_id ON points_leaderboard(user_id);
CREATE INDEX points_leaderboard_points ON points_leaderboard(total_points DESC);
CREATE INDEX points_leaderboard_rank ON points_leaderboard(rank);

-- REFRESH ALL LEADERBOARDS FUNCTION
CREATE OR REPLACE FUNCTION refresh_all_leaderboards()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW battle_leaderboard;
  REFRESH MATERIALIZED VIEW points_leaderboard;
END;
$$ LANGUAGE plpgsql;

-- UPDATE BATTLE STATUSES FUNCTION
CREATE OR REPLACE FUNCTION update_battle_statuses()
RETURNS void AS $$
DECLARE
  now_time TIMESTAMPTZ := NOW();
BEGIN
  -- Update scheduled battles that should be open
  UPDATE battles
  SET 
    status = 'open',
    updated_at = now_time
  WHERE 
    status = 'scheduled' AND
    start_time <= now_time AND
    end_time > now_time;
  
  -- Update open battles that should move to voting
  UPDATE battles
  SET 
    status = 'voting',
    updated_at = now_time
  WHERE 
    status = 'open' AND
    end_time <= now_time AND
    voting_end_time > now_time;
  
  -- Update voting battles that should be completed
  UPDATE battles
  SET 
    status = 'completed',
    updated_at = now_time
  WHERE 
    status = 'voting' AND
    voting_end_time <= now_time;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- UPDATE USER BATTLE COUNT TRIGGER
CREATE OR REPLACE FUNCTION update_user_battle_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET stats = jsonb_set(
    stats,
    '{battleCount}',
    to_jsonb((stats->>'battleCount')::int + 1)
  )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_battle_entry_insert
AFTER INSERT ON battle_entries
FOR EACH ROW
EXECUTE FUNCTION update_user_battle_count();

-- UPDATE USER CONTENT COUNT TRIGGER
CREATE OR REPLACE FUNCTION update_user_content_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET stats = jsonb_set(
    stats,
    '{contentCount}',
    to_jsonb((stats->>'contentCount')::int + 1)
  )
  WHERE id = NEW.creator_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_content_insert
AFTER INSERT ON content
FOR EACH ROW
EXECUTE FUNCTION update_user_content_count();

-- UPDATE BATTLE WIN COUNT TRIGGER
CREATE OR REPLACE FUNCTION update_battle_win_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if rank is being set to 1 (winner)
  IF NEW.rank = 1 AND (OLD.rank IS NULL OR OLD.rank != 1) THEN
    UPDATE user_profiles
    SET stats = jsonb_set(
      stats,
      '{battleWins}',
      to_jsonb((stats->>'battleWins')::int + 1)
    )
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_entry_rank_update
AFTER UPDATE ON battle_entries
FOR EACH ROW
WHEN (NEW.rank IS NOT NULL)
EXECUTE FUNCTION update_battle_win_count();

-- UPDATE FOLLOW COUNTS TRIGGER
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update follower count for followed user
  UPDATE user_profiles
  SET stats = jsonb_set(
    stats,
    '{followerCount}',
    to_jsonb((stats->>'followerCount')::int + 1)
  )
  WHERE id = NEW.followed_id;
  
  -- Update following count for follower
  UPDATE user_profiles
  SET stats = jsonb_set(
    stats,
    '{followingCount}',
    to_jsonb((stats->>'followingCount')::int + 1)
  )
  WHERE id = NEW.follower_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_follow_insert
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- DECREASE FOLLOW COUNTS TRIGGER
CREATE OR REPLACE FUNCTION decrease_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update follower count for followed user
  UPDATE user_profiles
  SET stats = jsonb_set(
    stats,
    '{followerCount}',
    to_jsonb(GREATEST(0, (stats->>'followerCount')::int - 1))
  )
  WHERE id = OLD.followed_id;
  
  -- Update following count for follower
  UPDATE user_profiles
  SET stats = jsonb_set(
    stats,
    '{followingCount}',
    to_jsonb(GREATEST(0, (stats->>'followingCount')::int - 1))
  )
  WHERE id = OLD.follower_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_follow_delete
AFTER DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION decrease_follow_counts();

-- UPDATE THREAD REPLY COUNT TRIGGER
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forum_threads
  SET 
    reply_count = reply_count + 1,
    last_activity_at = NOW()
  WHERE id = NEW.thread_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_thread_reply_insert
AFTER INSERT ON thread_replies
FOR EACH ROW
EXECUTE FUNCTION update_thread_reply_count();

-- UPDATE BATTLE PARTICIPANT COUNT TRIGGER
CREATE OR REPLACE FUNCTION update_battle_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if battle exists
  PERFORM id FROM battles WHERE id = NEW.battle_id;
  
  IF FOUND THEN
    -- Update the battle with the new count
    UPDATE battles
    SET 
      participant_count = (
        SELECT COUNT(DISTINCT user_id) 
        FROM battle_entries 
        WHERE battle_id = NEW.battle_id
      ),
      entry_count = entry_count + 1
    WHERE id = NEW.battle_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_battle_entry_created
AFTER INSERT ON battle_entries
FOR EACH ROW
EXECUTE FUNCTION update_battle_participant_count();

-- UPDATE LOGIN STREAK TRIGGER
CREATE TRIGGER update_user_login_streak
AFTER INSERT ON user_sessions
FOR EACH ROW
EXECUTE FUNCTION update_login_streak();

-- UPDATE CONTENT SEARCH VECTOR TRIGGER
CREATE OR REPLACE FUNCTION update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, '{}'::text[]), ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_search_update
BEFORE INSERT OR UPDATE ON content
FOR EACH ROW
EXECUTE FUNCTION update_content_search_vector();

-- UPDATE BATTLE SEARCH VECTOR TRIGGER
CREATE OR REPLACE FUNCTION update_battle_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.battle_type, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER battle_search_update
BEFORE INSERT OR UPDATE ON battles
FOR EACH ROW
EXECUTE FUNCTION update_battle_search_vector();

-- UPDATE FORUM THREAD SEARCH VECTOR TRIGGER
CREATE OR REPLACE FUNCTION update_forum_thread_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forum_thread_search_update
BEFORE INSERT OR UPDATE ON forum_threads
FOR EACH ROW
EXECUTE FUNCTION update_forum_thread_search_vector();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
-- Enable RLS on tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- User profiles - anyone can view, users can update their own
CREATE POLICY "Users can read all profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Content - public content is viewable, users can manage their own
CREATE POLICY "Anyone can read published content" ON content
  FOR SELECT USING (status = 'published' AND (moderation->>'status')::text = 'approved');

CREATE POLICY "Users can manage their own content" ON content
  FOR ALL USING (creator_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid()::text));

-- Battle entries - approved entries visible to all, users manage their own
CREATE POLICY "Anyone can read approved battle entries" ON battle_entries
  FOR SELECT USING ((moderation->>'status')::text = 'approved');

CREATE POLICY "Users can manage their own entries" ON battle_entries
  FOR ALL USING (user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid()::text));

-- Comments - visible comments readable by all, users manage their own
CREATE POLICY "Anyone can read visible comments" ON comments
  FOR SELECT USING (status = 'visible');

CREATE POLICY "Users can manage their own comments" ON comments
  FOR ALL USING (user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid()::text));

-- Notifications - users can only see and manage their own
CREATE POLICY "Users can see their own notifications" ON notifications
  FOR SELECT USING (user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid()::text));

-- Content reports - users can create and view their own, moderators can view all
CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (reporter_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can view their own reports" ON content_reports
  FOR SELECT USING (reporter_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid()::text));

-- =============================================
-- INITIAL DATA POPULATION
-- =============================================

-- Forum categories
INSERT INTO forum_categories (name, description, order_position, icon) VALUES
  ('General Discussion', 'Talk about anything related to Wild ''n Out and the platform', 1, 'chat-bubble'),
  ('Battle Talk', 'Discuss battles, strategies, and share tips', 2, 'trophy'),
  ('Token Discussion', 'Everything about the $WILDNOUT token', 3, 'coin'),
  ('Feedback & Suggestions', 'Share your ideas to improve the platform', 4, 'lightbulb'),
  ('Help & Support', 'Get help with technical issues or questions', 5, 'question-mark');

-- Initial battle categories
INSERT INTO battle_categories (name, description, icon, color) VALUES
  ('Wild Style', 'Freestyle rap battles where creativity is key', 'mic', '#E9E336'),
  ('Pick Up & Kill It', 'Continue where others left off', 'chat', '#36E95C'),
  ('R&Beef', 'R&B-style musical battles', 'music', '#3654E9'),
  ('Tournament', 'Multi-round elimination contests', 'trophy', '#E93636'),
  ('Special Events', 'Limited-time themed battles', 'star', '#B036E9');

-- Initial achievements
INSERT INTO achievements (title, description, category, tier, icon, points_reward, criteria) VALUES
  ('Battle Rookie', 'Participated in your first battle', 'battle', 'bronze', 'trophy-bronze', 50, 'Participate in 1 battle'),
  ('Battle Veteran', 'Participated in 10 battles', 'battle', 'silver', 'trophy-silver', 200, 'Participate in 10 battles'),
  ('Battle Master', 'Participated in 50 battles', 'battle', 'gold', 'trophy-gold', 500, 'Participate in 50 battles'),
  ('First Win', 'Won your first battle', 'battle', 'silver', 'medal-silver', 100, 'Win 1 battle'),
  ('Champion', 'Won 10 battles', 'battle', 'gold', 'medal-gold', 1000, 'Win 10 battles'),
  ('Content Creator', 'Created your first content', 'content', 'bronze', 'pencil-bronze', 50, 'Create 1 content piece'),
  ('Community Member', 'Joined the community', 'community', 'bronze', 'person-bronze', 10, 'Create an account'),
  ('Token Holder', 'Connected wallet with $WILDNOUT tokens', 'token', 'bronze', 'coin-bronze', 50, 'Connect wallet with tokens'),
  ('Early Adopter', 'Joined during platform launch', 'special', 'gold', 'star-gold', 200, 'Join during launch period');

-- Initial token benefits
INSERT INTO token_benefits (name, description, min_tier) VALUES
  ('Exclusive Battles', 'Access to token-holder only battles', 'bronze'),
  ('Creator Spotlight', 'Get featured on the homepage', 'silver'),
  ('Points Multiplier', 'Earn 1.5x points on all activities', 'silver'),
  ('Custom Badge', 'Special badge on your profile', 'gold'),
  ('Early Access', 'Preview new features before release', 'gold'),
  ('Moderation Priority', 'Faster content moderation', 'platinum'),
  ('Direct Contact', 'Special access to platform team', 'platinum');

-- Initial market cap milestones
INSERT INTO market_cap_milestones (milestone_value, description) VALUES
  (10000000, 'First major milestone! The community is growing strong.'),
  (50000000, 'Breaking through! The Wild ''n Out token is gaining serious momentum.'),
  (100000000, 'Incredible achievement! We''ve hit the $100M market cap!'),
  (200000000, 'Massive growth! The Wild ''n Out token continues to rise!'),
  (500000000, 'Legendary status achieved! The Wild ''n Out token has reached $500M!');

-- Initial platform settings
INSERT INTO platform_settings (id, value, description) VALUES
  ('battle.default_duration', '{"hours": 24}', 'Default duration for battles'),
  ('battle.voting_duration', '{"hours": 24}', 'Default voting period duration after battle ends'),
  ('content.moderation', '{"auto_approve": false, "require_review": true}', 'Content moderation settings'),
  ('points.daily_limits', '{"battle_participation": 500, "content_creation": 500}', 'Daily point limits by activity'),
  ('token.tiers', '{"bronze": 100, "silver": 1000, "gold": 10000, "platinum": 100000}', 'Token holding tier thresholds'),
  ('platform.maintenance', '{"enabled": false, "message": ""}', 'Maintenance mode settings');

-- Initial feature flags
INSERT INTO feature_flags (id, enabled, description) VALUES
  ('advanced_battle_formats', true, 'Enable advanced battle formats beyond Wild Style'),
  ('token_dashboard', true, 'Enable token dashboard with price tracking'),
  ('achievement_system', true, 'Enable achievement system'),
  ('community_forums', true, 'Enable community forums'),
  ('content_creation', true, 'Enable content creation outside of battles'),
  ('wallet_integration', true, 'Enable wallet connection and verification');