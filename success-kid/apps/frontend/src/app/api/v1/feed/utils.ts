import { FeedItem } from '@/components/features/activity-feed/types';

/**
 * Generate a mock feed item for testing
 */
export function generateMockFeedItem(feedType: string): FeedItem {
  const types = ['post', 'media', 'activity', 'achievement'];
  const type = types[Math.floor(Math.random() * types.length)] as any;
  const id = `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const authorId = `user_${Math.floor(Math.random() * 1000)}`;
  
  const baseItem = {
    id,
    type,
    author: {
      id: authorId,
      username: `user${authorId.slice(-3)}`,
      displayName: `User ${authorId.slice(-3)}`,
      avatarUrl: Math.random() > 0.5 ? `/images/avatars/avatar${Math.floor(Math.random() * 10) + 1}.png` : undefined
    },
    createdAt: new Date().toISOString(),
    interactions: {
      votes: Math.floor(Math.random() * 20),
      comments: Math.floor(Math.random() * 5),
      shares: Math.floor(Math.random() * 3)
    },
    userInteractions: {
      voted: null,
      saved: false,
      commented: false
    }
  };
  
  // Generate type-specific content
  let item;
  
  switch (type) {
    case 'post':
      item = {
        ...baseItem,
        content: {
          title: `New Post ${Math.floor(Math.random() * 1000)}`,
          text: `This is a newly created post for the Success Kid community platform. It shows how real-time updates work in the activity feed.`,
          hasMedia: Math.random() > 0.7,
          mediaUrls: Math.random() > 0.7 ? ['/images/sample-post-image.jpg'] : undefined
        }
      };
      break;
      
    case 'media':
      item = {
        ...baseItem,
        content: {
          title: Math.random() > 0.5 ? `New Media Share ${Math.floor(Math.random() * 1000)}` : undefined,
          description: Math.random() > 0.5 ? 'Just uploaded this awesome content!' : undefined,
          mediaUrls: ['/images/sample-media.jpg'],
          mediaType: 'image'
        }
      };
      break;
      
    case 'activity':
      const activityTypes = ['follow', 'comment', 'vote', 'milestone', 'level_up'];
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      
      item = {
        ...baseItem,
        content: {
          activityType,
          targetId: Math.random() > 0.5 ? `target_${Math.floor(Math.random() * 1000)}` : undefined,
          targetType: Math.random() > 0.5 ? ['user', 'post', 'comment'][Math.floor(Math.random() * 3)] : undefined,
          targetName: Math.random() > 0.5 ? `Example Target ${Math.floor(Math.random() * 100)}` : undefined,
          detail: Math.random() > 0.7 ? 'New activity that just occurred' : undefined
        }
      };
      break;
      
    case 'achievement':
      item = {
        ...baseItem,
        content: {
          achievementId: `achievement_${Math.floor(Math.random() * 100)}`,
          achievementName: ['First Post', 'Community Builder', 'Token Holder', 'Engagement Expert', 'Milestone Contributor'][Math.floor(Math.random() * 5)],
          achievementIcon: '/images/badges/achievement.svg',
          achievementDescription: 'This user just unlocked this achievement!',
          pointsAwarded: Math.floor(Math.random() * 500) + 100
        }
      };
      break;
      
    default:
      item = baseItem;
  }
  
  return item as FeedItem;
}
