import { NextRequest, NextResponse } from 'next/server';
import { DiscoveryItem } from '@/types';

/**
 * Discovery feed API endpoint
 * This is a mock implementation that returns static data
 * In a real implementation, this would be personalized based on the user's interests and activity
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const interestsParam = searchParams.get('interests');
  const excludeIdsParam = searchParams.get('excludeIds');
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  
  // Parse interests and excludeIds
  const interests = interestsParam ? interestsParam.split(',') : [];
  const excludeIds = excludeIdsParam ? excludeIdsParam.split(',') : [];
  
  // Get all available interests for the user
  const allInterests = [
    'tokenomics',
    'community',
    'memes',
    'crypto',
    'technology',
    'finance',
    'investing',
    'blockchain',
    'rewards',
    'nft',
    'defi',
    'success',
  ];
  
  // Generate discovery items (mock data)
  let items = generateMockDiscoveryItems();
  
  // Filter by interests if specified
  if (interests.length > 0) {
    items = items.filter(item => 
      // For this mock, we'll just check if any of the interests are contained in the title or snippet
      interests.some(interest => 
        item.title.toLowerCase().includes(interest.toLowerCase()) || 
        item.snippet.toLowerCase().includes(interest.toLowerCase())
      )
    );
  }
  
  // Filter out excluded items
  if (excludeIds.length > 0) {
    items = items.filter(item => !excludeIds.includes(item.id));
  }
  
  // Limit the number of items
  items = items.slice(0, limit);
  
  return NextResponse.json({
    items,
    interests: allInterests,
  }, { status: 200 });
}

/**
 * Generate mock discovery items
 */
function generateMockDiscoveryItems(): DiscoveryItem[] {
  return [
    {
      id: 'post_101',
      type: 'post',
      title: 'Understanding Success Kid Tokenomics',
      snippet: 'A comprehensive guide to how Success Kid tokens work and how the community rewards system creates long-term value.',
      author: {
        id: 'user_201',
        username: 'token_expert',
        avatarUrl: '/images/avatars/user1.png',
      },
      createdAt: '2025-03-10T15:30:00Z',
      reason: 'recommended',
    },
    {
      id: 'post_102',
      type: 'post',
      title: 'My Success Kid Journey: From Meme to Community',
      snippet: 'How I discovered the Success Kid platform and found a welcoming community of crypto enthusiasts and meme lovers.',
      thumbnailUrl: '/images/content/success-journey.jpg',
      author: {
        id: 'user_202',
        username: 'meme_lover',
        avatarUrl: '/images/avatars/user2.png',
      },
      createdAt: '2025-03-09T12:15:00Z',
      reason: 'popular',
    },
    {
      id: 'post_103',
      type: 'post',
      title: 'Top 5 Ways to Earn Success Points',
      snippet: 'Maximize your rewards on the platform with these proven strategies for earning Success Points through engagement.',
      thumbnailUrl: '/images/content/success-points.jpg',
      author: {
        id: 'user_203',
        username: 'rewards_hunter',
      },
      createdAt: '2025-03-08T09:45:00Z',
      reason: 'trending',
    },
    {
      id: 'post_104',
      type: 'post',
      title: 'Technical Analysis: SKC Token Price Prediction',
      snippet: 'An in-depth look at the Success Kid token price trends and potential future movement based on market data.',
      author: {
        id: 'user_204',
        username: 'crypto_analyst',
        avatarUrl: '/images/avatars/user4.png',
      },
      createdAt: '2025-03-07T14:30:00Z',
      reason: 'interest',
    },
    {
      id: 'post_105',
      type: 'post',
      title: 'Community Spotlight: Meet the Success Kid Moderators',
      snippet: 'Get to know the dedicated team behind the Success Kid community who help keep the platform positive and engaging.',
      thumbnailUrl: '/images/content/community-team.jpg',
      author: {
        id: 'user_205',
        username: 'community_manager',
        avatarUrl: '/images/avatars/user5.png',
      },
      createdAt: '2025-03-06T10:00:00Z',
      reason: 'recommended',
    },
    {
      id: 'post_106',
      type: 'post',
      title: 'From Zero to Hero: My Success Kid Achievements',
      snippet: 'How I collected all platform achievements and what I learned along the way about engaging with the community.',
      author: {
        id: 'user_206',
        username: 'achievement_hunter',
      },
      createdAt: '2025-03-05T16:20:00Z',
      reason: 'trending',
    },
    {
      id: 'post_107',
      type: 'post',
      title: 'The Future of Meme Coins: Success Kid Innovation',
      snippet: 'Why Success Kid is leading the way in creating genuine utility and community value in the meme coin space.',
      thumbnailUrl: '/images/content/future-memes.jpg',
      author: {
        id: 'user_207',
        username: 'crypto_visionary',
        avatarUrl: '/images/avatars/user7.png',
      },
      createdAt: '2025-03-04T11:10:00Z',
      reason: 'popular',
    },
    {
      id: 'post_108',
      type: 'post',
      title: 'Success Kid Wallet Guide for Beginners',
      snippet: 'A step-by-step guide to setting up your first crypto wallet and connecting it to the Success Kid platform.',
      author: {
        id: 'user_208',
        username: 'wallet_wizard',
      },
      createdAt: '2025-03-03T13:45:00Z',
      reason: 'interest',
    },
    {
      id: 'post_109',
      type: 'post',
      title: 'Success Kid Meme Contest Winners Announced!',
      snippet: 'Check out the creative and hilarious winning entries in our platform-wide meme creation contest.',
      thumbnailUrl: '/images/content/meme-contest.jpg',
      author: {
        id: 'user_209',
        username: 'contest_organizer',
        avatarUrl: '/images/avatars/user9.png',
      },
      createdAt: '2025-03-02T17:30:00Z',
      reason: 'trending',
    },
    {
      id: 'post_110',
      type: 'post',
      title: 'How to Redeem Your Success Points for Tokens',
      snippet: 'Everything you need to know about converting your earned Success Points into SKC tokens and maximizing your rewards.',
      author: {
        id: 'user_210',
        username: 'redemption_guru',
        avatarUrl: '/images/avatars/user10.png',
      },
      createdAt: '2025-03-01T14:20:00Z',
      reason: 'recommended',
    },
    // Add more items as needed
  ];
}
