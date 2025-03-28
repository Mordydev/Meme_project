import { NextResponse } from 'next/server';

// Mock categories data
const categories = [
  {
    id: 'general',
    name: 'General Discussion',
    description: 'Talk about anything related to Success Kid',
    icon: 'chat-bubble',
    postCount: 120
  },
  {
    id: 'token',
    name: 'Token Talk',
    description: 'Discuss the SKC token and crypto topics',
    icon: 'coin',
    postCount: 85
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'Official updates and announcements from the team',
    icon: 'megaphone',
    postCount: 42
  },
  {
    id: 'feedback',
    name: 'Feedback & Ideas',
    description: 'Share your thoughts and suggestions',
    icon: 'question',
    postCount: 67
  },
  {
    id: 'help',
    name: 'Help & Support',
    description: 'Get assistance with any platform issues',
    icon: 'hand',
    postCount: 53
  },
  {
    id: 'introductions',
    name: 'Introductions',
    description: 'Introduce yourself to the community',
    icon: 'user',
    postCount: 98,
    parentId: 'general'
  },
  {
    id: 'technical',
    name: 'Technical Discussion',
    description: 'Deep dive into the technical aspects',
    icon: 'code',
    postCount: 31,
    parentId: 'token'
  }
];

// GET handler for categories
export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json({
    data: {
      categories
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 15)
    }
  });
}
