import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Mock posts data
const posts = [
  {
    id: 'post_1',
    title: 'Welcome to Success Kid Community!',
    content: 'This is my first post here and I wanted to introduce myself to everyone. I\'m excited to be part of this community and looking forward to engaging with all of you!\n\nI\'ve been following the project for some time now and finally decided to jump in and participate actively.',
    preview: 'This is my first post here and I wanted to introduce myself to everyone. I\'m excited to be part of this community...',
    type: 'text',
    author: {
      id: 'user_1',
      username: 'founder',
      displayName: 'Founder',
      avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=founder',
      role: 'Community Manager'
    },
    categoryId: 'general',
    createdAt: '2023-09-15T00:00:00Z',
    commentCount: 24,
    voteCount: 156,
    tags: ['Welcome', 'Introduction', 'Community']
  },
  {
    id: 'post_2',
    title: 'How I earned 5000 points in my first week',
    content: 'I wanted to share my strategy for earning Success Points as a new member. Here\'s what worked for me...\n\n1. Daily engagement with community posts\n2. Thoughtful comments on discussions\n3. Sharing quality content\n4. Helping new members\n\nWhat strategies have worked for you?',
    preview: 'I wanted to share my strategy for earning Success Points as a new member. Here\'s what worked for me...',
    type: 'text',
    author: {
      id: 'user_2',
      username: 'pointmaster',
      displayName: 'Point Master',
      avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=pointmaster',
      role: 'Point Expert'
    },
    categoryId: 'general',
    createdAt: '2023-09-17T12:30:00Z',
    commentCount: 42,
    voteCount: 235,
    tags: ['Guide', 'Points', 'Tips']
  },
  {
    id: 'post_3',
    title: 'Understanding market cap milestones and why they matter',
    content: 'Market cap milestones aren\'t just arbitrary numbers. They represent important threshold moments for the community...\n\nWhen we reach key market cap levels, it opens up new opportunities for:\n\n- Exchange listings\n- Media attention\n- Partnership opportunities\n- Community growth\n\nLet\'s discuss why the next milestone is particularly important.',
    preview: 'Market cap milestones aren\'t just arbitrary numbers. They represent important threshold moments for the community...',
    type: 'text',
    author: {
      id: 'user_3',
      username: 'tokenexpert',
      displayName: 'Token Expert',
      avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=tokenexpert',
      role: 'Token Expert'
    },
    categoryId: 'token',
    createdAt: '2023-09-18T09:15:00Z',
    commentCount: 32,
    voteCount: 187,
    tags: ['Market', 'Education', 'Tokens']
  },
  {
    id: 'post_4',
    title: 'Latest platform update: New features released!',
    content: 'We\'re excited to announce our latest platform update with several new features and improvements!\n\n**New Features:**\n\n- Community forums and discussion system\n- Enhanced points tracking\n- Improved wallet connection\n- New achievement badges\n\nCheck out the full changelog for more details.',
    preview: 'We\'re excited to announce our latest platform update with several new features and improvements!',
    type: 'text',
    author: {
      id: 'user_1',
      username: 'founder',
      displayName: 'Founder',
      avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=founder',
      role: 'Community Manager'
    },
    categoryId: 'announcements',
    createdAt: '2023-09-20T10:00:00Z',
    commentCount: 56,
    voteCount: 312,
    tags: ['Update', 'Features', 'Announcement']
  },
  {
    id: 'post_5',
    title: 'Need help with connecting my wallet',
    content: 'I\'m having trouble connecting my wallet to the platform. I\'ve tried the following steps:\n\n1. Clicked the "Connect Wallet" button\n2. Selected my wallet provider\n3. Approved the connection in my wallet\n\nBut I keep getting an error message. Has anyone else experienced this issue or know how to fix it?',
    preview: 'I\'m having trouble connecting my wallet to the platform. I\'ve tried the following steps...',
    type: 'text',
    author: {
      id: 'user_4',
      username: 'newuser',
      displayName: 'New User',
      avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=newuser'
    },
    categoryId: 'help',
    createdAt: '2023-09-21T15:45:00Z',
    commentCount: 18,
    voteCount: 9,
    tags: ['Help', 'Wallet', 'Technical']
  },
  {
    id: 'post_6',
    title: 'Community event this weekend!',
    content: 'We\'re hosting our first community AMA this weekend! Join us on Saturday at 2 PM UTC for a chance to ask questions and discuss the future of the project.\n\nTopics will include:\n\n- Upcoming features\n- Tokenomics\n- Community initiatives\n- Partnership announcements\n\nDon\'t miss it!',
    preview: 'We\'re hosting our first community AMA this weekend! Join us on Saturday at 2 PM UTC for a chance to ask questions...',
    type: 'text',
    author: {
      id: 'user_5',
      username: 'eventcoordinator',
      displayName: 'Event Coordinator',
      avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=eventcoordinator',
      role: 'Events Team'
    },
    categoryId: 'announcements',
    createdAt: '2023-09-22T08:30:00Z',
    commentCount: 29,
    voteCount: 175,
    tags: ['Event', 'AMA', 'Community']
  }
];

// GET handler for posts (with filtering)
export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('categoryId');
  const feed = searchParams.get('feed') || 'latest';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Filter posts by category if provided
  let filteredPosts = [...posts];
  if (categoryId) {
    filteredPosts = filteredPosts.filter(post => post.categoryId === categoryId);
  }
  
  // Sort posts based on feed type
  if (feed === 'latest') {
    filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (feed === 'trending') {
    filteredPosts.sort((a, b) => b.voteCount - a.voteCount);
  }
  
  // Apply pagination
  const paginatedPosts = filteredPosts.slice(offset, offset + limit);
  
  return NextResponse.json({
    data: {
      posts: paginatedPosts,
      pagination: {
        total: filteredPosts.length,
        limit,
        offset
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 15)
    }
  });
}

// POST handler for creating posts
export async function POST(request: NextRequest) {
  const data = await request.json();
  const postData = data.data;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create a new post
  const newPost = {
    id: `post_${Math.random().toString(36).substring(2, 10)}`,
    title: postData.title,
    content: postData.content,
    preview: postData.content.substring(0, 100) + '...',
    type: postData.type,
    author: {
      id: 'user_current',
      username: 'currentuser',
      displayName: 'Current User',
      avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=currentuser'
    },
    categoryId: postData.categoryId,
    createdAt: new Date().toISOString(),
    commentCount: 0,
    voteCount: 1,
    userVote: 'up',
    tags: postData.tags || [],
    mediaUrls: postData.mediaUrls || []
  };
  
  return NextResponse.json({
    data: {
      post: newPost,
      pointsAwarded: 10
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 15)
    }
  });
}
