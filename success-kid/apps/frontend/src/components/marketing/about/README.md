# About Page Components

This directory contains components specifically designed for the Success Kid marketing about page. This directory is prepared for future components that will be created specifically for the about page.

## Future Components

Components that could be added to this directory in the future:

- `MissionSection` - To showcase the platform's mission and values
- `TeamSection` - To highlight the team behind the project
- `TimelineSection` - To display the project's roadmap and history
- `VisionSection` - To articulate the long-term vision
- `TokenomicsOverview` - For a simplified tokenomics explanation
- `TechnologyStack` - To showcase the technology behind the platform
- `RoadmapVisual` - Interactive roadmap visualization

Currently, the about page is implemented directly in the route file at `/app/(marketing)/about/page.tsx`. As the page grows in complexity, components should be extracted and placed in this directory.

## Implementation Guide

When creating components for the about page, follow these guidelines:

1. Create components with clear, specific purposes
2. Leverage shared components from the `shared` directory for consistency
3. Implement responsive designs that work on all device sizes
4. Maintain the brand voice and design language
5. Ensure accessibility for all users
6. Document props and usage examples

Example component structure:

```tsx
// components/marketing/about/MissionSection.tsx
'use client';

import { motion } from 'framer-motion';
import { StaggeredTitle } from '@/components/marketing';

export interface MissionSectionProps {
  className?: string;
}

export function MissionSection({ className = '' }: MissionSectionProps) {
  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="container mx-auto px-4">
        <StaggeredTitle
          text="Our Mission"
          as="h2"
          className="text-3xl font-bold mb-6 text-center"
        />
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-lg text-center max-w-3xl mx-auto"
        >
          To harness the positive energy and recognition of the Success Kid meme 
          to build a vibrant ecosystem where crypto enthusiasts and meme lovers 
          connect, engage, and create value together.
        </motion.p>
      </div>
    </section>
  );
}
```
