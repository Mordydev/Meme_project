'use client';

import { motion, MotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { AnimateOnMount } from './AnimateOnMount';

type ClientMotionProps = MotionProps & {
  children: ReactNode;
  type?: 'div' | 'span' | 'button' | 'a' | 'p' | 'h1' | 'h2' | 'h3' | 'h4';
};

/**
 * ClientMotion - A wrapper for Framer Motion components that ensures
 * they only render on the client side to prevent hydration mismatches
 */
export function ClientMotion({ 
  children, 
  type = 'div',
  ...props 
}: ClientMotionProps) {
  // Use AnimateOnMount to prevent hydration mismatches
  return (
    <AnimateOnMount>
      {type === 'div' && <motion.div {...props}>{children}</motion.div>}
      {type === 'span' && <motion.span {...props}>{children}</motion.span>}
      {type === 'button' && <motion.button {...props}>{children}</motion.button>}
      {type === 'a' && <motion.a {...props}>{children}</motion.a>}
      {type === 'p' && <motion.p {...props}>{children}</motion.p>}
      {type === 'h1' && <motion.h1 {...props}>{children}</motion.h1>}
      {type === 'h2' && <motion.h2 {...props}>{children}</motion.h2>}
      {type === 'h3' && <motion.h3 {...props}>{children}</motion.h3>}
      {type === 'h4' && <motion.h4 {...props}>{children}</motion.h4>}
    </AnimateOnMount>
  );
}
