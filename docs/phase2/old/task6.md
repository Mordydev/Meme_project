# Task 6: Gamification System Frontend

## Task Overview
Implement the frontend components for the platform's gamification system, creating engaging visualizations for user achievements, points, and progress. This feature reinforces the Success Kid ethos by celebrating user accomplishments, encouraging engagement, and creating a positive feedback loop that drives platform participation.

## Required Document Review
- **Masterplan Document** - Section 4.4 (Gamification System) for points economy, levels, and achievements
- **Design System Document** - Section 6 (Motion Design System) for achievement animations
- **App Flow Document** - Section 4.1 (Sub-Task 4: First Achievement Implementation)
- **Frontend & Backend Guidelines** - Section 7.1 (Design System) for gamification visuals

## User Experience Flow
1. **Points Accumulation:** User performs actions that earn points, receiving immediate visual feedback
2. **Achievement Unlocking:** User receives celebratory notification when unlocking a new achievement
3. **Level Progression:** User sees progress toward next level with appropriate visual indicators
4. **Leaderboard Competition:** User checks rankings to see how they compare to other community members
5. **Streak Maintenance:** User receives reminders and rewards for maintaining daily activity streaks

## Implementation Sub-Tasks

### Sub-Task 1: Points Display and Animation
**Description:** Create the points visualization system that provides immediate, satisfying feedback when users earn points.

**Component Hierarchy:**
```
PointsSystem/
├── PointsIndicator/       # Global points display
├── PointsAnimation/       # Points earned animation
└── PointsTransaction/     # Individual points event
```

**Key Interface/Props:**
```tsx
interface PointsIndicatorProps {
  points: number;
  variant?: 'compact' | 'standard' | 'detailed';
}

interface PointsAnimationProps {
  amount: number;
  reason?: string;
  targetElementId?: string; // Where points should flow to
  onComplete?: () => void;
}
```

**Key UI Elements:**
```tsx
function PointsIndicator({ points, variant = 'standard' }: PointsIndicatorProps) {
  return (
    <div className="flex items-center">
      <CoinIcon className="text-yellow-500 w-5 h-5 mr-1" />
      <span className="font-medium text-gray-900">{points.toLocaleString()}</span>
      {variant === 'detailed' && (
        <span className="ml-1 text-sm text-gray-500">points</span>
      )}
    </div>
  );
}

// Points Animation Component - Shows points being earned
function PointsAnimation({ amount, reason, targetElementId, onComplete }: PointsAnimationProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // Calculate starting position (e.g., near the action that earned points)
    // and ending position (the global points counter)
    const calculatePositions = () => {
      // Position calculation logic
    };
    
    calculatePositions();
    
    // Trigger animation completion
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [targetElementId, onComplete]);
  
  if (!visible) return null;
  
  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center animate-points-float">
        <span className={`font-bold ${amount >= 0 ? 'text-success' : 'text-error'}`}>
          {amount >= 0 ? '+' : ''}{amount}
        </span>
        {reason && (
          <span className="ml-1 text-xs text-gray-700">
            {reason}
          </span>
        )}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Use smooth animations that don't disrupt user flow
  - Provide context for point earnings (reason, category)
  - Ensure animations scale well with varying point values
  - Implement graceful fallbacks for performance-constrained devices
  - Batch point animations when multiple actions occur simultaneously
  - Use subtle sound effects with user-controlled muting option

- **Potential Challenges:**
  - Animation Performance: Optimizing particle effects and animations for lower-end devices
  - Timing: Balancing animation duration for satisfaction without causing delays
  - Visual Clarity: Ensuring point animations remain visible but don't obstruct content
  - Synchronization: Coordinating animations with server-confirmed point updates

### Sub-Task 2: Achievement Notification System
**Description:** Create the notification system that celebrates user achievements with appropriate visual excitement proportional to the achievement's significance.

**Component Hierarchy:**
```
AchievementSystem/
├── AchievementNotification/    # Toast notification for new achievements
│   ├── AchievementIcon         # Visual representation
│   ├── AchievementInfo         # Name, description, points
│   └── CelebrationEffect       # Visual celebration elements
├── AchievementToastManager/    # Manages notification queue
└── AchievementSound/           # Audio feedback system
```

**Key Interface/Props:**
```tsx
interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
  autoHideDuration?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string;
}
```

**Key UI Elements:**
```tsx
// Achievement Notification Manager - Handles queue and display
function AchievementToastManager({ position = 'bottom-right' }: AchievementToastManagerProps) {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);
  
  // Listen for achievement events
  useEffect(() => {
    const handleNewAchievement = (achievement: Achievement) => {
      setQueue(prev => [...prev, achievement]);
    };
    
    // Subscribe to achievement events
    achievementService.subscribe(handleNewAchievement);
    return () => achievementService.unsubscribe(handleNewAchievement);
  }, []);
  
  // Process queue
  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [queue, current]);
  
  const handleDismiss = () => {
    setCurrent(null);
    // Add delay before showing next achievement
    setTimeout(() => {}, 500);
  };
  
  if (!current) return null;
  
  return (
    <div className={`fixed z-50 ${getPositionClasses(position)}`}>
      <AchievementNotification 
        achievement={current}
        onDismiss={handleDismiss}
        autoHideDuration={5000}
      />
    </div>
  );
}

// Achievement Notification - Shows individual achievement
function AchievementNotification({ achievement, onDismiss, autoHideDuration = 5000 }: AchievementNotificationProps) {
  // Auto-dismiss timer
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoHideDuration);
    return () => clearTimeout(timer);
  }, [autoHideDuration, onDismiss]);
  
  // Get rarity-based styling
  const rarityStyles = getRarityStyles(achievement.rarity);
  
  return (
    <div 
      className={`
        flex items-center p-4 rounded-lg shadow-lg max-w-sm w-full
        ${rarityStyles.background} animate-slide-in
      `}
    >
      <div className={`relative ${rarityStyles.iconWrapper} rounded-full p-2 mr-3`}>
        <img src={achievement.iconUrl} alt="" className="w-10 h-10" />
        <CelebrationEffect rarity={achievement.rarity} />
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className={`font-bold ${rarityStyles.textColor}`}>
            {achievement.name}
          </h3>
          <button 
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600">{achievement.description}</p>
        <div className="mt-1 text-success font-medium">
          +{achievement.points} points
        </div>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Scale celebration effects based on achievement rarity/significance
  - Use consistent animation patterns for achievement system
  - Implement notification queuing for multiple achievements
  - Provide appropriate sound effects with mute options
  - Ensure celebrations are visible but non-intrusive to main activities
  - Allow user control over notification duration and style

- **Potential Challenges:**
  - Notification Timing: Managing notification flow during high-activity periods
  - Effect Scaling: Creating appropriate celebration scales for different achievement tiers
  - Audio Management: Handling sound effects in browser limitations
  - Animation Performance: Ensuring celebrations don't impact performance negatively

### Sub-Task 3: Leaderboard Component
**Description:** Create the leaderboard interface that displays user rankings across different timeframes and categories.

**Component Hierarchy:**
```
Leaderboard/
├── LeaderboardControls/       # Timeframe and category selectors
├── LeaderboardList/           # Ranked user list
│   └── LeaderboardItem        # Individual ranking entry
├── UserRankHighlight/         # Current user's position
└── LeaderboardCategories/     # Category tabs for different boards
```

**Key Interface/Props:**
```tsx
interface LeaderboardProps {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time';
  category?: 'points' | 'posts' | 'comments' | 'achievements';
  initialData?: LeaderboardEntry[];
  currentUserId?: string;
  onTimeframeChange: (timeframe: string) => void;
  onCategoryChange?: (category: string) => void;
}

interface LeaderboardEntry {
  userId: string;
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  level: number;
  score: number;
  change?: number; // Position change since last period
}
```

**Key UI Elements:**
```tsx
function Leaderboard({ 
  timeframe, 
  category = 'points', 
  initialData = [], 
  currentUserId,
  onTimeframeChange,
  onCategoryChange 
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialData);
  const [isLoading, setIsLoading] = useState(initialData.length === 0);
  
  // Load leaderboard data when params change
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (initialData.length > 0 && !isLoading) return;
      
      setIsLoading(true);
      try {
        const data = await leaderboardService.getLeaderboard(timeframe, category);
        setEntries(data);
      } catch (error) {
        console.error('Failed to load leaderboard', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLeaderboard();
  }, [timeframe, category, initialData]);
  
  // Find current user in leaderboard
  const currentUserEntry = entries.find(entry => entry.userId === currentUserId);
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="border-b border-gray-200">
        <LeaderboardControls
          timeframe={timeframe}
          category={category}
          onTimeframeChange={onTimeframeChange}
          onCategoryChange={onCategoryChange}
        />
      </div>
      
      {isLoading ? (
        <LeaderboardSkeleton />
      ) : entries.length === 0 ? (
        <EmptyLeaderboard />
      ) : (
        <>
          <div className="divide-y divide-gray-200">
            {entries.slice(0, 10).map(entry => (
              <LeaderboardItem
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === currentUserId}
              />
            ))}
          </div>
          
          {/* Show current user if not in top 10 */}
          {currentUserEntry && currentUserEntry.rank > 10 && (
            <div className="mt-4 border-t border-gray-200 bg-gray-50">
              <LeaderboardItem
                entry={currentUserEntry}
                isCurrentUser={true}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LeaderboardItem({ entry, isCurrentUser }: { entry: LeaderboardEntry, isCurrentUser: boolean }) {
  return (
    <div className={`p-4 flex items-center ${isCurrentUser ? 'bg-primary-50' : ''}`}>
      <div className="w-8 text-center font-semibold text-gray-800">
        {entry.rank}
      </div>
      
      <div className="ml-4 flex items-center flex-1">
        <img 
          src={entry.avatarUrl} 
          alt=""
          className="w-8 h-8 rounded-full"
        />
        <div className="ml-3">
          <div className="font-medium text-gray-900">
            {entry.displayName}
            {isCurrentUser && (
              <span className="ml-2 text-xs bg-primary-light text-primary px-1 py-0.5 rounded">
                You
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            @{entry.username} • Level {entry.level}
          </div>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="font-semibold text-gray-900">
          {formatNumber(entry.score)}
        </div>
        
        {entry.change !== undefined && (
          <div className={`ml-2 text-xs ${getChangeColorClass(entry.change)}`}>
            {formatPositionChange(entry.change)}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Prominently highlight the current user's position
  - Provide clear timeframe selection (daily, weekly, monthly)
  - Show position changes to create engagement
  - Implement category tabs for different leaderboard types
  - Use appropriate loading states during data fetching
  - Include explanatory text about how rankings are calculated

- **Potential Challenges:**
  - Data Freshness: Balancing leaderboard update frequency with server load
  - Large Datasets: Efficiently handling potentially large numbers of users
  - Personal Context: Showing relevant information when user is far from top positions
  - Mobile Adaptation: Presenting detailed ranking information on small screens

### Sub-Task 4: Level Progression Visualization
**Description:** Create the level progression system that visualizes user advancement through levels with clear indicators of progress and rewards.

**Component Hierarchy:**
```
LevelSystem/
├── LevelIndicator/            # Current level display
├── ProgressBar/               # Visual progress toward next level
├── LevelUpAnimation/          # Celebration for new level
└── LevelRewards/              # Rewards for reaching level
```

**Key Interface/Props:**
```tsx
interface LevelProgressProps {
  currentLevel: number;
  currentPoints: number;
  pointsToNextLevel: number;
  totalPointsForNextLevel: number;
  rewards?: LevelReward[];
}

interface LevelReward {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlocked: boolean;
}
```

**Key UI Elements:**
```tsx
function LevelProgress({ 
  currentLevel, 
  currentPoints, 
  pointsToNextLevel,
  totalPointsForNextLevel,
  rewards = []
}: LevelProgressProps) {
  // Calculate progress percentage
  const progressPercent = Math.min(
    100, 
    (1 - pointsToNextLevel / totalPointsForNextLevel) * 100
  );
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex items-center justify-center bg-primary text-white rounded-full w-12 h-12 font-bold text-xl">
            {currentLevel}
          </div>
          <div className="ml-4">
            <div className="text-lg font-medium text-gray-900">
              Level {currentLevel}
            </div>
            <div className="text-sm text-gray-500">
              {formatNumber(currentPoints)} total points
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-medium text-gray-900">
            Level {currentLevel + 1}
          </div>
          <div className="text-sm text-gray-500">
            {formatNumber(pointsToNextLevel)} points needed
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-1 text-right text-xs text-gray-500">
          {Math.round(progressPercent)}% complete
        </div>
      </div>
      
      {rewards.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Level {currentLevel + 1} Rewards
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {rewards.map(reward => (
              <LevelRewardItem key={reward.id} reward={reward} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LevelRewardItem({ reward }: { reward: LevelReward }) {
  return (
    <div 
      className={`
        p-3 rounded-lg border text-center
        ${reward.unlocked 
          ? 'border-primary-300 bg-primary-50' 
          : 'border-gray-200 bg-gray-50 opacity-75'}
      `}
    >
      <div className="flex justify-center">
        <img 
          src={reward.iconUrl} 
          alt="" 
          className="w-8 h-8 opacity-90"
        />
      </div>
      <div className="mt-2 text-sm font-medium text-gray-900">
        {reward.name}
      </div>
      <div className="mt-1 text-xs text-gray-500 line-clamp-2">
        {reward.description}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Use smooth animations for progress bar updates
  - Clearly indicate points needed for next level
  - Show rewards for upcoming level to drive engagement
  - Implement satisfying level-up celebrations
  - Use consistent color coding for level-related elements
  - Provide context about how points contribute to levels

- **Potential Challenges:**
  - Progress Visualization: Creating intuitive representations for large point ranges
  - Animation Transitions: Smooth transitions when level progress updates
  - Level-up Experience: Creating satisfying but non-disruptive level-up moments
  - Cross-Platform Consistency: Maintaining visual quality across devices

### Sub-Task 5: Daily Streak Tracking
**Description:** Create the streak tracking system that encourages daily platform engagement through visual indicators and rewards.

**Component Hierarchy:**
```
StreakSystem/
├── StreakIndicator/           # Current streak display
├── StreakCalendar/            # Visual calendar of activity
│   └── CalendarDay            # Individual day status
├── StreakReminder/            # Time-sensitive reminders
└── StreakRewards/             # Rewards for streak milestones
```

**Key Interface/Props:**
```tsx
interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  thisWeekActivity: boolean[];
  isActiveToday: boolean;
  timeUntilReset: number; // Seconds until daily reset
  streakRewards?: StreakReward[];
}

interface StreakReward {
  days: number;
  points: number;
  name: string;
  iconUrl: string;
  achieved: boolean;
}
```

**Key UI Elements:**
```tsx
function StreakTracker({ 
  currentStreak, 
  longestStreak, 
  thisWeekActivity,
  isActiveToday,
  timeUntilReset,
  streakRewards = []
}: StreakTrackerProps) {
  // Format time until reset (HH:MM:SS)
  const formattedTimeUntilReset = formatTime(timeUntilReset);
  
  // Determine if streak is at risk (less than 4 hours left and not active today)
  const streakAtRisk = timeUntilReset < 14400 && !isActiveToday;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Daily Streak</h3>
        
        {!isActiveToday && (
          <div className={`text-sm ${streakAtRisk ? 'text-error' : 'text-gray-500'}`}>
            {streakAtRisk ? 'Streak at risk! ' : ''}
            Resets in {formattedTimeUntilReset}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-center">
        <div className="text-4xl font-bold text-primary">
          {currentStreak}
        </div>
        <div className="ml-2 text-gray-500">
          day{currentStreak !== 1 ? 's' : ''} in a row
          <div className="text-xs">Longest: {longestStreak} days</div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="grid grid-cols-7 gap-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs text-gray-500">
              {day}
            </div>
          ))}
          
          {thisWeekActivity.map((active, i) => (
            <div 
              key={i}
              className={`
                h-8 rounded-md flex items-center justify-center
                ${active 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'bg-gray-100 text-gray-400'}
              `}
            >
              {active && <CheckIcon className="w-4 h-4" />}
            </div>
          ))}
        </div>
      </div>
      
      {streakRewards.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Streak Rewards
          </h4>
          <div className="flex space-x-2 overflow-x-auto py-2">
            {streakRewards.map(reward => (
              <StreakRewardItem key={reward.days} reward={reward} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StreakRewardItem({ reward }: { reward: StreakReward }) {
  return (
    <div 
      className={`
        flex-shrink-0 p-3 rounded-lg border w-24 text-center
        ${reward.achieved
          ? 'border-success bg-success-50' 
          : 'border-gray-200'}
      `}
    >
      <div className="text-sm font-medium">
        {reward.days} days
      </div>
      <div className="mt-1">
        <img 
          src={reward.iconUrl} 
          alt="" 
          className={`w-6 h-6 mx-auto ${!reward.achieved ? 'opacity-50' : ''}`}
        />
      </div>
      <div className="mt-1 text-xs text-success font-medium">
        +{reward.points} pts
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Provide clear indicators of current streak status
  - Show time remaining until daily reset
  - Highlight when streak is at risk of breaking
  - Design satisfying visual rewards for streak milestones
  - Implement appropriate notifications for streak maintenance
  - Use subtle animations to make streak tracking engaging

- **Potential Challenges:**
  - Time Zone Handling: Ensuring daily reset times account for user time zones
  - Offline Usage: Handling streak tracking when users are temporarily offline
  - Reset Timing: Balancing strict reset times with user flexibility
  - Motivation Balance: Creating urgency without causing anxiety

## Integration Points
- Connects with User Profile Experience for displaying achievements and level
- Interfaces with Forum and Content System for awarding points on engagement
- Provides feedback for Authentication system during onboarding
- Integrates with Notification System for achievement alerts
- Connects with Wallet Integration for token-holder related achievements

## Testing Strategy
- Component testing of all gamification display components
- Animation testing for performance and visual quality
- Integration testing with point earning actions
- State transition testing for achievement unlocking
- Responsive testing across device sizes
- Time-based testing for streak functionality
- Accessibility testing for all interactive elements

## Definition of Done
This task is complete when:
- [ ] Points display and animation system provides immediate feedback
- [ ] Achievement notification system shows unlocks with appropriate celebration
- [ ] Leaderboard component displays rankings with proper sorting and filtering
- [ ] Level progression visualization shows clear path to advancement
- [ ] Daily streak tracking encourages consistent engagement
- [ ] All components adapt to different screen sizes and orientations
- [ ] Animations enhance the experience without performance impact
- [ ] All components include appropriate loading and empty states
- [ ] Full keyboard navigation and screen reader support is implemented
- [ ] All components follow the design system specifications
- [ ] State changes are reflected consistently across components
- [ ] Points, achievements, and level calculations match backend logic