-- Function to calculate total points for a user
CREATE OR REPLACE FUNCTION get_user_total_points(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO total
  FROM user_points
  WHERE user_id = user_id_param;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a user has earned an achievement
CREATE OR REPLACE FUNCTION check_achievement_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_post_count INTEGER;
  user_comment_count INTEGER;
  user_upvotes_received INTEGER;
  user_total_points INTEGER;
BEGIN
  -- Get user stats
  SELECT COUNT(*) INTO user_post_count FROM posts WHERE user_id = NEW.user_id;
  SELECT COUNT(*) INTO user_comment_count FROM comments WHERE user_id = NEW.user_id;
  SELECT COALESCE(SUM(upvotes), 0) INTO user_upvotes_received FROM posts WHERE user_id = NEW.user_id;
  SELECT get_user_total_points(NEW.user_id) INTO user_total_points;
  
  -- Check each achievement that the user doesn't already have
  FOR achievement_record IN 
    SELECT a.* FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = NEW.user_id
    WHERE ua.id IS NULL
  LOOP
    -- Check eligibility based on achievement criteria
    -- This is a simplified version - in production, you'd have more complex logic
    CASE achievement_record.name
      WHEN 'First Post' THEN
        IF user_post_count >= 1 THEN
          INSERT INTO user_achievements (user_id, achievement_id, earned_at)
          VALUES (NEW.user_id, achievement_record.id, NOW());
        END IF;
      WHEN 'Conversation Starter' THEN
        -- Check if any post by this user has at least 5 comments
        IF EXISTS (
          SELECT 1 FROM posts p
          JOIN comments c ON p.id = c.post_id
          WHERE p.user_id = NEW.user_id
          GROUP BY p.id
          HAVING COUNT(c.id) >= 5
        ) THEN
          INSERT INTO user_achievements (user_id, achievement_id, earned_at)
          VALUES (NEW.user_id, achievement_record.id, NOW());
        END IF;
      WHEN 'Popular Content' THEN
        IF user_upvotes_received >= 50 THEN
          INSERT INTO user_achievements (user_id, achievement_id, earned_at)
          VALUES (NEW.user_id, achievement_record.id, NOW());
        END IF;
      WHEN 'Helpful Hand' THEN
        IF user_comment_count >= 10 THEN
          INSERT INTO user_achievements (user_id, achievement_id, earned_at)
          VALUES (NEW.user_id, achievement_record.id, NOW());
        END IF;
      ELSE
        -- Other achievements would have their own criteria
        NULL;
    END CASE;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check achievements after points are added
CREATE TRIGGER check_achievements_after_points
AFTER INSERT ON user_points
FOR EACH ROW
EXECUTE FUNCTION check_achievement_eligibility();

-- Trigger to check achievements after a post is created or updated
CREATE TRIGGER check_achievements_after_post
AFTER INSERT OR UPDATE OF upvotes ON posts
FOR EACH ROW
EXECUTE FUNCTION check_achievement_eligibility();

-- Trigger to check achievements after a comment is created
CREATE TRIGGER check_achievements_after_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION check_achievement_eligibility(); 