'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award, Share2, X, Check, Copy, Twitter, Facebook } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePointsStore } from '@/store/usePointsStore';
import { Achievement } from '@/store/useAchievementStore';

interface AchievementCelebrationModalProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementCelebrationModal({
  achievement,
  onClose
}: AchievementCelebrationModalProps) {
  const { toast } = useToast();
  const confettiRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  
  // Create confetti animation with GSAP
  useEffect(() => {
    if (prefersReducedMotion || !confettiRef.current) return;
    
    const colors = ['#1E88E5', '#4CAF50', '#FFC107', '#F44336', '#9C27B0'];
    const confettiCount = 100;
    const container = confettiRef.current;
    const confettiElements = [];
    
    // Create confetti elements
    for (let i = 0; i < confettiCount; i++) {
      const element = document.createElement('div');
      element.classList.add('absolute', 'w-3', 'h-3', 'rounded-full');
      element.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      element.style.top = '50%';
      element.style.left = '50%';
      container.appendChild(element);
      confettiElements.push(element);
    }
    
    // Animate confetti with GSAP
    confettiElements.forEach((element) => {
      gsap.to(element, {
        x: () => (Math.random() * 2 - 1) * window.innerWidth * 0.5,
        y: () => (Math.random() * 2 - 1) * window.innerHeight * 0.5,
        opacity: 0,
        scale: () => Math.random() * 1.5 + 0.5,
        duration: () => Math.random() * 2 + 1,
        ease: 'power3.out',
      });
    });
    
    // Cleanup
    return () => {
      confettiElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [prefersReducedMotion]);
  
  // Format category for display
  const formatCategory = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Format difficulty for display
  const formatDifficulty = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  };
  
  // Calculate difficulty level indicator
  const getDifficultyLevel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 1;
      case 'intermediate':
        return 2;
      case 'advanced':
        return 3;
      case 'expert':
        return 4;
      default:
        return 1;
    }
  };
  
  // Handle sharing the achievement
  const shareAchievement = async (platform: string) => {
    const shareText = `I just unlocked the "${achievement.name}" achievement on Success Kid Community! ${
      achievement.description
    }`;
    const shareUrl = window.location.origin;
    
    try {
      if (platform === 'native' && navigator.share) {
        await navigator.share({
          title: `Success Kid Achievement: ${achievement.name}`,
          text: shareText,
          url: shareUrl,
        });
        
        toast({
          title: "Shared successfully",
          duration: 2000
        });
        return;
      }
      
      switch (platform) {
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              shareText
            )}&url=${encodeURIComponent(shareUrl)}`,
            '_blank'
          );
          break;
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              shareUrl
            )}&quote=${encodeURIComponent(shareText)}`,
            '_blank'
          );
          break;
        default:
          navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            
            toast({
              title: "Copied to clipboard",
              description: "Share with your friends!",
              duration: 2000
            });
          });
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      toast({
        title: "Sharing failed",
        description: "Please try again later",
        variant: "destructive",
        duration: 2000
      });
    }
  };
  
  return (
    <Dialog open={!!achievement} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <div ref={confettiRef} className="absolute inset-0 overflow-hidden pointer-events-none"></div>
        
        <DialogHeader>
          <DialogTitle className="text-center text-xl sm:text-2xl">Achievement Unlocked!</DialogTitle>
          <DialogDescription className="text-center">
            You've earned a new achievement and rewards
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 15,
              duration: prefersReducedMotion ? 0.1 : 0.8
            }}
            className="relative"
          >
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center">
              <Award className="w-16 h-16 sm:w-20 sm:h-20 text-primary" />
            </div>
            
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: prefersReducedMotion ? 0.1 : 0.4, duration: 0.2 }}
              className="absolute -bottom-2 -right-2 bg-secondary text-white rounded-full p-2"
            >
              <Check className="w-6 h-6" />
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0.2 : 0.5, duration: 0.3 }}
            className="mt-6 text-center"
          >
            <h3 className="text-xl sm:text-2xl font-bold">{achievement.name}</h3>
            <p className="text-neutral-600 mt-2">{achievement.description}</p>
            
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-xs text-neutral-500">Category</div>
                <div className="font-medium">{formatCategory(achievement.category)}</div>
              </div>
              
              <div className="h-8 border-r border-neutral-200"></div>
              
              <div className="text-center">
                <div className="text-xs text-neutral-500">Difficulty</div>
                <div className="font-medium flex items-center gap-1">
                  {formatDifficulty(achievement.difficulty)}
                  <div className="ml-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span
                        key={i}
                        className={`inline-block w-1.5 h-1.5 rounded-full mx-0.5 ${
                          i < getDifficultyLevel(achievement.difficulty)
                            ? 'bg-primary'
                            : 'bg-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="h-8 border-r border-neutral-200"></div>
              
              <div className="text-center">
                <div className="text-xs text-neutral-500">Reward</div>
                <div className="font-medium font-mono text-green-600">
                  +{achievement.pointsReward} SP
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: prefersReducedMotion ? 0.3 : 0.8, duration: 0.3 }}
            className="mt-8 p-4 bg-neutral-50 rounded-lg w-full max-w-sm border border-neutral-200"
          >
            <div className="text-center">
              <h4 className="font-medium">Share Your Achievement</h4>
              <p className="text-sm text-neutral-500 mt-1">Let your friends know about your accomplishment</p>
            </div>
            
            <div className="mt-4 grid grid-cols-4 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col items-center gap-1 py-2 h-auto"
                onClick={() => shareAchievement('copy')}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="text-xs">Copy</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col items-center gap-1 py-2 h-auto"
                onClick={() => shareAchievement('twitter')}
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                <span className="text-xs">Twitter</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col items-center gap-1 py-2 h-auto"
                onClick={() => shareAchievement('facebook')}
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col items-center gap-1 py-2 h-auto"
                onClick={() => shareAchievement('native')}
              >
                <Share2 className="h-4 w-4" />
                <span className="text-xs">More</span>
              </Button>
            </div>
          </motion.div>
        </div>
        
        <DialogFooter className="flex sm:flex-row sm:justify-center gap-2">
          <Button onClick={onClose}>
            Continue to Dashboard
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/rewards?tab=achievements'}>
            View All Achievements
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add useState import at the top
import { useState } from 'react';
