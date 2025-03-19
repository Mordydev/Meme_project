# Community Page Components

This directory contains components specifically designed for the Success Kid marketing community page. This directory is prepared for future components that will be created specifically for the community page.

## Future Components

Components that could be added to this directory in the future:

- `CommunityStats` - To showcase community metrics and growth statistics
- `CommunityChannels` - To display available communication channels
- `FeaturedMembers` - To highlight active community members
- `EventsCalendar` - To display upcoming community events
- `ActivityFeed` - To show recent community activities
- `JoinCommunity` - CTA section to join the community
- `TestimonialCarousel` - For rotating member testimonials

Currently, the community page is implemented directly in the route file at `/app/(marketing)/community/page.tsx`. As the page grows in complexity, components should be extracted and placed in this directory.

## Implementation Guide

When creating components for the community page, follow these guidelines:

1. Prioritize real-time or near real-time data where possible
2. Create components that can be easily updated with current stats
3. Design for social proof and community engagement
4. Implement smooth animations for engagement metrics
5. Ensure responsive layouts for all device sizes
6. Maintain accessibility for all users

Example component structure:

```tsx
// components/marketing/community/CommunityStats.tsx
'use client';

import { motion } from 'framer-motion';

export interface CommunityStatsProps {
  stats: {
    label: string;
    value: string;
  }[];
  className?: string;
}

export function CommunityStats({ stats, className = '' }: CommunityStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}
    >
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
          <motion.p 
            className="text-4xl font-bold text-primary mb-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            {stat.value}
          </motion.p>
          <p className="text-gray-600">{stat.label}</p>
        </div>
      ))}
    </motion.div>
  );
}
```

## Usage Example

```tsx
import { CommunityStats } from '@/components/marketing/community';

export default function CommunityPage() {
  // This could come from an API in a real implementation
  const communityStats = [
    { label: 'Active Members', value: '50,000+' },
    { label: 'Daily Posts', value: '350+' },
    { label: 'SP Awarded', value: '2.8M+' },
    { label: 'Countries', value: '120+' },
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12">Our Community</h1>
        <CommunityStats stats={communityStats} className="mb-16" />
        {/* Other community components */}
      </div>
    </div>
  );
}
```
