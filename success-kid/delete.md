# Implementation Plan: Landing Page Enhancement & UI Improvements

## Task 1: Improve and Finalize the Landing Page

### Task Overview
- **Purpose:** Enhance the visual appeal and user experience of the landing page
- **Value:** Create a stronger first impression that aligns with the Success Kid brand identity
- **Dependencies:** Existing landing page components and styling
- **Complexity Estimate:** Moderate
- **Priority:** Critical

### Required Knowledge
- **Key Documents:** Design System & Flow Architecture, Frontend Guidelines
- **Technical Components:** Framer Motion, Tailwind CSS, React components
- **Domain Knowledge:** Brand identity, user experience principles

### Sub-Task 1.1: Enhance Header with Premium Glass Effect
**Goal:** Create a more impressive glass effect header with subtle glow and animation

**Details:**
- Update the `MarketingHeader` component with an enhanced glass effect
- Add a subtle animated glow effect along the bottom border
- Implement an elegant hover effect for navigation items
- Add depth and dimension with subtle shadows

**Key Requirements:**
- Create a frosted glass effect with improved backdrop-blur
- Add animated gradient border that activates on scroll
- Ensure the header transitions smoothly between states
- Maintain accessibility and readability on all backgrounds

**Implementation Notes:**
```tsx
// Update MarketingHeader.tsx
// Enhance the glass-effect class

// Add to the header component:
<header 
  className={`sticky top-0 z-40 w-full transition-all duration-500 relative ${
    isScrolled 
      ? 'enhanced-glass-effect dark:border-b dark:border-gray-800/50' 
      : 'bg-transparent dark:bg-transparent'
  }`}
>
  {/* Enhanced glowing border effect when scrolled */}
  <motion.div 
    className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary-400/80 to-transparent"
    style={{ 
      boxShadow: '0 1px 15px 1px rgba(30, 136, 229, 0.45)',
      filter: 'drop-shadow(0 1px 3px rgba(30, 136, 229, 0.5))'
    }}
    initial={{ opacity: 0, width: '0%', left: '50%' }}
    animate={{ 
      opacity: isScrolled ? 1 : 0, 
      width: isScrolled ? '100%' : '0%', 
      left: isScrolled ? '0%' : '50%' 
    }}
    transition={{ 
      duration: 0.7, 
      ease: [0.19, 1.0, 0.22, 1.0] 
    }}
  />
  
  {/* Add subtle animated gradient background */}
  <motion.div 
    className="absolute inset-0 bg-gradient-to-r from-white/60 to-primary-50/10 dark:from-gray-900/60 dark:to-gray-800/10 -z-10"
    animate={{
      backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
    }}
    transition={{
      duration: 15,
      repeat: Infinity,
      ease: "linear"
    }}
    style={{
      backgroundSize: '200% 100%',
    }}
  />
  
  {/* Rest of header content */}
</header>

// Add the enhanced-glass-effect to globals.css:
.enhanced-glass-effect {
  @apply backdrop-blur-md bg-white/70 dark:bg-gray-900/70;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Sub-Task 1.2: Create a Premium Footer with Glass Effect
**Goal:** Develop a visually consistent footer with glass effect matching the header

**Details:**
- Update the `MarketingFooter` component with enhanced glass effect
- Add subtle animated elements and improved gradient borders
- Create section separators with glowing effects
- Improve hover animations for links

**Key Requirements:**
- Implement consistent glass effect matching the header
- Add subtle animated gradient border along the top
- Enhance visual separation between footer sections
- Improve hover animations for all interactive elements

**Implementation Notes:**
```tsx
// In globals.css, add:
.footer-glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.05);
}

.dark .footer-glass-effect {
  background: rgba(17, 24, 39, 0.7);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

// Update MarketingFooter.tsx:
<footer className="relative overflow-hidden footer-glass-effect">
  {/* Enhanced glowing border effect at the top */}
  <motion.div 
    className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary-400/80 to-transparent"
    style={{ 
      boxShadow: '0 -1px 15px 1px rgba(30, 136, 229, 0.45)',
      filter: 'drop-shadow(0 -1px 3px rgba(30, 136, 229, 0.5))'
    }}
    initial={{ opacity: 0.5, width: '60%', left: '20%' }}
    animate={{ 
      opacity: [0.5, 1, 0.5], 
      width: ['60%', '90%', '60%'], 
      left: ['20%', '5%', '20%']
    }}
    transition={{ 
      duration: 6, 
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }}
  />
  
  {/* Add subtle animated gradient background */}
  <motion.div 
    className="absolute inset-0 bg-gradient-to-b from-white/60 to-primary-50/10 dark:from-gray-900/60 dark:to-gray-800/10 -z-10"
    animate={{
      backgroundPosition: ['0% 0%', '0% 100%', '0% 0%'],
    }}
    transition={{
      duration: 20,
      repeat: Infinity,
      ease: "linear"
    }}
    style={{
      backgroundSize: '100% 200%',
    }}
  />
  
  {/* Rest of footer content */}
</footer>
```

### Sub-Task 1.3: Improve Hero Section Animation and Effects
**Goal:** Enhance the hero section with more impressive animations and visual effects

**Details:**
- Add particle effects to the background
- Improve the animation sequence of hero elements
- Create a more dynamic staggered entrance for content
- Add subtle motion effects to background elements

**Key Requirements:**
- Create floating particles with glowing effects
- Implement staggered animation sequence for content elements
- Add subtle background movement effects
- Ensure animations perform well on all devices

**Implementation Notes:**
```tsx
// Add to the Hero section in page.tsx:

{/* Animated floating particles */}
<div className="absolute inset-0 pointer-events-none overflow-hidden">
  {Array.from({ length: 20 }).map((_, i) => (
    <motion.div
      key={`particle-${i}`}
      className="absolute rounded-full bg-primary/10"
      style={{
        width: 4 + (Math.random() * 6),
        height: 4 + (Math.random() * 6),
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -30 * (Math.random() + 0.5), 0],
        x: [0, 15 * (Math.random() - 0.5), 0],
        opacity: [0, 0.7, 0],
        scale: [1, 1.5, 1],
      }}
      transition={{
        duration: 8 + (Math.random() * 8),
        repeat: Infinity,
        delay: i * 0.5,
      }}
    />
  ))}
</div>

{/* Enhanced background effect */}
<motion.div
  className="absolute inset-0 bg-gradient-radial from-primary-50/30 to-transparent"
  style={{
    backgroundSize: '120% 120%',
    backgroundPosition: 'center',
  }}
  animate={{
    scale: [1, 1.05, 1],
    opacity: [0.3, 0.5, 0.3],
    backgroundPosition: ['center', '45% 45%', 'center'],
  }}
  transition={{
    duration: 10,
    repeat: Infinity,
    repeatType: 'reverse',
  }}
/>

// Update the staggered title component:
<StaggeredTitle
  text="Clench Your Fist,"
  highlightedText="Claim Your Success!"
  className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl"
  delay={0.2}
  useTypewriter={true}
  glowEffect={true} // Add a new prop for glow effect
/>

// Update StaggeredTitle component to support glow effect:
{glowEffect && (
  <motion.span
    className="absolute inset-0 bg-primary-50/30 blur-xl rounded-lg"
    animate={{
      opacity: [0.3, 0.7, 0.3],
      scale: [0.95, 1.05, 0.95],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      repeatType: 'reverse',
    }}
  />
)}
```

### Sub-Task 1.4: Enhance Call-to-Action Buttons
**Goal:** Create more visually impressive CTA buttons that attract attention

**Details:**
- Implement enhanced button styles with improved glow and animation
- Add animated gradients and shine effects
- Create hover states that feel interactive and engaging
- Ensure buttons stand out visually while maintaining accessibility

**Key Requirements:**
- Create buttons with prominent glowing effects
- Add animated gradient borders or backgrounds
- Implement subtle motion effects on hover
- Maintain clear visual hierarchy for primary and secondary CTAs

**Implementation Notes:**
```tsx
// Create a new component: EnhancedCTA.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GlowingEffect } from './glowing-effect';

interface EnhancedCTAProps {
  children: React.ReactNode;
  href: string;
  primary?: boolean;
  className?: string;
}

export function EnhancedCTA({
  children,
  href,
  primary = true,
  className = '',
}: EnhancedCTAProps) {
  return (
    <GlowingEffect
      color={primary ? 'primary' : 'secondary'}
      size="lg"
      intensity="strong"
      pulseEffect={true}
      className={className}
    >
      <Link href={href}>
        <motion.div
          className={`relative overflow-hidden rounded-md ${
            primary
              ? 'bg-primary text-white'
              : 'bg-white/20 backdrop-blur-sm border border-white/30 text-gray-900 dark:text-white'
          } py-3 px-6 font-medium`}
          whileHover={{ 
            scale: 1.05, 
            y: -2,
            transition: { 
              type: "spring", 
              stiffness: 400, 
              damping: 10 
            }
          }}
          whileTap={{ scale: 0.98 }}
        >
          {primary && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary-400/0 via-white/30 to-primary-400/0"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
            />
          )}
          <span className="relative z-10 flex items-center">
            {children}
          </span>
        </motion.div>
      </Link>
    </GlowingEffect>
  );
}

// Use in the Hero section:
<div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
  <EnhancedCTA href="/sign-up" primary={true}>
    Start Earning Now
  </EnhancedCTA>
  <EnhancedCTA href="/#how-it-works" primary={false}>
    <span>See How It Works</span>
    <motion.span 
      className="ml-2 inline-block"
      animate={{ x: [0, 5, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
    >
      →
    </motion.span>
  </EnhancedCTA>
</div>
```

### Sub-Task 1.5: Add Advanced Background Effects
**Goal:** Create sophisticated background effects that enhance the overall visual appeal

**Details:**
- Implement subtle animated gradients in the background
- Add responsive motion patterns that react to scrolling
- Create depth with layered background elements
- Ensure effects don't distract from content

**Key Requirements:**
- Develop subtle animated gradient backgrounds
- Create parallax scrolling effects for depth
- Add subtle particle or pattern elements
- Optimize for performance across devices

**Implementation Notes:**
```tsx
// Create a new component: AnimatedBackground.tsx
'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface AnimatedBackgroundProps {
  className?: string;
}

export function AnimatedBackground({ className = '' }: AnimatedBackgroundProps) {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 100]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Gradient blob 1 */}
      <motion.div
        className="absolute -top-[30%] -right-[20%] w-[80%] h-[80%] rounded-full bg-gradient-radial from-primary-100/20 to-transparent"
        style={{ y: y1, opacity }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
      
      {/* Gradient blob 2 */}
      <motion.div
        className="absolute -bottom-[30%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-radial from-secondary-100/15 to-transparent"
        style={{ y: y2, opacity }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 2,
        }}
      />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]" 
        style={{
          backgroundImage: 'linear-gradient(to right, #1E88E5 1px, transparent 1px), linear-gradient(to bottom, #1E88E5 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`bg-particle-${i}`}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: 3 + (Math.random() * 4),
            height: 3 + (Math.random() * 4),
            left: `${10 + (Math.random() * 80)}%`,
            top: `${10 + (Math.random() * 80)}%`,
            opacity: 0.2,
          }}
          animate={{
            y: [0, -40 * Math.random(), 0],
            x: [0, 40 * (Math.random() - 0.5), 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 10 + (Math.random() * 10),
            repeat: Infinity,
            delay: i * 0.6,
          }}
        />
      ))}
    </div>
  );
}

// Add to the main section:
<section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
  <AnimatedBackground className="z-0" />
  {/* Existing content */}
</section>
```

## Task 2: Improve Component Borders, Effects, and Buttons

### Task Overview
- **Purpose:** Enhance the visual quality of UI elements with improved borders, effects, and button styling
- **Value:** Create a more premium and polished look and feel throughout the application
- **Dependencies:** Existing UI components and styling
- **Complexity Estimate:** Moderate
- **Priority:** High

### Required Knowledge
- **Key Documents:** Design System & Flow Architecture, Frontend Guidelines
- **Technical Components:** Tailwind CSS, Framer Motion, CSS effects
- **Domain Knowledge:** UI design principles, animation techniques

### Sub-Task 2.1: Create Enhanced Border Effects
**Goal:** Develop sophisticated border effects for cards and containers

**Details:**
- Implement animated gradient borders
- Add subtle glow effects to borders
- Create responsive border animations for hover states
- Ensure effects work well in both light and dark mode

**Key Requirements:**
- Create gradient borders with customizable colors
- Add subtle animation to gradient borders
- Implement glow effects that respond to interaction
- Maintain accessibility and performance

**Implementation Notes:**
```tsx
// Update GradientBorder.tsx with more sophisticated effects:
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  gradientFrom?: string;
  gradientVia?: string; // Add via color option
  gradientTo?: string;
  animate?: boolean;
  animationSpeed?: 'slow' | 'medium' | 'fast';
  borderRadius?: string;
  padding?: string;
  glowIntensity?: 'none' | 'light' | 'medium' | 'strong';
  glowColor?: string;
  interactiveGlow?: boolean;
}

export function EnhancedGradientBorder({
  children,
  className = '',
  borderWidth = 2,
  gradientFrom = 'from-primary',
  gradientVia = 'via-primary-300',
  gradientTo = 'to-secondary',
  animate = true,
  animationSpeed = 'medium',
  borderRadius = 'rounded-lg',
  padding = 'p-0.5',
  glowIntensity = 'medium',
  glowColor = 'rgba(30, 136, 229, 0.5)',
  interactiveGlow = true,
}: GradientBorderProps) {
  // Speed mapping
  const speedMapping = {
    slow: 15,
    medium: 8,
    fast: 4
  };
  
  // Glow intensity mapping
  const glowIntensityMapping = {
    none: '0px',
    light: '5px',
    medium: '10px',
    strong: '15px'
  };
  
  // Base animation props
  const animationProps = animate ? {
    animate: {
      backgroundPosition: ['0% 0%', '100% 100%'],
      boxShadow: [
        `0 0 0px ${glowColor}`,
        `0 0 ${glowIntensityMapping[glowIntensity]} ${glowColor}`,
        `0 0 ${parseInt(glowIntensityMapping[glowIntensity])/2}px ${glowColor}`,
        `0 0 ${parseInt(glowIntensityMapping[glowIntensity])*0.75}px ${glowColor}`,
        `0 0 0px ${glowColor}`
      ],
      transition: {
        backgroundPosition: {
          duration: speedMapping[animationSpeed],
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        },
        boxShadow: {
          duration: speedMapping[animationSpeed] / 2,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        },
      },
    },
  } : {};
  
  // Interactive hover props
  const hoverProps = interactiveGlow ? {
    whileHover: {
      boxShadow: `0 0 ${parseInt(glowIntensityMapping[glowIntensity])*1.5}px ${glowColor}`,
      scale: 1.02,
      transition: { 
        duration: 0.3, 
        type: 'spring', 
        stiffness: 400, 
        damping: 10 
      }
    }
  } : {};
  
  return (
    <motion.div
      className={cn(
        `relative ${padding} ${borderRadius} bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo}`,
        className
      )}
      style={{ backgroundSize: '200% 200%' }}
      {...animationProps}
      {...hoverProps}
    >
      <div className={`${borderRadius} bg-white dark:bg-gray-900 h-full w-full`}>
        {children}
      </div>
    </motion.div>
  );
}

// Usage example:
<EnhancedGradientBorder
  gradientFrom="from-primary-500"
  gradientVia="via-primary-300"
  gradientTo="to-secondary-500"
  animate={true}
  animationSpeed="medium"
  glowIntensity="medium"
  borderRadius="rounded-xl"
  className="w-full"
>
  <div className="p-6">
    <h3 className="text-xl font-bold">Card Title</h3>
    <p className="mt-2">Card content goes here...</p>
  </div>
</EnhancedGradientBorder>
```

### Sub-Task 2.2: Implement Advanced Button Styles
**Goal:** Create visually impressive buttons with enhanced styling and effects

**Details:**
- Develop a set of premium button styles with various effects
- Add shine, glow, and gradient effects to buttons
- Create responsive hover and active states
- Ensure buttons maintain accessibility standards

**Key Requirements:**
- Create buttons with customizable effects (shine, glow, gradient)
- Implement animated effects that respond to interaction
- Maintain clear visual affordance and accessibility
- Support various button sizes and variants

**Implementation Notes:**
```tsx
// Create a new component: PremiumButton.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PremiumButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  effects?: {
    shine?: boolean;
    glow?: boolean;
    pulse?: boolean;
    particles?: boolean;
  };
  gradientColors?: string;
}

export function PremiumButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  onClick,
  disabled = false,
  effects = {
    shine: true,
    glow: true,
    pulse: false,
    particles: false,
  },
  gradientColors,
}: PremiumButtonProps) {
  // Size classes
  const sizeClasses = {
    sm: "text-sm px-3 py-1.5 h-9",
    md: "text-base px-4 py-2 h-10",
    lg: "text-lg px-6 py-2.5 h-12",
    xl: "text-xl px-8 py-3 h-14"
  };
  
  // Variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return "bg-primary text-white hover:bg-primary-600 active:bg-primary-700";
      case 'secondary':
        return "bg-secondary text-black hover:bg-secondary-600 active:bg-secondary-700";
      case 'outline':
        return "border-2 border-primary bg-transparent text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20";
      case 'ghost':
        return "bg-transparent text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20";
      case 'glass':
        return "bg-white/30 backdrop-blur-md border border-white/30 text-gray-800 shadow-sm hover:bg-white/40 dark:bg-gray-800/30 dark:text-gray-200 dark:hover:bg-gray-800/40";
      case 'gradient':
        return `bg-gradient-to-r ${gradientColors || 'from-primary to-primary-600'} text-white hover:shadow-lg`;
      default:
        return "bg-primary text-white hover:bg-primary-600 active:bg-primary-700";
    }
  };
  
  // Base button classes
  const buttonClasses = cn(
    "relative inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none overflow-hidden",
    sizeClasses[size],
    getVariantClasses(),
    className
  );
  
  // Animation variants
  const contentVariants = {
    initial: {},
    hover: {}
  };
  
  // Button content with effects
  const content = (
    <>
      {/* Shine effect */}
      {effects.shine && (
        <motion.span 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: ['100%', '100%', '-100%'] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatType: 'loop',
            times: [0, 0.5, 0.5],
            repeatDelay: 5
          }}
          style={{ 
            willChange: 'transform',
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Glow effect */}
      {effects.glow && (
        <motion.span 
          className="absolute -inset-1 bg-primary/10 rounded-lg blur-md z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            repeatType: 'reverse' 
          }}
        />
      )}
      
      {/* Pulse effect */}
      {effects.pulse && (
        <motion.span 
          className="absolute inset-0 bg-primary/10 rounded-md z-0"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: 'reverse' 
          }}
        />
      )}
      
      {/* Button content */}
      <motion.span 
        className="relative z-10 flex items-center"
        variants={contentVariants}
        initial="initial"
        whileHover="hover"
      >
        {children}
        
        {/* Particle effects */}
        {effects.particles && (
          <span className="relative ml-2">
            →
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={`particle-${i}`}
                className="absolute top-1/2 -mt-0.5 left-full rounded-full bg-current"
                style={{
                  width: 3,
                  height: 3,
                }}
                animate={{
                  x: [0, 10 + i * 3],
                  y: [0, (i % 2 === 0 ? -3 : 3)],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  delay: i * 0.1,
                  repeatDelay: 1,
                }}
              />
            ))}
          </span>
        )}
      </motion.span>
    </>
  );
  
  // Button container with animations
  const buttonContainer = (
    <motion.div
      whileHover={{ 
        scale: 1.03, 
        y: -2,
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 10 
        }
      }}
      whileTap={{ scale: 0.97 }}
      className="relative"
    >
      {/* Render either button or link */}
      {href ? (
        <Link href={href} className={buttonClasses}>
          {content}
        </Link>
      ) : (
        <button
          className={buttonClasses}
          onClick={onClick}
          disabled={disabled}
          type="button"
        >
          {content}
        </button>
      )}
    </motion.div>
  );
  
  return buttonContainer;
}

// Usage example:
<PremiumButton 
  variant="gradient" 
  size="lg" 
  gradientColors="from-primary via-primary-600 to-secondary-500"
  effects={{
    shine: true,
    glow: true,
    pulse: false,
    particles: true
  }}
  href="/sign-up"
>
  Start Earning Now
</PremiumButton>
```

### Sub-Task 2.3: Create Glass Effect Card Component
**Goal:** Develop a premium glass effect card component for content display

**Details:**
- Create a sophisticated glass effect with depth and dimensionality
- Add subtle light reflections and shadow effects
- Implement interactive hover states with animation
- Support various card sizes and content layouts

**Key Requirements:**
- Create glass effect with customizable opacity and blur
- Add subtle border highlights and shadows
- Support interactive hover states with animations
- Maintain excellent performance across devices

**Implementation Notes:**
```tsx
// Create a new component: GlassCard.tsx
'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glassOpacity?: number;
  glassBlur?: 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  borderColor?: string;
  borderGlow?: boolean;
  tilting?: boolean;
}

export function GlassCard({
  children,
  className = '',
  hoverEffect = true,
  glassOpacity = 0.7,
  glassBlur = 'md',
  border = true,
  borderColor = 'border-white/20',
  borderGlow = true,
  tilting = false,
}: GlassCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Motion values for tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Spring animations for smoother motion
  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), { stiffness: 300, damping: 30 });
  
  // Blur mapping
  const blurMapping = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };
  
  // Handle mouse move for tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !tilting) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    x.set(mouseX);
    y.set(mouseY);
  };
  
  // Reset tilt on mouse leave
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative rounded-xl overflow-hidden',
        hoverEffect && 'transform transition-transform',
        className
      )}
      style={{
        rotateX: tilting ? rotateX : 0,
        rotateY: tilting ? rotateY : 0,
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={hoverEffect ? { scale: 1.02, y: -5 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Gradient background effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-800/10 dark:to-gray-900/5 z-0"
        animate={{
          backgroundPosition: isHovered ? ['0% 0%', '100% 100%'] : ['0% 0%'],
        }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        style={{ backgroundSize: '200% 200%' }}
      />
      
      {/* Glass effect background */}
      <div 
        className={cn(
          'absolute inset-0 bg-white dark:bg-gray-900',
          blurMapping[glassBlur],
          'z-0'
        )}
        style={{ opacity: glassOpacity }}
      />
      
      {/* Border with glow effect */}
      {border && (
        <motion.div
          className={cn(
            'absolute inset-0 border rounded-xl z-0',
            borderColor
          )}
          animate={{
            boxShadow: borderGlow && isHovered 
              ? [
                  '0 0 0 rgba(255, 255, 255, 0)',
                  '0 0 8px rgba(255, 255, 255, 0.3)',
                  '0 0 2px rgba(255, 255, 255, 0.2)'
                ]
              : '0 0 0 rgba(255, 255, 255, 0)',
          }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      )}
      
      {/* Light reflection effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 z-0"
        animate={{
          opacity: isHovered ? 0.1 : 0,
          rotate: isHovered ? -10 : 0,
          scale: isHovered ? 1.5 : 1,
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Content container */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// Usage example:
<GlassCard
  hoverEffect={true}
  glassOpacity={0.7}
  glassBlur="md"
  border={true}
  borderGlow={true}
  tilting={true}
  className="p-6"
>
  <h3 className="text-xl font-semibold">Glass Card Title</h3>
  <p className="mt-2 text-gray-600 dark:text-gray-300">
    This is an enhanced glass card with advanced effects.
  </p>
</GlassCard>
```

### Sub-Task 2.4: Implement Universal Glow Effects
**Goal:** Create a reusable glow effect component that can be applied to any element

**Details:**
- Develop a customizable glow effect component
- Support various colors, intensities, and animation styles
- Implement interactive variants that respond to user interaction
- Ensure effects are performant and accessible

**Key Requirements:**
- Create customizable glow effects with different colors and intensities
- Add animation options for static and interactive glows
- Support different shapes and sizes
- Maintain good performance on all devices

**Implementation Notes:**
```tsx
// Create an improved version of GlowingEffect.tsx:
'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UniversalGlowProps {
  children: React.ReactNode;
  color?: 'primary' | 'secondary' | 'accent' | 'alert' | 'white' | 'custom';
  customColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  intensity?: 'faint' | 'light' | 'medium' | 'strong' | 'intense';
  animation?: 'none' | 'pulse' | 'breathe' | 'shimmer' | 'rotate';
  interactive?: boolean;
  interactiveIntensity?: 'faint' | 'light' | 'medium' | 'strong' | 'intense';
  borderGlow?: boolean;
  borderWidth?: number;
  className?: string;
  shape?: 'rounded' | 'circle' | 'square';
}

export function UniversalGlow({
  children,
  color = 'primary',
  customColor,
  size = 'md',
  intensity = 'medium',
  animation = 'none',
  interactive = true,
  interactiveIntensity = 'medium',
  borderGlow = false,
  borderWidth = 2,
  className = '',
  shape = 'rounded',
}: UniversalGlowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Color mapping
  const getColorClass = () => {
    if (color === 'custom' && customColor) {
      return '';
    }
    
    switch (color) {
      case 'primary': return 'bg-primary';
      case 'secondary': return 'bg-secondary';
      case 'accent': return 'bg-accent';
      case 'alert': return 'bg-alert';
      case 'white': return 'bg-white';
      default: return 'bg-primary';
    }
  };
  
  // Size mapping
  const sizeMapping = {
    sm: { className: 'w-[120%] h-[120%]', blur: 'blur-md' },
    md: { className: 'w-[150%] h-[150%]', blur: 'blur-lg' },
    lg: { className: 'w-[200%] h-[200%]', blur: 'blur-xl' },
    xl: { className: 'w-[250%] h-[250%]', blur: 'blur-2xl' },
    full: { className: 'w-full h-full scale-110', blur: 'blur-xl' },
  };
  
  // Intensity mapping
  const intensityMapping = {
    faint: 'opacity-5',
    light: 'opacity-10',
    medium: 'opacity-20',
    strong: 'opacity-30',
    intense: 'opacity-40',
  };
  
  // Interactive intensity mapping
  const interactiveIntensityMapping = {
    faint: 'opacity-10',
    light: 'opacity-20',
    medium: 'opacity-30',
    strong: 'opacity-40',
    intense: 'opacity-50',
  };
  
  // Shape mapping
  const shapeMapping = {
    rounded: 'rounded-[30%]',
    circle: 'rounded-full',
    square: 'rounded-lg',
  };
  
  // Animation variants
  const animationVariants = {
    none: {},
    pulse: {
      scale: [0.95, 1.05, 0.95],
      opacity: (intensity === 'faint' ? [0.03, 0.07, 0.03] : 
                intensity === 'light' ? [0.08, 0.12, 0.08] : 
                intensity === 'medium' ? [0.15, 0.25, 0.15] :
                intensity === 'strong' ? [0.25, 0.35, 0.25] :
                [0.35, 0.45, 0.35]),
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    breathe: {
      scale: [1, 1.1, 1],
      opacity: (intensity === 'faint' ? [0.05, 0.08, 0.05] : 
                intensity === 'light' ? [0.1, 0.15, 0.1] : 
                intensity === 'medium' ? [0.2, 0.3, 0.2] :
                intensity === 'strong' ? [0.3, 0.4, 0.3] :
                [0.4, 0.5, 0.4]),
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    shimmer: {
      backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "linear"
      }
    },
    rotate: {
      rotate: [0, 180, 360],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };
  
  // Border glow variants
  const borderGlowVariants = {
    initial: {
      boxShadow: '0 0 0 rgba(255, 255, 255, 0)'
    },
    animate: {
      boxShadow: [
        '0 0 0px rgba(255, 255, 255, 0)',
        `0 0 10px ${color === 'custom' && customColor ? customColor : 'rgba(30, 136, 229, 0.6)'}`,
        '0 0 0px rgba(255, 255, 255, 0)'
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    hover: {
      boxShadow: `0 0 15px ${color === 'custom' && customColor ? customColor : 'rgba(30, 136, 229, 0.8)'}`,
      transition: {
        duration: 0.3
      }
    }
  };
  
  // Interactive mouse tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !interactive) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main glow effect */}
      <AnimatePresence>
        <motion.div
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity z-0",
            sizeMapping[size].className,
            sizeMapping[size].blur,
            shapeMapping[shape],
            color !== 'custom' ? getColorClass() : '',
            !isHovered ? intensityMapping[intensity] : interactiveIntensityMapping[interactiveIntensity]
          )}
          style={{
            left: interactive && isHovered ? mousePosition.x : '50%',
            top: interactive && isHovered ? mousePosition.y : '50%',
            backgroundColor: color === 'custom' && customColor ? customColor : undefined,
            backgroundSize: animation === 'shimmer' ? '200% 200%' : '100% 100%',
            opacity: animation === 'none' ? (isHovered ? parseInt(interactiveIntensityMapping[interactiveIntensity].split('-')[1]) / 100 : parseInt(intensityMapping[intensity].split('-')[1]) / 100) : undefined,
          }}
          animate={animation !== 'none' ? animationVariants[animation] : {}}
          whileHover={interactive && animation === 'none' ? { scale: 1.2 } : {}}
          variants={animationVariants}
          initial={animation === 'none' ? false : 'initial'}
        />
      </AnimatePresence>
      
      {/* Border glow effect */}
      {borderGlow && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-lg pointer-events-none z-0",
            `border-${borderWidth} border-${color}-400/30`
          )}
          style={{
            borderColor: color === 'custom' && customColor ? `${customColor}50` : undefined,
          }}
          animate="animate"
          whileHover={interactive ? "hover" : ""}
          variants={borderGlowVariants}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Usage example:
<UniversalGlow
  color="primary"
  size="md"
  intensity="medium"
  animation="pulse"
  interactive={true}
  interactiveIntensity="strong"
  borderGlow={true}
  shape="rounded"
  className="p-6"
>
  <div className="p-4">
    <h3 className="text-xl font-semibold">Glowing Content</h3>
    <p className="mt-2">This content has a customizable glow effect.</p>
  </div>
</UniversalGlow>
```

### Sub-Task 2.5: Create Animated Micro-Interactions
**Goal:** Develop subtle animation effects for interactive elements

**Details:**
- Implement micro-animations for interactive elements
- Create hover, focus, and active state animations
- Add loading and success state animations
- Ensure animations enhance rather than distract from the experience

**Key Requirements:**
- Create subtle animations for interactive element states
- Add loading state animations for async actions
- Implement success/error state animations
- Ensure animations respect reduced motion preferences

**Implementation Notes:**
```tsx
// Create a new component: AnimatedIconButton.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { cn } from '@/lib/utils';

interface AnimatedIconButtonProps {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  onClick?: () => Promise<void> | void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function AnimatedIconButton({
  icon,
  activeIcon,
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: AnimatedIconButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const prefersReducedMotion = useReducedMotionPreference();
  
  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };
  
  // Variant classes
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-600 active:bg-primary-700",
    secondary: "bg-secondary text-black hover:bg-secondary-600 active:bg-secondary-700",
    outline: "bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800/30",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 dark:text-gray-200 dark:hover:bg-gray-800/30",
  };
  
  // Combine classes
  const buttonClasses = cn(
    "relative rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors",
    sizeClasses[size],
    variantClasses[variant],
    disabled || isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
    className
  );
  
  // Handle click with loading state
  const handleClick = async () => {
    if (disabled || isLoading || !onClick) return;
    
    try {
      setIsLoading(true);
      setIsActive(true);
      await onClick();
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsActive(false);
      }, 1500);
    } catch (error) {
      console.error("Error in button click handler:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <motion.button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || isLoading}
      whileHover={!disabled && !isLoading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
      title={label}
      aria-label={label}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, rotate: { repeat: Infinity, duration: 1 } }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center text-green-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            initial={false}
            animate={{ rotate: isActive && !prefersReducedMotion ? [0, 10, -10, 0] : 0 }}
            transition={{ duration: 0.5, times: [0, 0.2, 0.8, 1] }}
            className="flex items-center justify-center"
          >
            {activeIcon && isActive ? activeIcon : icon}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Usage example:
<AnimatedIconButton
  icon={<HeartIcon className="h-5 w-5" />}
  activeIcon={<HeartFilledIcon className="h-5 w-5" />}
  label="Like"
  variant="primary"
  size="md"
  onClick={async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  }}
/>
```

## Testing Strategy

### Unit Testing
- Test each new component in isolation
- Verify all states (normal, hover, active, disabled)
- Test accessibility compliance for all components
- Ensure animations respect reduced motion preferences

### Integration Testing
- Test components together in context
- Verify visual consistency across the application
- Test performance on low-end devices
- Ensure animations don't cause layout shifts

### Accessibility Testing
- Test all components with keyboard navigation
- Verify screen reader functionality
- Check color contrast for all text elements
- Ensure animations don't cause issues for users with vestibular disorders

### Performance Testing
- Measure impact on page load time
- Test animation performance on mobile devices
- Verify memory usage during extended sessions
- Ensure CSS and JavaScript optimizations are applied

## Definition of Done

- All components are fully responsive and work on all device sizes
- Animations are smooth and performant across devices
- Components meet WCAG 2.1 Level AA accessibility standards
- Glass effects and borders render correctly in all modern browsers
- Reduced motion preferences are respected
- Code is well-documented with clear usage examples
- All components have proper TypeScript definitions
- Visual design matches specifications and enhances the user experience
- Performance impact is minimal with no noticeable slowdowns
- Components are fully integrated with the existing design system