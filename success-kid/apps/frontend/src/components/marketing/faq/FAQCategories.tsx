'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Category } from './useFaqData';

// Category style configurations for consistent design language
const CATEGORY_STYLES = {
  'all': { 
    gradient: 'from-gray-400 to-gray-600',
    lightGradient: 'from-gray-50 to-gray-100',
    glow: 'rgba(107, 114, 128, 0.15)',
    active: 'border-gray-500 bg-gray-50'
  },
  'general': { 
    gradient: 'from-blue-400 to-blue-600',
    lightGradient: 'from-blue-50 to-blue-100',
    glow: 'rgba(59, 130, 246, 0.15)',
    active: 'border-blue-500 bg-blue-50'
  },
  'getting-started': { 
    gradient: 'from-green-400 to-emerald-600',
    lightGradient: 'from-green-50 to-emerald-100',
    glow: 'rgba(16, 185, 129, 0.15)',
    active: 'border-emerald-500 bg-emerald-50'
  },
  'points': { 
    gradient: 'from-amber-400 to-yellow-600',
    lightGradient: 'from-amber-50 to-yellow-100',
    glow: 'rgba(245, 158, 11, 0.15)',
    active: 'border-yellow-500 bg-yellow-50'
  },
  'tokens': { 
    gradient: 'from-violet-400 to-purple-600',
    lightGradient: 'from-violet-50 to-purple-100',
    glow: 'rgba(139, 92, 246, 0.15)',
    active: 'border-purple-500 bg-purple-50'
  },
  'wallet': { 
    gradient: 'from-indigo-400 to-blue-600',
    lightGradient: 'from-indigo-50 to-blue-100',
    glow: 'rgba(79, 70, 229, 0.15)',
    active: 'border-indigo-500 bg-indigo-50'
  },
  'support': { 
    gradient: 'from-rose-400 to-red-600',
    lightGradient: 'from-rose-50 to-red-100',
    glow: 'rgba(225, 29, 72, 0.15)',
    active: 'border-rose-500 bg-rose-50'
  }
};

interface CategoryCardProps {
  category: Category;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

// Compact desktop category card component
const CategoryCard = ({ category, isActive, onClick, index }: CategoryCardProps) => {
  const style = CATEGORY_STYLES[category.id as keyof typeof CATEGORY_STYLES] || CATEGORY_STYLES.general;
  
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.05 + (index * 0.03),
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    hover: {
      y: -3,
      boxShadow: `0 8px 15px -3px ${style.glow}`,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15
      }
    },
    tap: {
      scale: 0.98,
      boxShadow: `0 2px 8px -2px ${style.glow}`,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };
  
  return (
    <motion.button
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={`flex items-center p-3 rounded-lg bg-white ${
        isActive 
          ? `${style.active} border-2 shadow-sm` 
          : 'border border-gray-200 hover:border-gray-300'
      } transition-colors duration-200`}
      aria-selected={isActive}
    >
      {/* Category icon with count */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg mr-3 ${
        isActive 
          ? `bg-gradient-to-br ${style.gradient} text-white` 
          : `bg-gradient-to-br ${style.lightGradient} text-gray-900`
      }`}>
        {category.icon}
      </div>
      
      <div className="text-left">
        <span className={`font-medium block leading-tight ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
          {category.name}
        </span>
        <span className="text-xs text-gray-500">
          {category.count} {category.count === 1 ? 'item' : 'items'}
        </span>
      </div>
    </motion.button>
  );
};

interface CategoryPillProps {
  category: Category;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

// Compact mobile category pill component
const CategoryPill = ({ category, isActive, onClick, index }: CategoryPillProps) => {
  const style = CATEGORY_STYLES[category.id as keyof typeof CATEGORY_STYLES] || CATEGORY_STYLES.general;
  
  // Animation variants
  const pillVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 5 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { 
        delay: 0.1 + (index * 0.04),
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    hover: {
      y: -1,
      scale: 1.03,
      boxShadow: `0 3px 10px -2px ${style.glow}`,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 15
      }
    },
    tap: {
      scale: 0.97,
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };
  
  return (
    <motion.button
      variants={pillVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={`flex items-center px-3 py-1.5 rounded-full ${
        isActive 
          ? `bg-gradient-to-r ${style.gradient} text-white shadow-sm` 
          : 'bg-white border border-gray-200 text-gray-700 shadow-sm'
      }`}
      aria-selected={isActive}
    >
      <span className={`text-lg mr-1.5 ${isActive ? 'text-white' : ''}`}>{category.icon}</span>
      <span className="font-medium text-sm">{category.name}</span>
      {category.count > 0 && (
        <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
          isActive 
            ? 'bg-white/20 text-white' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {category.count}
        </span>
      )}
    </motion.button>
  );
};

// Navigation arrow button component
interface ArrowButtonProps {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
}

const ArrowButton = ({ direction, onClick, disabled }: ArrowButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`absolute z-10 top-1/2 transform -translate-y-1/2 
        ${direction === 'left' ? 'left-0' : 'right-0'}
        h-8 w-8 rounded-full bg-white shadow-md border border-gray-200 
        flex items-center justify-center text-gray-600 
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 hover:text-primary'}`}
      aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
    >
      {direction === 'left' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </motion.button>
  );
};

interface FAQCategoriesProps {
  categories: Category[];
  activeCategory: string;
  onCategorySelect: (categoryId: string) => void;
  trackCategoryView: (categoryId: string) => void;
}

export const FAQCategories = ({ 
  categories, 
  activeCategory, 
  onCategorySelect,
  trackCategoryView
}: FAQCategoriesProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });
  
  // State for scroll arrows
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on mobile/small screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check initially
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Check scroll position for arrows
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    // Show left arrow if we're not at the start
    setShowLeftArrow(scrollLeft > 10);
    
    // Show right arrow if we're not at the end
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };
  
  // Add scroll listener when component mounts
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      
      // Check initial position
      checkScrollPosition();
      
      // Cleanup
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);
  
  // Scroll functions for arrow buttons
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };
  
  // Auto-scroll to active category
  useEffect(() => {
    if (scrollContainerRef.current && activeCategory && isMobile) {
      // Find the active element
      const activeElement = scrollContainerRef.current.querySelector(`[aria-selected="true"]`);
      
      if (activeElement) {
        // Calculate the scroll position to center the element
        const containerWidth = scrollContainerRef.current.clientWidth;
        const elementLeft = (activeElement as HTMLElement).offsetLeft;
        const elementWidth = (activeElement as HTMLElement).offsetWidth;
        
        const scrollPosition = elementLeft - (containerWidth / 2) + (elementWidth / 2);
        
        // Smooth scroll to the position
        scrollContainerRef.current.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
        
        // Update arrow visibility
        setTimeout(checkScrollPosition, 500);
      }
    }
  }, [activeCategory, isMobile]);
    
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    onCategorySelect(categoryId);
    trackCategoryView(categoryId);
  };
  
  // Container variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1
      }
    }
  };
  
  // Heading variants for animation
  const headingVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <div className="mb-6" ref={sectionRef}>
      <motion.h2 
        variants={headingVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="text-xl font-semibold mb-4 text-gray-900"
      >
        Browse by Category
      </motion.h2>
      
      {/* Desktop category navigation - compact grid to fit all categories */}
      <div className="hidden md:block">
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <AnimatePresence>
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                isActive={category.id === activeCategory}
                onClick={() => handleCategorySelect(category.id)}
                index={index}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Mobile category navigation - horizontal scroll with arrows */}
      <div className="relative md:hidden">
        {/* Left arrow */}
        {showLeftArrow && (
          <ArrowButton 
            direction="left" 
            onClick={scrollLeft} 
            disabled={!showLeftArrow} 
          />
        )}
        
        <motion.div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto py-2 px-6 scrollbar-hide"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          onScroll={checkScrollPosition}
        >
          <div className="flex space-x-2">
            {categories.map((category, index) => (
              <CategoryPill
                key={category.id}
                category={category}
                isActive={category.id === activeCategory}
                onClick={() => handleCategorySelect(category.id)}
                index={index}
              />
            ))}
          </div>
        </motion.div>
        
        {/* Right arrow */}
        {showRightArrow && (
          <ArrowButton 
            direction="right" 
            onClick={scrollRight} 
            disabled={!showRightArrow} 
          />
        )}
      </div>
      
      {/* Add custom CSS for hiding scrollbar on mobile overflow */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
