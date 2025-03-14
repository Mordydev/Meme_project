import { NextRequest, NextResponse } from 'next/server';
import { UserSuggestion } from '@/types';

/**
 * User recommendations API endpoint
 * This is a mock implementation that returns static data
 * In a real implementation, this would be personalized based on the user's connections, interests, and activity
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const excludeFollowing = searchParams.get('excludeFollowing') !== 'false';
  const limit = parseInt(searchParams.get('limit') || '5', 10);
  
  // Generate mock user suggestions
  let users = generateMockUserSuggestions();
  
  // Limit the number of users
  users = users.slice(0, limit);
  
  return NextResponse.json({ users }, { status: 200 });
}

/**
 * Generate mock user suggestions
 */
function generateMockUserSuggestions(): UserSuggestion[] {
  return [
    {
      id: 'user_301',
      username: 'crypto_wizard',
      displayName: 'Crypto Wizard',
      avatarUrl: '/images/avatars/user11.png',
      reason: 'popular',
      followerCount: 1254,
    },
    {
      id: 'user_302',
      username: 'token_analyst',
      displayName: 'Token Analyst',
      avatarUrl: '/images/avatars/user12.png',
      reason: 'similar_interests',
      followerCount: 876,
    },
    {
      id: 'user_303',
      username: 'meme_creator',
      displayName: 'Meme Creator',
      reason: 'popular',
      followerCount: 2103,
    },
    {
      id: 'user_304',
      username: 'blockchain_dev',
      displayName: 'Blockchain Developer',
      avatarUrl: '/images/avatars/user14.png',
      reason: 'similar_interests',
      followerCount: 532,
    },
    {
      id: 'user_305',
      username: 'community_guide',
      displayName: 'Community Guide',
      avatarUrl: '/images/avatars/user15.png',
      reason: 'mutual_connections',
      mutualConnections: 3,
      followerCount: 1675,
    },
    {
      id: 'user_306',
      username: 'defi_expert',
      displayName: 'DeFi Expert',
      reason: 'similar_interests',
      followerCount: 987,
    },
    {
      id: 'user_307',
      username: 'nft_collector',
      displayName: 'NFT Collector',
      avatarUrl: '/images/avatars/user17.png',
      reason: 'popular',
      followerCount: 1432,
    },
    {
      id: 'user_308',
      username: 'token_founder',
      displayName: 'Token Founder',
      avatarUrl: '/images/avatars/user18.png',
      reason: 'mutual_connections',
      mutualConnections: 5,
      followerCount: 3241,
    },
    {
      id: 'user_309',
      username: 'crypto_artist',
      displayName: 'Crypto Artist',
      reason: 'similar_interests',
      followerCount: 763,
    },
    {
      id: 'user_310',
      username: 'web3_enthusiast',
      displayName: 'Web3 Enthusiast',
      avatarUrl: '/images/avatars/user20.png',
      reason: 'mutual_connections',
      mutualConnections: 2,
      followerCount: 895,
    },
  ];
}
