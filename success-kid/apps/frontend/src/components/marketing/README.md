# Marketing Components

This directory contains all components used for the Success Kid marketing and public-facing pages.

## Directory Structure

The marketing components are organized into the following subdirectories:

- [`shared/`](./shared/README.md) - Reusable components shared across multiple marketing pages
- [`landing/`](./landing/README.md) - Components specific to the landing/home page
- [`about/`](./about/README.md) - Components specific to the about page
- [`community/`](./community/README.md) - Components specific to the community page
- [`faq/`](./faq/README.md) - Components specific to the FAQ page

## Usage

All components are exported through the index.ts file, so you can import them directly from the marketing directory:

```tsx
import { 
  // Shared components
  SuccessKidLogo, 
  StaggeredTitle,
  AnimatedPointsBadge,
  
  // Landing page components
  HeroSection,
  HeroBackground,
  PointsSystemDemo
} from '@/components/marketing';
```

## Design Guidelines

When creating or modifying marketing components, follow these guidelines:

1. **Consistent Branding**: Use the established color palette, typography, and design tokens
2. **Responsive Design**: Ensure all components work well on all device sizes
3. **Accessibility**: Implement proper accessibility features (ARIA attributes, keyboard navigation, etc.)
4. **Performance**: Optimize animations and effects for performance
5. **Reusability**: Extract common patterns into shared components
6. **Motion Sensitivity**: Respect user preferences for reduced motion

## Core Brand Elements

- **Primary Color**: Victory Blue (#1E88E5)
- **Secondary Color**: Sand Gold (#FFC107)
- **Accent Color**: Success Green (#4CAF50)
- **Alert Color**: Action Red (#F44336)
- **Display Font**: Montserrat
- **Body Font**: Inter
- **Animations**: Use standard ease curves defined in theme tokens

## Component Development Workflow

1. Identify if the component is page-specific or shared
2. Place it in the appropriate directory
3. Implement with appropriate props for customization
4. Add TypeScript interfaces and prop documentation
5. Include responsive design and accessibility features
6. Export it through the nearest index.ts file
7. Update component documentation

## Naming Conventions

- Component files: PascalCase.tsx (e.g., `HeroSection.tsx`)
- Component names: PascalCase (e.g., `export function HeroSection()`)
- Props interfaces: ComponentNameProps (e.g., `export interface HeroSectionProps`)
- CSS classes: Use Tailwind utility classes following BEM-like naming for custom classes

## Example Component Template

```tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface ExampleComponentProps {
  title: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'alternative';
}

export function ExampleComponent({
  title,
  description,
  className = '',
  variant = 'default'
}: ExampleComponentProps) {
  return (
    <section className={`py-8 ${variant === 'alternative' ? 'bg-gray-50' : 'bg-white'} ${className}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
    </section>
  );
}

export default ExampleComponent;
```
