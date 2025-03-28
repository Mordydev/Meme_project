# Feature Components

This directory contains all feature-specific components for the Success Kid platform. Components are organized by feature domain, following the principles outlined in the Dashboard Implementation Guide.

## Feature Directory Structure

Each feature subdirectory contains components relevant to that specific feature domain:

- **`/achievements`**: Achievement system, badges, and progress tracking
- **`/activity-feed`**: Real-time activity feed and user activity display
- **`/community`**: Forum, content sharing, and community interaction
- **`/competitions`**: User competitions, challenges, and contests
- **`/content-creation`**: Content creation tools, editors, and publishing
- **`/dashboard`**: Dashboard-specific components (welcome header, points summary, etc.)
- **`/leaderboard`**: Leaderboards and user rankings
- **`/market`**: Token market data, price charts, and transaction feed
- **`/messaging`**: User-to-user messaging system
- **`/notifications`**: System notifications and real-time alerts
- **`/points`**: Points display, tracking, and management
- **`/profile`**: User profile components
- **`/real-time`**: WebSocket connections and real-time updates
- **`/redemption`**: Points redemption process and tracking
- **`/referral`**: Referral system and tracking
- **`/search`**: Search functionality and discovery
- **`/user`**: User settings, preferences, and management

## Component Organization Guidelines

1. **Feature-First Organization**: Components are grouped by feature rather than UI type
2. **Subdirectory Structure**: Complex features may have their own subdirectory structure
3. **Index Exports**: Each feature directory has an `index.ts` file that exports all components
4. **Composability**: Components should be composable and follow the design system
5. **Self-Contained**: Feature components should be self-contained with minimal dependencies

## Importing Feature Components

There are two ways to import feature components:

```tsx
// Import directly from feature directory (preferred for clarity)
import { PointsDisplay, PointsCounter } from '@/components/features/points';

// Import from features barrel export (convenient but less explicit)
import { PointsDisplay, PointsCounter } from '@/components/features';
```

For components used across multiple pages, the direct import is recommended for clarity. For one-off components, either approach is acceptable.

## Adding New Components

When adding new components:

1. Place the component in the appropriate feature directory
2. Export the component from the feature's `index.ts` file
3. Follow the established naming and file structure patterns
4. Add proper documentation with JSDoc comments
5. Ensure compatibility with the design system

## Cross-Feature Components

Some components may be relevant to multiple features. In these cases:

1. Place the component in the most relevant feature directory
2. Consider extracting generic functionality to UI components if appropriate
3. Document cross-feature usage in component comments
