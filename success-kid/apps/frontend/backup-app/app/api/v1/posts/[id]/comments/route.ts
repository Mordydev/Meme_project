import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Mock comments data
const generateMockComments = (postId: string) => {
  // Create root comments
  const rootComments = [
    {
      id: `comment_${postId}_1`,
      content: 'This is a great post! Thanks for sharing this information with the community.',
      author: {
        id: 'user_5',
        username: 'engagedmember',
        displayName: 'Engaged Member',
        avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=engagedmember'
      },
      createdAt: '2023-09-23T10:15:00Z',
      voteCount: 42,
      userVote: 'up',
      parentId: undefined,
      depth: 0,
      childCount: 2
    },
    {
      id: `comment_${postId}_2`,
      content: 'I have a question about this. Has anyone tried implementing this in a different context?',
      author: {
        id: 'user_6',
        username: 'curious',
        displayName: 'Curious Mind',
        avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=curious'
      },
      createdAt: '2023-09-23T11:30:00Z',
      voteCount: 18,
      userVote: null,
      parentId: undefined,
      depth: 0,
      childCount: 1
    },
    {
      id: `comment_${postId}_3`,
      content: 'I disagree with some points here. I think we need to consider alternative perspectives.',
      author: {
        id: 'user_7',
        username: 'skeptic',
        displayName: 'Healthy Skeptic',
        avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=skeptic'
      },
      createdAt: '2023-09-23T12:45:00Z',
      voteCount: 5,
      userVote: null,
      parentId: undefined,
      depth: 0,
      childCount: 3
    }
  ];
  
  // Create replies
  const replies = [
    // Replies to first comment
    {
      id: `comment_${postId}_1_1`,
      content: 'I agree! This has been very helpful for me as well.',
      author: {
        id: 'user_8',
        username: 'supporter',
        displayName: 'Supporter',
        avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=supporter'
      },
      createdAt: '2023-09-23T10:30:00Z',
      voteCount: 12,
      userVote: null,
      parentId: `comment_${postId}_1`,
      depth: 1,
      childCount: 0
    },
    {
      id: `comment_${postId}_1_2`,
      content: 'Do you have any additional resources on this topic? I\'d love to learn more.',
      author: {
        id: 'user_9',
        username: 'learner',
        displayName: 'Eager Learner',
        avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=learner'
      },
      createdAt: '2023-09-23T10:45:00Z',
      voteCount: 8,
      userVote: null,
      parentId: `comment_${postId}_1`,
      depth: 1,
      childCount: 1
    },
    // Reply to the reply
    {
      id: `comment_${postId}_1_2_1`,
      content: 'Not the original commenter, but you might want to check out this resource: [link]',
      author: {
        id: 'user_10',
        username: 'helpful',
        displayName: 'Helpful User',
        avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=helpful'
      },
      createdAt: '2023-09-23T11:00:00Z',
      voteCount: 15,
      userVote: 'up',
      parentId: `comment_${postId}_1_2`,
      depth: 2,
      childCount: 0
    },
    
    // Reply to second comment
    {
      id: `comment_${postId}_2_1`,
      content: 'I\'ve tried something similar in my project, and it worked well with some adjustments.',
      author: {
        id: 'user_11',
        username: 'experienced',
        displayName: 'Experienced Dev',
        avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=experienced'
      },
      createdAt: '2023-09-23T11:45:00Z',
      voteCount: 7,
      userVote: null,
      parentId: `comment_${postId}_2`,
      depth: 1,
      childCount: 0
    },
    
    // Replies to third comment
    {
      id: `comment_${postId}_3_1`,
      content: 'Can you elaborate on which points you disagree with? I\'m curious about your perspective.',
      author: {
        id: 'user_12',
        username: 'inquirer',
        displayName: 'Inquirer',
        avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=inquirer'
      },
      createdAt: '2023-09-23T13:00:00Z',
      voteCount: 9,
      userVote: null,
      parentId: `comment_${postId}_3`,
      depth: 1,
      childCount: 1
    },
    // Reply to the reply
    {
      id: `comment_${postId}_3_1_1`,
      content: 'I\'d like to know this too. It\'s important to consider different viewpoints.',
      author: {
        id: 'user_13',
        username: 'openminded',
        displayName: 'Open Minded',
        avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=openminded'
      },
      createdAt: '2023-09-23T13:15:00Z',
      voteCount: 4,
      userVote: null,
      parentId: `comment_${postId}_3_1`,
      depth: 2,
      childCount: 0
    },
    {
      id: `comment_${postId}_3_2`,
      content: 'I see your point, but I think there\'s value in the original approach too.',
      author: {
        id: 'user_14',
        username: 'balanced',
        displayName: 'Balanced View',
        avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=balanced'
      },
      createdAt: '2023-09-23T13:30:00Z',
      voteCount: 6,
      userVote: null,
      parentId: `comment_${postId}_3`,
      depth: 1,
      childCount: 0
    }
  ];
  
  return [...rootComments, ...replies];
};

// GET handler for comments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const postId = params.id;
  const searchParams = request.nextUrl.searchParams;
  const sort = searchParams.get('sort') || 'top';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 900));
  
  // Generate mock comments for this post
  const comments = generateMockComments(postId);
  
  // Sort comments based on sort parameter
  let sortedComments = [...comments];
  if (sort === 'top') {
    sortedComments.sort((a, b) => b.voteCount - a.voteCount);
  } else if (sort === 'new') {
    sortedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sort === 'controversial') {
    // For demo purposes, just use a simple sorting
    sortedComments.sort((a, b) => a.voteCount - b.voteCount);
  }
  
  // Apply pagination
  const paginatedComments = sortedComments.slice(offset, offset + limit);
  
  return NextResponse.json({
    data: {
      comments: paginatedComments,
      pagination: {
        total: comments.length,
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

// POST handler for creating a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const postId = params.id;
  const data = await request.json();
  const commentData = data.data;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create a new comment
  const newComment = {
    id: `comment_${postId}_new_${Math.random().toString(36).substring(2, 10)}`,
    content: commentData.content,
    author: {
      id: 'user_current',
      username: 'currentuser',
      displayName: 'Current User',
      avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=currentuser'
    },
    createdAt: new Date().toISOString(),
    voteCount: 1,
    userVote: 'up',
    parentId: commentData.parentId,
    depth: commentData.parentId ? 1 : 0, // Simplified for demo
    childCount: 0
  };
  
  return NextResponse.json({
    data: {
      comment: newComment,
      pointsAwarded: 5
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 15)
    }
  });
}
