# Shared Marketing Components

This directory contains reusable components that are shared across multiple marketing pages in the Success Kid platform.

## Components Overview

### `SuccessKidLogo`
A versatile logo component that displays the Success Kid logo with various styling and animation options.

**Features:**
- Multiple variants: default, outline, minimal, glow
- Color options: primary, secondary, accent, white
- Configurable size
- Optional animations with fist pumping effect
- Reduced motion support

### `StaggeredTitle`
A dynamic title component that supports staggered word animations, typewriter effects, and highlighted text.

**Features:**
- Multiple animation types: fade, slide, scale
- Typewriter effect option
- Gradient text support
- Highlighted secondary text
- Customizable delays and speeds
- Reduced motion support

### `AnimatedPointsBadge`
Badge component that displays point rewards with various animation effects.

**Features:**
- Multiple size options: sm, md, lg
- Various variants: default, outline, filled, minimal
- Animation options: drop, scale, slide
- Customizable icons and colors
- Reduced motion support

### `SEO`
Component for handling SEO metadata and structured data.

**Features:**
- Structured data support (JSON-LD)
- Meta tag management
- Title and description optimization

### Additional Components
- `feature-card` - Reusable feature highlight card
- `testimonial-card` - Customer testimonial display component

## Usage Examples

### SuccessKidLogo

```tsx
import { SuccessKidLogo } from '@/components/marketing';

export default function BrandHeader() {
  return (
    <header>
      <SuccessKidLogo 
        size={80} 
        variant="glow" 
        color="primary" 
        animated={true} 
      />
      <h1>Success Kid Platform</h1>
    </header>
  );
}
```

### StaggeredTitle

```tsx
import { StaggeredTitle } from '@/components/marketing';

export default function PageHeader() {
  return (
    <div className="text-center my-12">
      <StaggeredTitle
        text="Clench Your Fist"
        highlightedText="Claim Your Success"
        as="h1"
        animation="slide"
        align="center"
        gradient={true}
        gradientFrom="from-primary" 
        gradientTo="to-secondary"
        className="text-4xl font-bold"
      />
    </div>
  );
}
```

### AnimatedPointsBadge

```tsx
import { AnimatedPointsBadge } from '@/components/marketing';

export default function RewardsSection() {
  return (
    <div className="space-y-4">
      <h2>Earn Points for Activities</h2>
      <div className="flex flex-wrap gap-2">
        <AnimatedPointsBadge 
          label="Create Content" 
          points={50} 
          icon="📝"
          variant="filled" 
          size="md"
          animation="drop"
          delay={0.1}
        />
        <AnimatedPointsBadge 
          label="Leave Comments" 
          points={10} 
          icon="💬"
          variant="outline" 
          size="md"
          animation="drop"
          delay={0.2}
        />
        <AnimatedPointsBadge 
          label="Daily Login" 
          points={20} 
          icon="✅"
          variant="default" 
          size="md"
          animation="drop"
          delay={0.3}
        />
      </div>
    </div>
  );
}
```
