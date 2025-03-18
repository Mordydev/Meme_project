/**
 * VirtualizedList Component
 * 
 * An efficient list renderer that only renders items currently in viewport,
 * dramatically improving performance for long lists.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

export interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Height of each item in pixels (fixed height items) */
  itemHeight?: number;
  /** Estimated height of variable height items */
  estimatedItemHeight?: number;
  /** Additional container className */
  className?: string;
  /** Number of items to render before visible area */
  overscan?: number;
  /** Custom key function for items */
  getItemKey?: (item: T, index: number) => string | number;
  /** Whether to show a loading indicator when reaching end of list */
  hasMore?: boolean;
  /** Callback when user scrolls to end of list */
  onEndReached?: () => void;
  /** Distance from end in pixels to trigger onEndReached */
  endReachedThreshold?: number;
  /** Initial scroll index */
  initialScrollIndex?: number;
}

function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  estimatedItemHeight = 100,
  className,
  overscan = 5,
  getItemKey,
  hasMore = false,
  onEndReached,
  endReachedThreshold = 300,
  initialScrollIndex = 0,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [totalHeight, setTotalHeight] = useState(0);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Ref for measuring items if variable height
  const measureRef = useRef<{ [key: number]: HTMLDivElement }>({});
  const isVariableHeight = !itemHeight;
  
  // In-view detection for lazy loading
  const { ref: bottomObserverRef, inView: isEndVisible } = useInView({
    threshold: 0,
    rootMargin: `0px 0px ${endReachedThreshold}px 0px`,
  });
  
  // Calculate which items should be visible based on scroll position
  const calculateVisibleItems = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, clientHeight } = containerRef.current;
    let start = 0;
    let end = 0;
    let currentOffset = 0;
    
    if (isVariableHeight) {
      // For variable height items, we need to calculate based on measured heights
      const heights = itemHeights.length === items.length 
        ? itemHeights 
        : Array(items.length).fill(estimatedItemHeight);
      
      // Find first visible item
      for (let i = 0; i < items.length; i++) {
        const itemBottom = currentOffset + heights[i];
        if (itemBottom > scrollTop) {
          start = Math.max(0, i - overscan);
          break;
        }
        currentOffset = itemBottom;
      }
      
      // Find last visible item
      const visibleBottom = scrollTop + clientHeight;
      for (let i = start; i < items.length; i++) {
        const itemTop = currentOffset;
        currentOffset += heights[i];
        if (currentOffset > visibleBottom) {
          end = Math.min(items.length, i + overscan);
          break;
        }
      }
      
      // If we didn't find an end, render to the end of the list
      if (end === 0) end = items.length;
    } else {
      // For fixed height items, calculation is much simpler
      start = Math.max(0, Math.floor(scrollTop / itemHeight!) - overscan);
      end = Math.min(
        items.length,
        Math.ceil((scrollTop + clientHeight) / itemHeight!) + overscan
      );
    }
    
    setVisibleRange({ start, end });
  }, [itemHeight, isVariableHeight, items.length, overscan, itemHeights, estimatedItemHeight]);
  
  // Update visible items when scroll position changes
  const handleScroll = useCallback(() => {
    // Set scrolling state to potentially show placeholders for smooth scrolling
    if (!isScrolling) {
      setIsScrolling(true);
    }
    
    // Clear previous scroll timer
    if (handleScroll.timeout) {
      clearTimeout(handleScroll.timeout);
    }
    
    // After scrolling stops, update visible items and clear scrolling state
    handleScroll.timeout = setTimeout(() => {
      calculateVisibleItems();
      setIsScrolling(false);
    }, 100) as unknown as number;
    
    // For smoother scrolling, don't recalculate on every scroll event
    // Instead, schedule calculations for next animation frame
    if (!handleScroll.ticking) {
      requestAnimationFrame(() => {
        calculateVisibleItems();
        handleScroll.ticking = false;
      });
      handleScroll.ticking = true;
    }
  }, [calculateVisibleItems, isScrolling]);
  
  // Attach this property to the function
  handleScroll.timeout = 0;
  handleScroll.ticking = false;
  
  // Calculate item offsets and total height
  const getItemOffsets = useCallback(() => {
    if (isVariableHeight) {
      const heights = itemHeights.length === items.length 
        ? itemHeights 
        : Array(items.length).fill(estimatedItemHeight);
      
      const totalHeight = heights.reduce((sum, height) => sum + height, 0);
      return { totalHeight, heights };
    } else {
      return { 
        totalHeight: items.length * itemHeight!, 
        heights: Array(items.length).fill(itemHeight) 
      };
    }
  }, [items.length, itemHeight, isVariableHeight, itemHeights, estimatedItemHeight]);
  
  // Effect to update total height when items or measurements change
  useEffect(() => {
    const { totalHeight } = getItemOffsets();
    setTotalHeight(totalHeight);
  }, [items.length, itemHeight, getItemOffsets]);
  
  // Effect to handle scrolling to initial index
  useEffect(() => {
    if (initialScrollIndex > 0 && containerRef.current) {
      const { heights } = getItemOffsets();
      const offset = heights.slice(0, initialScrollIndex).reduce((sum, h) => sum + h, 0);
      containerRef.current.scrollTop = offset;
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Effect to calculate visible range on mount and window resize
  useEffect(() => {
    calculateVisibleItems();
    
    const handleResize = () => {
      calculateVisibleItems();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateVisibleItems]);
  
  // Effect for infinite scroll
  useEffect(() => {
    if (isEndVisible && hasMore && onEndReached) {
      onEndReached();
    }
  }, [isEndVisible, hasMore, onEndReached]);
  
  // Measure item heights for variable height mode
  const measureItem = useCallback((index: number, node: HTMLDivElement | null) => {
    if (node && isVariableHeight) {
      measureRef.current[index] = node;
      
      // After the component renders, measure its height
      requestAnimationFrame(() => {
        const newHeights = [...itemHeights];
        newHeights[index] = node.offsetHeight;
        
        // Only update state if height changed
        if (itemHeights[index] !== newHeights[index]) {
          setItemHeights(newHeights);
        }
      });
    }
  }, [isVariableHeight, itemHeights]);
  
  // Calculate offsets for each visible item
  const getItemOffset = (index: number) => {
    if (!isVariableHeight) {
      return index * itemHeight!;
    }
    
    const heights = itemHeights.length === items.length 
      ? itemHeights 
      : Array(items.length).fill(estimatedItemHeight);
    
    return heights.slice(0, index).reduce((sum, height) => sum + height, 0);
  };
  
  // Generate visible items with proper positioning
  const visibleItems = [];
  for (let i = visibleRange.start; i < visibleRange.end && i < items.length; i++) {
    const item = items[i];
    const key = getItemKey ? getItemKey(item, i) : i;
    const offset = getItemOffset(i);
    const currentHeight = isVariableHeight 
      ? (itemHeights[i] || estimatedItemHeight) 
      : itemHeight!;
    
    visibleItems.push(
      <div
        key={key}
        ref={(node) => measureItem(i, node)}
        className="absolute w-full left-0"
        style={{
          top: offset,
          height: isVariableHeight ? 'auto' : currentHeight,
          willChange: 'transform',
        }}
      >
        {renderItem(item, i)}
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>
      
      {/* Bottom sentinel for infinite loading */}
      {hasMore && (
        <div
          ref={bottomObserverRef}
          className="w-full h-10 flex items-center justify-center"
          style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0 
          }}
        >
          {isEndVisible && (
            <div className="flex space-x-2">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" 
                  style={{ 
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.6s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VirtualizedList;
