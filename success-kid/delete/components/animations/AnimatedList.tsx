'use client';

import React, { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { bezierCurves } from '@/lib/animations';

export interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
  animateOnFirstRender?: boolean;
  animateWhenItemsChange?: boolean;
  animation?: 'fade' | 'slide-up' | 'slide-right' | 'scale';
  containerTag?: keyof JSX.IntrinsicElements;
  itemTag?: keyof JSX.IntrinsicElements;
}

/**
 * AnimatedList - Renders list items with staggered animations
 * 
 * @example
 * <AnimatedList>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </AnimatedList>
 */
export function AnimatedList({
  children,
  className,
  itemClassName,
  staggerDelay = 0.05,
  animateOnFirstRender = true,
  animateWhenItemsChange = true,
  animation = 'fade',
  containerTag = 'ul',
  itemTag = 'li',
}: AnimatedListProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Skip animation for users who prefer reduced motion
  if (prefersReducedMotion) {
    const Container = containerTag;
    return (
      <Container className={className}>
        {React.Children.map(children, (child) => {
          const Item = itemTag;
          return <Item className={itemClassName}>{child}</Item>;
        })}
      </Container>
    );
  }
  
  // Select animation variant based on animation type
  let itemVariants: Variants;
  
  switch (animation) {
    case 'slide-up':
      itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: bezierCurves.standard } },
      };
      break;
    case 'slide-right':
      itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: bezierCurves.standard } },
      };
      break;
    case 'scale':
      itemVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: bezierCurves.standard } },
      };
      break;
    case 'fade':
    default:
      itemVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3, ease: bezierCurves.standard } },
      };
  }
  
  // Container animation with staggered children
  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.05,
      },
    },
  };
  
  // Convert container tag to motion component
  const Container = motion[containerTag as keyof typeof motion];
  const Item = motion[itemTag as keyof typeof motion];
  
  const childArray = React.Children.toArray(children);
  const childrenCount = childArray.length;
  
  return (
    <Container
      className={className}
      initial={animateOnFirstRender ? "hidden" : "visible"}
      animate="visible"
      variants={containerVariants}
      key={animateWhenItemsChange ? childrenCount : undefined}
    >
      {React.Children.map(children, (child, index) => (
        <Item
          className={itemClassName}
          variants={itemVariants}
          // Apply custom transition for non-staggered animations
          transition={{
            delay: !animateOnFirstRender ? 0 : undefined,
            duration: 0.3,
            ease: bezierCurves.standard,
          }}
        >
          {child}
        </Item>
      ))}
    </Container>
  );
}
