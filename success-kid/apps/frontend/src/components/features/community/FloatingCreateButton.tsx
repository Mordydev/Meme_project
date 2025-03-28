'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Image, Link2, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingCreateButtonProps {
  className?: string;
}

export function FloatingCreateButton({ className }: FloatingCreateButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();
  
  // Hide button on create page
  const shouldShow = !pathname.includes('/community/create');
  
  // Hide button when scrolling down, show when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show at top of page
      if (currentScrollY < 100) {
        setVisible(true);
      } else {
        // Hide when scrolling down, show when scrolling up
        setVisible(currentScrollY < lastScrollY);
      }
      
      // Close expanded state when scrolling
      if (Math.abs(currentScrollY - lastScrollY) > 10) {
        setExpanded(false);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Content types for quick access
  const contentTypes = [
    { type: 'text', icon: <Pencil size={18} />, label: 'Text' },
    { type: 'image', icon: <Image size={18} />, label: 'Image' },
    { type: 'link', icon: <Link2 size={18} />, label: 'Link' },
    { type: 'poll', icon: <BarChart2 size={18} />, label: 'Poll' }
  ];
  
  if (!shouldShow) return null;
  
  return (
    <div
      className={cn(
        "fixed right-4 bottom-20 z-40 flex flex-col items-end gap-2",
        !visible && "translate-y-20 opacity-0",
        "transition-all duration-300 ease-in-out",
        className
      )}
      aria-label="Create content"
    >
      {/* Quick create options - only visible when expanded */}
      <AnimatePresence>
        {expanded && (
          <div className="flex flex-col gap-2 items-end mb-2">
            {contentTypes.map((item) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <Link href={`/community/create?type=${item.type}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2 pr-4 shadow-md"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Main button */}
      <motion.div
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: expanded ? 45 : 0 }}
      >
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={toggleExpanded}
        >
          <PlusCircle size={24} />
          <span className="sr-only">
            {expanded ? 'Close create menu' : 'Open create menu'}
          </span>
        </Button>
      </motion.div>
    </div>
  );
}
