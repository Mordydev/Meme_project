# Landing Page Components

This directory contains components specifically designed for the Success Kid marketing landing page.

## Components Overview

### `HeroSection`
The primary hero section for the landing page with animated elements, call-to-action buttons, and visual effects.

**Features:**
- Animated fist icon with success rays
- Floating coins animation
- Responsive layout for all devices
- Customizable content through props
- Configurable elements (metrics, animations, etc.)

### `HeroBackground`
A versatile background component with animated gradients, blobs, and particle effects.

**Features:**
- Multiple color scheme options (primary, secondary, accent, gradient)
- Density control for particle effects
- Reduced motion support
- Configurable animation settings

### `PointsSystemDemo`
An interactive demo showcasing the Success Points system with animations and real-time updates.

**Features:**
- Simulated points accumulation
- Activity log display
- Progress tracking towards redemption
- Celebration animation upon reaching threshold
- Light/dark mode support

### Additional Components
- `CallToAction` - Primary CTA section with enhanced animations
- `SecondaryCTA` - Secondary call-to-action components
- `CommunityFeature` - Showcase of community features
- `WalletFeature` - Wallet integration demonstration
- `PointsSystemFeature` - Detailed explanation of points system
- `CommunityMetrics` - Visual display of community statistics
- `MarketMetrics` - Market data visualization
- `SocialProof` - Social proof elements and testimonials
- `FeatureSection` - Feature highlights with animations
- `RegistrationForm` - User registration form
- `LazySection` - Lazy-loaded sections for performance optimization

## Usage Example

```tsx
import { HeroSection, PointsSystemDemo, HeroBackground } from '@/components/marketing';

export default function LandingPage() {
  return (
    <div>
      <HeroSection 
        title="Main Title|Highlighted Part"
        subtitle="Compelling subtitle text here."
        ctaText="Get Started"
        ctaLink="/sign-up"
        secondaryCtaText="Learn More"
        secondaryCtaLink="/about"
        showFistIcon={true}
        showFloatingCoins={true}
        showMetrics={true}
      />
      
      <div className="container mx-auto">
        <PointsSystemDemo 
          className="max-w-md mx-auto"
          initialPoints={15}
          pointsInterval={5000}
          pointsIncrement={10}
          showActivities={true}
        />
      </div>
    </div>
  );
}
```
