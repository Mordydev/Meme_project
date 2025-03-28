import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Get user's points earning trends
 */
export async function GET(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || 'week';
  
  // Generate realistic trend data
  const today = new Date();
  const dailyEarnings = [];
  const categoryTotals = {
    'content_creation': 0,
    'engagement': 0,
    'daily_login': 0,
    'achievement': 0,
    'referral': 0
  };
  
  // Generate data based on the requested period
  let daysToGenerate = 7; // default to week
  if (period === 'month') daysToGenerate = 30;
  if (period === 'year') daysToGenerate = 365;
  
  for (let i = daysToGenerate - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate random but somewhat realistic points distribution
    const contentPoints = Math.floor(Math.random() * 60) + 10;
    const engagementPoints = Math.floor(Math.random() * 40) + 5;
    const loginPoints = 20; // constant daily login points
    const achievementPoints = i % 7 === 0 ? 100 : 0; // achievement every week
    const referralPoints = i % 15 === 0 ? 250 : 0; // referral every 15 days
    
    const breakdown = {
      'content_creation': contentPoints,
      'engagement': engagementPoints,
      'daily_login': loginPoints,
      'achievement': achievementPoints,
      'referral': referralPoints
    };
    
    // Add to category totals
    Object.keys(breakdown).forEach(key => {
      categoryTotals[key] += breakdown[key];
    });
    
    dailyEarnings.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      amount: contentPoints + engagementPoints + loginPoints + achievementPoints + referralPoints,
      breakdown
    });
  }
  
  return Response.json({
    data: {
      dailyEarnings,
      categoryTotals
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
