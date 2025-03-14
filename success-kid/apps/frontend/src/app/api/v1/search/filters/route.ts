import { NextRequest, NextResponse } from 'next/server';
import { FilterGroup } from '@/types';

/**
 * Search filters API endpoint
 * This is a mock implementation that returns static data
 * In a real implementation, this would be based on dynamic data
 */
export async function GET(request: NextRequest) {
  // Mock available filters
  const filters: FilterGroup[] = [
    {
      id: 'category',
      label: 'Category',
      type: 'multiselect',
      options: [
        { value: 'general', label: 'General' },
        { value: 'announcements', label: 'Announcements' },
        { value: 'tokenomics', label: 'Tokenomics' },
        { value: 'memes', label: 'Memes & Fun' },
        { value: 'tech', label: 'Technology' }
      ],
    },
    {
      id: 'timeframe',
      label: 'Time Frame',
      type: 'select',
      options: [
        { value: 'day', label: 'Last 24 Hours' },
        { value: 'week', label: 'Last 7 Days' },
        { value: 'month', label: 'Last 30 Days' },
        { value: 'year', label: 'Last Year' },
        { value: 'all', label: 'All Time' }
      ],
    },
    {
      id: 'contentLength',
      label: 'Content Length',
      type: 'select',
      options: [
        { value: 'short', label: 'Short' },
        { value: 'medium', label: 'Medium' },
        { value: 'long', label: 'Long' }
      ],
    },
    {
      id: 'engagement',
      label: 'Engagement',
      type: 'range',
      range: { min: 0, max: 100 },
    },
  ];
  
  return NextResponse.json({ filters }, { status: 200 });
}
