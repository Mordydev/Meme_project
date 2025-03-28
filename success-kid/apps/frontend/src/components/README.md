# Success Kid Platform Component Structure

This directory contains all components for the Success Kid Platform. The components are organized into a clear structure to ensure maintainability and organization.

## Directory Structure

- **`/ui`**: Generic UI components that can be used throughout the application (buttons, cards, inputs)
- **`/features`**: Feature-specific components organized by domain
  - `/achievements`: Components related to user achievements
  - `/activity-feed`: Components for displaying user activity
  - `/community`: Components for community interaction and forums
  - `/competitions`: Components for platform competitions
  - `/content-creation`: Components for creating and editing content
  - `/dashboard`: Dashboard-specific components (welcome header, points summary, etc.)
  - `/leaderboard`: Components for displaying user rankings and leaderboards
  - `/market`: Components for market data, tokens, and transactions
  - `/messaging`: Components for user-to-user messaging
  - `/notifications`: Components for system notifications
  - `/points`: Components for points display, tracking, and management
  - `/profile`: Components for user profiles
  - `/real-time`: Components for real-time updates and WebSocket handling
  - `/redemption`: Components for points redemption
  - `/referral`: Components for the referral system
  - `/search`: Components for search functionality
  - `/user`: Components for user management, settings, and preferences
- **`/layout`**: Layout components (containers, headers, footers, navigation)
- **`/animations`**: Animation components and utilities
- **`/auth`**: Authentication-related components
- **`/error`**: Error handling and display components
- **`/marketing`**: Marketing and landing page components
- **`/mobile`**: Mobile-specific components and adaptations
- **`/monitoring`**: Components for monitoring and analytics
- **`/navigation`**: Navigation components (sidebar, topbar, etc.)
- **`/profile`**: Profile-related components
- **`/providers`**: Context providers and wrappers
- **`/rewards`**: Reward-related components
- **`/wallet`**: Wallet connection and management components

## Component Organization Guidelines

1. **Component Location**: Components should be placed in the directory that best describes their primary purpose
2. **Feature Organization**: Feature-specific components should be in their respective `/features` subdirectory
3. **Exports**: Feature directories should have an `index.ts` file that exports all components
4. **Common Structure**: Each component file should contain a single primary React component
5. **Naming Convention**: Use PascalCase for component names and files

## Usage Guidelines

Import components using the following patterns:

```tsx
// UI components
import { Button, Card } from '@/components/ui';

// Feature components
import { PointsDisplay, PointsCounter } from '@/components/features/points';
// or using the features barrel export
import { PointsDisplay, PointsCounter } from '@/components/features';

// Layout components
import { DashboardLayout } from '@/components/layout';
```
