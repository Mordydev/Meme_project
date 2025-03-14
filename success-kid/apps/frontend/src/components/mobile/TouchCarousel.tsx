'use client';

import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface TouchCarouselProps {
  children: ReactNode[];
  initialIndex?: number;
  onSlideChange?: (index: number) => void;
  showIndicators?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number;
  loop?: boolean;
  className?: string;
  slideClassName?: string;
  indicatorClassName?: string;
  activeIndicatorClassName?: string;
}

/**
 * A mobile-optimized touch carousel/slider component that supports
 * swiping, indicators, autoplay, and other common carousel features.
 */
export const TouchCarousel: React.FC<TouchCarouselProps> = ({
  children,
  initialIndex = 0,
  onSlideChange,
  showIndicators = true,
  autoplay = false,
  autoplayInterval = 5000,
  loop = false,
  className,
  slideClassName,
  indicatorClassName,
  activeIndicatorClassName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [slideWidth, setSlideWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const itemCount = React.Children.count(children);
  const prefersReducedMotion = useReducedMotion();

  // Update slide width on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setSlideWidth(containerRef.current.offsetWidth);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Set up autoplay if enabled
  useEffect(() => {
    if (autoplay && itemCount > 1) {
      const startAutoplay = () => {
        autoplayTimerRef.current = setInterval(() => {
          const nextIndex = (currentIndex + 1) % itemCount;
          goToSlide(nextIndex);
        }, autoplayInterval);
      };

      startAutoplay();

      return () => {
        if (autoplayTimerRef.current) {
          clearInterval(autoplayTimerRef.current);
        }
      };
    }
  }, [autoplay, autoplayInterval, currentIndex, itemCount]);

  // Navigate to specific slide
  const goToSlide = (index: number) => {
    // Ensure index is within bounds
    let targetIndex = index;
    if (!loop) {
      targetIndex = Math.max(0, Math.min(index, itemCount - 1));
    } else {
      // Handle loop wraparound
      if (index < 0) targetIndex = itemCount - 1;
      if (index >= itemCount) targetIndex = 0;
    }

    // Animate to the target slide
    controls.start({
      x: -targetIndex * slideWidth,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: prefersReducedMotion ? 0.1 : 0.3,
      },
    });

    // Update state and call callback
    setCurrentIndex(targetIndex);
    onSlideChange?.(targetIndex);
  };

  // Handle drag end (swipe)
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Check if swipe was significant enough
    const swipeThreshold = slideWidth * 0.2;
    const swipeDirection = info.offset.x < 0 ? 1 : -1;

    if (Math.abs(info.offset.x) > swipeThreshold) {
      // Swipe was significant, move to next/prev slide
      goToSlide(currentIndex + swipeDirection);
    } else {
      // Swipe wasn't significant, stay on current slide
      goToSlide(currentIndex);
    }
  };

  return (
    <div className={cn('relative overflow-hidden', className)} ref={containerRef}>
      <motion.div
        className="flex"
        drag="x"
        dragConstraints={{ left: -(itemCount - 1) * slideWidth, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ x: -initialIndex * slideWidth }}
      >
        {React.Children.map(children, (child, index) => (
          <div
            key={`slide-${index}`}
            className={cn('flex-shrink-0', slideClassName)}
            style={{ width: `${slideWidth}px` }}
          >
            {child}
          </div>
        ))}
      </motion.div>

      {showIndicators && itemCount > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2">
          {Array.from({ length: itemCount }).map((_, index) => (
            <button
              key={`indicator-${index}`}
              className={cn(
                'w-2 h-2 rounded-full bg-gray-300',
                index === currentIndex && 'bg-primary',
                indicatorClassName,
                index === currentIndex && activeIndicatorClassName
              )}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TouchCarousel;