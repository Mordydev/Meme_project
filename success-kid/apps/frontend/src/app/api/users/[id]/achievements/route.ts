import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

// Sample achievement definitions
const achievementDefinitions = [
  {
    id: 'achievement_first_steps',
    title: 'First Steps',
    description: 'Complete your profile setup and join the Success Kid community.',
    iconUrl: '/images/badges/first-steps.svg',
    difficulty: 'common',
    pointsReward: 50
  },
  {
    id: 'achievement_content_creator',
    title: 'Content Creator',
    description: 'Create your first post on the platform.',
    iconUrl: '/images/badges/content-creator.svg',
    difficulty: 'common',
    pointsReward: 100
  },
  {
    id: 'achievement_conversation_starter',
    title: 'Conversation Starter',
    description: 'Receive 5 comments on one of your posts.',
    iconUrl: '/images/badges/conversation-starter.svg',
    difficulty: 'uncommon',
    pointsReward: 200
  },
  {
    id: 'achievement_daily_login',
    title: 'Daily Devotion',
    description: 'Log in for 7 consecutive days.',
    iconUrl: '/images/badges/daily-login.svg',
    difficulty: 'common',
    pointsReward: 150
  },
  {
    id: 'achievement_helpful_hand',
    title: 'Helpful Hand',
    description: 'Have 10 of your comments upvoted.',
    iconUrl: '/images/badges/helpful-hand.svg',
    difficulty: 'uncommon',
    pointsReward: 250
  },
  {
    id: 'achievement_wallet_connector',
    title: 'Wallet Connector',
    description: 'Connect your wallet to the platform.',
    iconUrl: '/images/badges/wallet-connector.svg',
    difficulty: 'common',
    pointsReward: 100
  },
  {
    id: 'achievement_rising_star',
    title: 'Rising Star',
    description: 'Reach the daily leaderboard top 10.',
    iconUrl: '/images/badges/rising-star.svg',
    difficulty: 'rare',
    pointsReward: 400
  },
  {
    id: 'achievement_milestone_witness',
    title: 'Milestone Witness',
    description: 'Be active during a market cap milestone achievement.',
    iconUrl: '/images/badges/milestone-witness.svg',
    difficulty: 'rare',
    pointsReward: 500
  },
  {
    id: 'achievement_community_voice',
    title: 'Community Voice',
    description: 'Receive 100 total upvotes on your content.',
    iconUrl: '/images/badges/community-voice.svg',
    difficulty: 'epic',
    pointsReward: 750
  },
  {
    id: 'achievement_community_builder',
    title: 'Community Builder',
    description: 'Successfully refer 5 new users who remain active.',
    iconUrl: '/images/badges/community-builder.svg',
    difficulty: 'epic',
    pointsReward: 1000
  }
];

// Function to generate unlocked achievements for a user
function generateUserAchievements(userId: string) {
  // For demo purposes, unlock a random subset of achievements
  const unlockCount = Math.floor(Math.random() * 6) + 2; // Between 2 and 7 achievements
  
  // Shuffle achievements and pick a subset
  const shuffled = [...achievementDefinitions]
    .sort(() => 0.5 - Math.random());
  
  const unlocked = shuffled.slice(0, unlockCount);
  const locked = shuffled.slice(unlockCount);
  
  // Add unlock dates to the unlocked achievements
  const unlockedWithDates = unlocked.map(achievement => {
    const randomDaysAgo = Math.floor(Math.random() * 90); // Random date within the last 90 days
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() - randomDaysAgo);
    
    return {
      ...achievement,
      unlockedAt: unlockDate.toISOString()
    };
  });
  
  // Add progress to locked achievements
  const lockedWithProgress = locked.map(achievement => {
    return {
      ...achievement,
      progress: Math.floor(Math.random() * 80) + 1 // Between 1% and 80% complete
    };
  });
  
  // Combine and sort (unlocked first, then by date or progress)
  return [
    ...unlockedWithDates.sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()),
    ...lockedWithProgress.sort((a, b) => b.progress - a.progress)
  ];
}

// GET handler for user achievements
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    // Check authentication
    if (!userId) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user ID from params
    const { id } = params;
    
    // Generate sample achievements for the user
    const achievements = generateUserAchievements(id);
    
    // Calculate statistics
    const stats = {
      total: achievementDefinitions.length,
      unlocked: achievements.filter(a => a.unlockedAt).length,
      byDifficulty: {
        common: achievements.filter(a => a.difficulty === 'common' && a.unlockedAt).length,
        uncommon: achievements.filter(a => a.difficulty === 'uncommon' && a.unlockedAt).length,
        rare: achievements.filter(a => a.difficulty === 'rare' && a.unlockedAt).length,
        epic: achievements.filter(a => a.difficulty === 'epic' && a.unlockedAt).length
      }
    };
    
    // Return achievements
    return Response.json({
      data: {
        achievements,
        stats
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting user achievements:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
