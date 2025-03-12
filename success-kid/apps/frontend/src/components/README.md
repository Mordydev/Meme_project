# Success Kid Component System

This document provides guidelines for using and extending the component system.

## Component Structure

Our component system is organized into a hierarchy based on purpose and specificity:

```
components/
├── ui/                      # Generic UI components
│   ├── button.tsx           # Button component
│   ├── card.tsx             # Card component
│   └── index.ts             # UI component exports
├── features/                # Feature-specific components
│   ├── points/              # Points feature components
│   │   ├── PointsDisplay.tsx  # Points display component
│   │   └── index.ts         # Points component exports
│   └── auth/                # Auth feature components
│       ├── UserProfile.tsx  # User profile component
│       └── index.ts         # Auth component exports
├── layout/                  # Layout components
│   ├── PageLayout.tsx       # Page layout component
│   ├── dashboard-header.tsx # Dashboard header component
│   └── index.ts             # Layout component exports
└── index.ts                 # Main component exports
```

## Component Categories

### 1. Foundation Components (UI)

Generic, reusable UI components without business logic:

- Located in `components/ui/`
- Examples: Button, Card, Input, Dialog
- Follow the shadcn/ui pattern with consistent props and styling
- Highly reusable across the entire application

### 2. Feature Components

Components specific to a business feature:

- Located in `components/features/{feature-name}/`
- Examples: PointsDisplay, UserProfile, MarketChart
- May contain feature-specific business logic
- Use Foundation Components as building blocks

### 3. Layout Components

Components that structure and organize the application layout:

- Located in `components/layout/`
- Examples: PageLayout, DashboardHeader, Sidebar
- Handle responsive behavior and positioning
- Provide consistent structure across pages

## Component Development Guidelines

### Naming Conventions

- **Component Files**: PascalCase (e.g., `ButtonGroup.tsx`, `PointsDisplay.tsx`)
- **Component Names**: PascalCase (e.g., `ButtonGroup`, `PointsDisplay`)
- **Props Interfaces**: PascalCase with Props suffix (e.g., `ButtonProps`, `PointsDisplayProps`)
- **Hooks**: camelCase with `use` prefix (e.g., `usePoints`, `useWalletConnection`)

### Creating New Components

1. Identify the appropriate category for your component
2. Create a new file in the corresponding directory
3. Follow the established pattern for that category
4. Export the component in the appropriate index.ts file
5. Document component props and usage

### Component Documentation

All components should include:

- JSDoc comment describing the component purpose
- Documented props with descriptions
- Example usage in code comments
- Accessibility considerations

Example:

```tsx
/**
 * ButtonGroup - A container for grouping related buttons
 * 
 * @example
 * <ButtonGroup>
 *   <Button variant="primary">Save</Button>
 *   <Button variant="outline">Cancel</Button>
 * </ButtonGroup>
 */
export function ButtonGroup({ 
  children, 
  className 
}: ButtonGroupProps) {
  // Component implementation
}
```

### Styling Guidelines

- Use Tailwind CSS for styling
- Utilize `cn()` utility for combining classNames
- Follow mobile-first approach
- Use design tokens via CSS variables
- Implement dark mode support

### Accessibility Guidelines

- Ensure keyboard navigation support
- Use appropriate ARIA attributes
- Maintain color contrast ratio of at least 4.5:1
- Support screen readers
- Handle focus management properly

## Using Components

Import components from their dedicated directories or use the main index:

```tsx
// Recommended: Import from specific category
import { Button } from '@/components/ui';
import { PointsDisplay } from '@/components/features/points';

// Alternative: Import from main index
import { Button, PointsDisplay } from '@/components';
```

## Creating Variants

For components that need variants:

1. Use the `cva` utility from `class-variance-authority`
2. Define variants in a constant outside the component
3. Use TypeScript to ensure type safety for variants

Example:

```tsx
const alertVariants = cva("rounded-md p-4", {
  variants: {
    variant: {
      default: "bg-primary/20 text-primary",
      error: "bg-alert/20 text-alert",
      warning: "bg-secondary/20 text-secondary",
      success: "bg-accent/20 text-accent",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof alertVariants> {
  // Additional props
}
```
