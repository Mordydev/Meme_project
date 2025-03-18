import { HTMLMotionProps } from 'framer-motion';

declare module 'framer-motion' {
  export interface MotionProps {
    className?: string;
  }
  
  export interface HTMLMotionProps<T> extends MotionProps {
    className?: string;
  }
}
