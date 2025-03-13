import { UserActivity } from '@/components/features/profile/activity-timeline';
import { UserAchievement } from '@/components/features/profile/achievement-collection';
import { UserProfile } from '@/components/features/profile/connections-list';
import { UserStats } from '@/components/features/profile';

/**
 * Fetch user profile data from API
 * 
 * Note: This is a mock implementation. In a real application,
 * this would call an actual API endpoint.
 */
export async function fetchUserProfile(userId: string): Promise<{
  profile: UserProfile;
  stats: UserStats;
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock user profile data
  return {
    profile: {
      id: userId,
      displayName: 'User ' + userId.substring(0, 5),
      username: 'user' + userId.substring(0, 5),
      avatarUrl: undefined,
      level: 5,
      isFollowing: false,
    },
    stats: {
      points: 1250,
      achievements: 8,
      posts: 23,
      followers: 15,
      following: 42,
    },
  };
}

/**
 * Fetch user activities from API
 */
export async function fetchUserActivities(
  userId: string,
  filter?: string,
  limit = 10,
  offset = 0
): Promise<{ activities: UserActivity[]; totalCount: number }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock activity data
  const activities: UserActivity[] = [
    {
      id: '1',
      type: 'post',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      details: {
        postId: 'post1',
        title: 'My First Post',
        previewText: 'This is my first post on the platform!'
      }
    },
    {
      id: '2',
      type: 'achievement',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      details: {
        achievementId: 'achievement1',
        title: 'First Steps'
      }
    },
    {
      id: '3',
      type: 'points',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      details: {
        points: 100
      }
    },
    {
      id: '4',
      type: 'comment',
      timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      details: {
        postId: 'post2',
        previewText: 'Great content! Thanks for sharing.'
      }
    },
    {
      id: '5',
      type: 'level_up',
      timestamp: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      details: {
        level: 5
      }
    }
  ];
  
  // Filter activities if filter is provided
  const filteredActivities = filter
    ? activities.filter(activity => activity.type === filter)
    : activities;
  
  return {
    activities: filteredActivities.slice(offset, offset + limit),
    totalCount: filteredActivities.length,
  };
}

/**
 * Fetch user achievements from API
 */
export async function fetchUserAchievements(
  userId: string,
  limit = 20,
  offset = 0
): Promise<{ achievements: UserAchievement[]; totalCount: number }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock achievement data
  const achievements: UserAchievement[] = [
    {
      id: 'achievement1',
      title: 'First Steps',
      description: 'Complete your profile setup and join the Success Kid community.',
      iconUrl: '/images/badges/first-steps.svg',
      unlockedAt: new Date().toISOString(),
      difficulty: 'common',
      pointsReward: 50
    },
    {
      id: 'achievement2',
      title: 'Content Creator',
      description: 'Create your first post on the platform.',
      iconUrl: '/images/badges/content-creator.svg',
      unlockedAt: new Date(Date.now() - 86400000).toISOString(),
      difficulty: 'common',
      pointsReward: 100
    },
    {
      id: 'achievement3',
      title: 'Conversation Starter',
      description: 'Receive 5 comments on one of your posts.',
      iconUrl: '/images/badges/conversation-starter.svg',
      progress: 60,
      difficulty: 'uncommon',
      pointsReward: 200
    },
    {
      id: 'achievement4',
      title: 'Rising Star',
      description: 'Reach the daily leaderboard top 10.',
      iconUrl: '/images/badges/rising-star.svg',
      progress: 30,
      difficulty: 'rare',
      pointsReward: 400
    }
  ];
  
  return {
    achievements: achievements.slice(offset, offset + limit),
    totalCount: achievements.length,
  };
}

/**
 * Fetch user connections from API
 */
export async function fetchUserConnections(
  userId: string,
  type: 'followers' | 'following',
  query?: string,
  limit = 10,
  offset = 0
): Promise<{ connections: UserProfile[]; totalCount: number }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock connection data
  const connections: UserProfile[] = [
    {
      id: 'user1',
      displayName: 'Alice Cooper',
      username: 'alice',
      avatarUrl: '/images/avatars/alice.jpg',
      level: 6,
      isFollowing: true
    },
    {
      id: 'user2',
      displayName: 'Bob Smith',
      username: 'bobsmith',
      avatarUrl: '/images/avatars/bob.jpg',
      level: 4,
      isFollowing: false
    },
    {
      id: 'user3',
      displayName: 'Charlie Davis',
      username: 'charlie',
      avatarUrl: '/images/avatars/charlie.jpg',
      level: 8,
      isFollowing: true
    }
  ];
  
  // Filter connections if query is provided
  const filteredConnections = query
    ? connections.filter(user => 
        user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        user.username.toLowerCase().includes(query.toLowerCase())
      )
    : connections;
  
  return {
    connections: filteredConnections.slice(offset, offset + limit),
    totalCount: filteredConnections.length,
  };
}

/**
 * Follow user API call
 */
export async function followUser(userId: string): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock successful response
  return true;
}

/**
 * Unfollow user API call
 */
export async function unfollowUser(userId: string): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock successful response
  return true;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: {
  displayName?: string;
  username?: string;
  bio?: string;
  imageUrl?: string;
}): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock successful response
  return true;
}
