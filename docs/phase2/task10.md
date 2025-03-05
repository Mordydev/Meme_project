# Task 10: Animation and Micro-interaction System

## Task Overview
Implement the platform's animation and micro-interaction system to create a polished, engaging user experience. These animations will reinforce the Success Kid brand identity, provide meaningful feedback for user actions, and enhance the overall interface without compromising performance or accessibility.

## Required Document Review
- **Design System Document** - Section 6 (Motion Design System) for animation principles and tokens
- **Frontend & Backend Guidelines** - Section 9.1 (Performance Optimization) for animation performance considerations
- **Masterplan Document** - Section 3.3 (Visual Design & Branding) for brand motion identity

## Implementation Sub-Tasks

### Sub-Task 1: Page Transition Animations
**Description:** Implement smooth page transition animations that maintain context while navigating between routes.

**Key Interface:**
```tsx
interface TransitionProps {
  children: React.ReactNode;
  location: string; // Current route location
}
```

**Key Implementation:**
```tsx
// Route transition wrapper
function PageTransition({ children, location }: TransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="page-container"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// App-level implementation
function App() {
  const location = useLocation();
  
  return (
    <PageTransition location={location.pathname}>
      <Routes location={location}>
        {/* Route definitions */}
      </Routes>
    </PageTransition>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Keep transitions under 300ms to maintain perceived performance
  - Use consistent animation directions based on navigation hierarchy
  - Implement preloading for content when possible to reduce perceived load time
  - Consider reduced motion preferences for accessibility
  - Use will-change CSS property judiciously for performance

- **Potential Challenges:**
  - Maintaining scroll position during transitions
  - Handling ongoing animations when navigating away
  - Ensuring transition performance on lower-end devices
  - Coordinating content loading with animation timing

### Sub-Task 2: Achievement Celebration Animations
**Description:** Create impactful celebration animations for achievements and milestones that reinforce the Success Kid identity.

**Key Interface:**
```tsx
interface CelebrationProps {
  type: 'achievement' | 'level' | 'milestone';
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  iconUrl?: string;
  title: string;
  points?: number;
  onComplete?: () => void;
}
```

**Key Implementation:**
```tsx
// Achievement animation component
function AchievementCelebration({ 
  type, 
  rarity = 'common', 
  iconUrl, 
  title, 
  points, 
  onComplete 
}: CelebrationProps) {
  // Animation duration based on rarity
  const durations = {
    common: 2.5,
    uncommon: 3,
    rare: 3.5,
    epic: 4,
    legendary: 5
  };
  
  // Effect to trigger onComplete callback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, durations[rarity] * 1000);
    
    return () => clearTimeout(timer);
  }, [rarity, onComplete]);
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className={`celebration-container ${rarity}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          transition: { 
            type: 'spring',
            damping: 12 
          }
        }}
      >
        {/* Particle effects based on rarity */}
        <ParticleEffect type={type} rarity={rarity} />
        
        {/* Icon with shine effect */}
        <motion.div 
          className="achievement-icon"
          animate={{ 
            rotateY: [0, 360],
            transition: { 
              duration: durations[rarity] - 1,
              ease: "easeInOut" 
            }
          }}
        >
          <img src={iconUrl} alt="" />
          <motion.div 
            className="shine"
            animate={{ 
              x: ['0%', '100%'],
              opacity: [0, 1, 0],
              transition: { 
                duration: 1.5, 
                repeat: 1, 
                repeatDelay: 0.5 
              }
            }}
          />
        </motion.div>
        
        {/* Title and points display with animations */}
        <motion.h2 className="celebration-title">
          {title.split('').map((char, i) => (
            <motion.span
              key={`${char}-${i}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                transition: { 
                  delay: 0.3 + (i * 0.05),
                  duration: 0.4
                }
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.h2>
        
        {points && (
          <motion.div 
            className="points"
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              transition: { 
                delay: 0.8,
                type: "spring", 
                damping: 8 
              }
            }}
          >
            <CountUp start={0} end={points} prefix="+" suffix=" points" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Scale animation complexity based on achievement significance
  - Use staggered animations for more dynamic, engaging effects
  - Implement preloading for animation assets to avoid stuttering
  - Use sound effects that align with animations (with mute option)
  - Ensure animations can be safely interrupted if needed

- **Potential Challenges:**
  - Performance impact of particle effects and complex animations
  - Ensuring animations are visible but not disruptive to platform use
  - Creating appropriate variation while maintaining design consistency
  - Device compatibility for advanced animation techniques

### Sub-Task 3: Feedback Micro-interactions
**Description:** Implement subtle micro-interactions that provide immediate feedback for user actions throughout the platform.

**Key Implementations:**
```tsx
// Button with feedback animation
function AnimatedButton({ 
  children, 
  onClick, 
  variant = 'primary',
  ...props 
}: ButtonProps) {
  return (
    <motion.button
      className={`btn btn-${variant}`}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Success check animation
function SuccessFeedback({ size = 'medium' }: FeedbackProps) {
  const circleVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        duration: 0.5,
        ease: "easeInOut" 
      }
    }
  };
  
  const checkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        duration: 0.3, 
        delay: 0.3,
        ease: "easeInOut" 
      }
    }
  };
  
  const sizeClass = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-10 h-10"
  };
  
  return (
    <motion.svg
      className={`${sizeClass[size]} text-success`}
      viewBox="0 0 50 50"
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="25"
        cy="25"
        r="20"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        variants={circleVariants}
      />
      <motion.path
        d="M15 25 L22 32 L35 18"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={checkVariants}
      />
    </motion.svg>
  );
}

// Vote interaction
function VoteButton({ direction, count, active, onChange }: VoteButtonProps) {
  const variants = {
    active: { scale: 1.2, transition: { duration: 0.2 } },
    inactive: { scale: 1, transition: { duration: 0.2 } },
    tap: { scale: 0.9, transition: { duration: 0.1 } }
  };
  
  return (
    <div className="flex items-center">
      <motion.button
        className={`vote-button ${active ? 'active' : ''}`}
        variants={variants}
        initial="inactive"
        animate={active ? "active" : "inactive"}
        whileTap="tap"
        onClick={() => onChange(direction)}
      >
        {direction === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
      </motion.button>
      
      <AnimatedNumber
        value={count}
        className="vote-count"
      />
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Keep micro-interactions subtle and brief (under 200ms)
  - Use consistent animation patterns for similar actions
  - Ensure animations don't block user interaction with the interface 
  - Focus on reinforcing user actions rather than pure decoration
  - Implement motion at the component level rather than page level

- **Potential Challenges:**
  - Balancing subtlety with noticeability
  - Maintaining animation performance with many elements on screen
  - Creating interactions that work equally well with mouse and touch
  - Implementing consistent timing across different animation types

### Sub-Task 4: Loading State Animations
**Description:** Create engaging loading state animations that reduce perceived wait time and maintain brand identity.

**Key Implementations:**
```tsx
// Loading spinner with Success Kid branding
function BrandedSpinner({ size = 'medium' }: LoadingProps) {
  const sizeClass = {
    small: "w-5 h-5",
    medium: "w-8 h-8",
    large: "w-12 h-12"
  };
  
  return (
    <div className={`${sizeClass[size]} relative`}>
      <motion.div
        className="absolute inset-0 border-t-2 border-primary rounded-full"
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1,
          ease: "linear",
          repeat: Infinity
        }}
      />
      <motion.div
        className="absolute inset-0 border-t-2 border-primary-light rounded-full"
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1.5,
          ease: "linear",
          repeat: Infinity
        }}
        style={{ opacity: 0.6 }}
      />
    </div>
  );
}

// Skeleton loader for content
function ContentSkeleton() {
  return (
    <div className="skeleton-container">
      <div className="flex items-center">
        <motion.div
          className="skeleton-circle w-10 h-10 rounded-full bg-gray-200"
          animate={{ 
            opacity: [0.7, 0.4, 0.7],
            transition: { duration: 1.5, repeat: Infinity }
          }}
        />
        <div className="ml-3 space-y-1">
          <motion.div
            className="skeleton-line h-4 w-32 bg-gray-200 rounded"
            animate={{ 
              opacity: [0.7, 0.4, 0.7],
              transition: { duration: 1.5, repeat: Infinity, delay: 0.1 }
            }}
          />
          <motion.div
            className="skeleton-line h-3 w-24 bg-gray-200 rounded"
            animate={{ 
              opacity: [0.7, 0.4, 0.7],
              transition: { duration: 1.5, repeat: Infinity, delay: 0.2 }
            }}
          />
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <motion.div
          className="skeleton-rect h-4 w-full bg-gray-200 rounded"
          animate={{ 
            opacity: [0.7, 0.4, 0.7],
            transition: { duration: 1.5, repeat: Infinity, delay: 0.3 }
            }}
        />
        <motion.div
          className="skeleton-rect h-4 w-3/4 bg-gray-200 rounded"
          animate={{ 
            opacity: [0.7, 0.4, 0.7],
            transition: { duration: 1.5, repeat: Infinity, delay: 0.4 }
            }}
        />
      </div>
    </div>
  );
}

// Progress indicator
function ProgressLoader({ progress = 0, message }: LoadingProps) {
  return (
    <div className="progress-container">
      <div className="relative pt-1 w-full max-w-sm">
        {message && (
          <div className="text-center mb-2 text-sm text-gray-600">
            {message}
          </div>
        )}
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
          <motion.div 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="text-right mt-1 text-xs text-gray-500">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Use loading animations that align with expected wait time
  - Implement skeleton screens for content loading when possible
  - Make loaders match the brand's visual language and motion style
  - Provide appropriate loading state for each type of content
  - Consider progress indicators for operations over 2 seconds

- **Potential Challenges:**
  - Balancing brand distinctiveness with recognizable loading patterns
  - Ensuring loading animations don't increase perceived wait time
  - Creating appropriate loading states for different content types
  - Handling progress indicators when progress can't be determined

## Integration Points
- Connects with all UI components to provide consistent motion patterns
- Interfaces with Navigation components for page transitions
- Provides feedback for form submissions and user interactions
- Integrates with Gamification System for achievement celebrations
- Works with loading states for API requests and content fetching

## Testing Strategy
- Animation performance testing across device capabilities
- Reduced motion preference testing for accessibility
- Interaction timing verification for consistent experience
- Cross-browser compatibility testing
- Memory usage monitoring for animation impact
- User perception testing for feedback effectiveness

## Definition of Done
This task is complete when:
- [ ] Page transitions provide smooth navigation between routes
- [ ] Achievement celebrations create appropriate impact based on significance
- [ ] Micro-interactions provide immediate feedback for user actions
- [ ] Loading state animations reduce perceived wait time
- [ ] All animations follow the design system's motion guidelines
- [ ] Animations respect reduced motion preferences
- [ ] Animations perform well across target devices
- [ ] Motion system integrates with all key platform components
- [ ] Animation timing is consistent across interaction types
- [ ] Memory usage remains efficient with active animations