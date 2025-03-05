# Task 8: Notification and Activity System

## Task Overview
Implement the notification and activity tracking system that keeps users informed of relevant platform events, interactions with their content, and community updates. This feature enhances engagement by keeping users connected to the platform, drawing them back for meaningful interactions, and providing transparency into community activity.

## Required Document Review
- **Masterplan Document** - Section 4.2.3 (Notification System) for notification types
- **App Flow Document** - Section 4.1.3 (Activity Feed Implementation)
- **Frontend & Backend Guidelines** - Section 5.3 (Data Flow) for real-time updates

## User Experience Flow
1. **Notification Receipt:** User receives real-time notification of relevant events
2. **Notification Review:** User checks notification center to view recent notifications
3. **Notification Management:** User configures notification preferences and marks items as read
4. **Activity Tracking:** User views comprehensive activity feed of platform events
5. **Real-time Updates:** User receives dynamic updates while actively using the platform

## Implementation Sub-Tasks

### Sub-Task 1: Notification Center Component
**Description:** Create the notification center component that collects and displays user-specific notifications with appropriate categorization and management.

**Component Hierarchy:**
```
NotificationCenter/
├── NotificationButton/     # Trigger button with indicator badge
├── NotificationDropdown/   # Expandable notification list
│   ├── NotificationHeader  # Header with management options
│   ├── NotificationList    # Scrollable notification container
│   │   └── NotificationItem # Individual notification display
│   └── NotificationFooter  # View all link and other controls
└── NotificationService     # Notification state management
```

**Key Interface/Props:**
```tsx
interface NotificationCenterProps {
  initialNotifications?: Notification[];
  onMarkAsRead: (ids: string[]) => Promise<void>;
  onClearAll: () => Promise<void>;
}

interface Notification {
  id: string;
  type: 'reply' | 'mention' | 'like' | 'follow' | 'achievement' | 'system' | 'market';
  content: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  sender?: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  data?: Record<string, any>; // Additional type-specific data
}
```

**Key UI Elements:**
```tsx
function NotificationCenter({ initialNotifications = [], onMarkAsRead, onClearAll }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Subscribe to real-time notifications
  useEffect(() => {
    const subscription = notificationService.subscribe(newNotification => {
      setNotifications(prev => [newNotification, ...prev]);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Handle marking notifications as read
  const handleMarkAsRead = async (ids: string[]) => {
    try {
      await onMarkAsRead(ids);
      setNotifications(prev => 
        prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button with notification indicator */}
      <button
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <button
              onClick={onClearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>

          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead([notification.id])}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Group similar notifications to reduce clutter
  - Show clear unread indicators
  - Implement batch actions for notifications (mark all read)
  - Use distinct visual treatment for different notification types
  - Include actionable links to relevant content

- **Potential Challenges:**
  - Real-time Delivery: Ensuring timely notification delivery
  - Notification Volume: Managing high-volume notifications without overwhelming users
  - Context Preservation: Providing sufficient context without verbose notifications

### Sub-Task 2: Real-time Update Indicators
**Description:** Implement visual indicators that show when content updates in real-time while users are on the platform.

**Component Hierarchy:**
```
RealTimeIndicators/
├── UpdateIndicator/     # New content indicator with count
├── ActivityCounter/     # Current active users indicator
├── LiveBadge/           # Real-time content indicator
└── UpdateService/       # Manages update state and subscriptions
```

**Key Interface/Props:**
```tsx
interface UpdateIndicatorProps {
  count: number;
  onClick: () => void;
  type: 'posts' | 'comments' | 'activity' | 'generic';
}

interface ActivityCounterProps {
  count: number;
  pulse?: boolean;
}
```

**Key UI Elements:**
```tsx
function UpdateIndicator({ count, onClick, type }: UpdateIndicatorProps) {
  if (count === 0) return null;
  
  const getTypeLabel = () => {
    switch (type) {
      case 'posts': return count === 1 ? 'new post' : 'new posts';
      case 'comments': return count === 1 ? 'new comment' : 'new comments';
      case 'activity': return count === 1 ? 'new activity' : 'new activities';
      default: return 'new updates';
    }
  };
  
  return (
    <button
      onClick={onClick}
      className="w-full bg-primary-50 hover:bg-primary-100 text-primary font-medium py-2 px-4 rounded-md mt-2 flex items-center justify-center"
    >
      <ArrowUpIcon className="w-4 h-4 mr-2" />
      {count} {getTypeLabel()}
    </button>
  );
}

function LiveActivityCounter({ count, pulse = true }: ActivityCounterProps) {
  return (
    <div className="flex items-center text-xs text-gray-500">
      <div className="relative mr-1.5">
        <div className="w-2 h-2 bg-success rounded-full"></div>
        {pulse && (
          <div className="absolute inset-0">
            <div className="w-2 h-2 bg-success rounded-full animate-ping opacity-75"></div>
          </div>
        )}
      </div>
      {count} active now
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Use subtle animations to draw attention without distraction
  - Implement "new content" indicators when content updates off-screen
  - Show precise counts for smaller numbers, approximate for larger amounts
  - Batch updates to prevent UI flickering with frequent changes

- **Potential Challenges:**
  - Update Frequency: Balancing real-time updates with UI stability
  - Performance Impact: Minimizing rendering impact of frequent updates
  - Context Relevance: Showing updates only for content the user cares about

### Sub-Task 3: Activity Feed Implementation
**Description:** Create the activity feed that displays platform events and user actions in a chronological, filterable timeline.

**Component Hierarchy:**
```
ActivityFeed/
├── ActivityFilters/       # Filter controls for activity types
├── ActivityList/          # Chronological list of activities
│   ├── ActivityDay        # Day grouping with date header
│   └── ActivityItem       # Individual activity entry
│       ├── ActivityIcon   # Visual indicator of activity type
│       ├── ActivityContent # Description of the activity
│       └── ActivityMeta   # Time and additional metadata
└── ActivityLoadMore       # Control to load additional activities
```

**Key Interface/Props:**
```tsx
interface ActivityFeedProps {
  userId: string;
  initialActivities?: Activity[];
  filter?: ActivityFilter;
  onFilterChange?: (filter: ActivityFilter) => void;
}

interface Activity {
  id: string;
  type: ActivityType;
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  content: string;
  timestamp: string;
  target?: {
    id: string;
    type: string;
    title?: string;
  };
  data?: Record<string, any>;
}

type ActivityType = 'post' | 'comment' | 'like' | 'follow' | 'achievement' | 'level' | 'token' | 'system';

interface ActivityFilter {
  types: ActivityType[];
  userIds?: string[];
  startDate?: string;
  endDate?: string;
}
```

**Key UI Elements:**
```tsx
function ActivityFeed({ initialActivities = [], filter, onFilterChange }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isLoading, setIsLoading] = useState(initialActivities.length === 0);
  const [currentFilter, setCurrentFilter] = useState<ActivityFilter>(filter || { 
    types: ['post', 'comment', 'like', 'follow', 'achievement', 'level', 'token', 'system'] 
  });
  
  // Group activities by day for display
  const groupedActivities = useMemo(() => {
    return groupActivitiesByDay(activities);
  }, [activities]);
  
  // Fetch activities when filter changes
  useEffect(() => {
    if (currentFilter !== filter) {
      fetchActivities(currentFilter);
    }
  }, [currentFilter, filter]);
  
  return (
    <div className="space-y-6">
      {/* Filter controls */}
      <div className="flex flex-wrap gap-2">
        {(['post', 'comment', 'like', 'follow', 'achievement'] as ActivityType[]).map(type => (
          <FilterChip
            key={type}
            label={capitalizeFirstLetter(type)}
            isActive={currentFilter.types.includes(type)}
            onClick={() => handleTypeFilterChange(type)}
          />
        ))}
      </div>
      
      {/* Activity list */}
      {isLoading ? (
        <ActivitySkeleton />
      ) : activities.length === 0 ? (
        <EmptyState message="No activities found" />
      ) : (
        Object.entries(groupedActivities).map(([date, dayActivities]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-gray-500 sticky top-0 bg-white py-2">
              {formatActivityDate(date)}
            </h3>
            
            <div className="mt-2 space-y-4">
              {dayActivities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const { icon, color } = getActivityTypeConfig(activity.type);
  
  return (
    <div className="flex space-x-3">
      {/* Actor avatar */}
      <img 
        src={activity.actor.avatarUrl} 
        alt=""
        className="w-10 h-10 rounded-full"
      />
      
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900">
          <span className="font-medium">{activity.actor.displayName}</span>
          {' '}{activity.content}
          {activity.target?.title && (
            <span className="font-medium"> "{activity.target.title}"</span>
          )}
        </div>
        
        <div className="mt-1 flex items-center text-xs text-gray-500">
          <span>{formatTimeAgo(activity.timestamp)}</span>
          
          {/* Activity type indicator */}
          <span className="mx-1.5">•</span>
          <span className={`inline-flex items-center text-${color}-600`}>
            {icon}
            <span className="ml-1">{capitalizeFirstLetter(activity.type)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Group activities by day for better context
  - Implement flexible filtering options for activity types
  - Show relevant user and content information for context
  - Use appropriate iconography for different activity types
  - Include pagination or infinite scrolling for large activity volumes

- **Potential Challenges:**
  - Data Volume: Efficiently handling large activity histories
  - Filter Complexity: Balancing filter options with usability
  - Context Restoration: Providing sufficient activity context

### Sub-Task 4: Notification Preference Management
**Description:** Create the interface for users to configure which notifications they receive and how they are delivered.

**Component Hierarchy:**
```
NotificationPreferences/
├── PreferenceForm/        # Main settings container
│   ├── GlobalToggle       # Master notification toggle
│   ├── ChannelToggles     # Delivery method settings
│   ├── CategorySettings   # Per-category notification settings
│   │   └── CategoryToggle # Toggle for specific notification type
│   └── SubmitControls     # Save/cancel buttons
└── PreferenceService      # Preference state management
```

**Key Interface/Props:**
```tsx
interface NotificationPreferencesProps {
  preferences: NotificationPreferences;
  onSave: (preferences: NotificationPreferences) => Promise<void>;
}

interface NotificationPreferences {
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  categories: {
    [key in NotificationCategory]: {
      enabled: boolean;
      channels: {
        email: boolean;
        push: boolean;
        inApp: boolean;
      };
    };
  };
}

type NotificationCategory = 
  | 'replies' 
  | 'mentions' 
  | 'likes' 
  | 'follows' 
  | 'achievements' 
  | 'levelUps' 
  | 'marketAlerts' 
  | 'system';
```

**Key UI Elements:**
```tsx
function NotificationPreferences({ preferences, onSave }: NotificationPreferencesProps) {
  const [formState, setFormState] = useState<NotificationPreferences>(preferences);
  const [isSaving, setIsSaving] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await onSave(formState);
    } catch (error) {
      console.error('Failed to save notification preferences', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Master switch */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          <p className="text-sm text-gray-500">Manage how you receive notifications</p>
        </div>
        <Switch
          checked={formState.enabled}
          onChange={() => setFormState(prev => ({...prev, enabled: !prev.enabled}))}
          label="Enable all notifications"
        />
      </div>
      
      {/* Global delivery channels */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Delivery Channels</h4>
        <div className="space-y-3">
          <ChannelToggle
            channel="inApp"
            label="In-app"
            checked={formState.channels.inApp}
            onChange={() => handleToggleChannel('inApp')}
            disabled={!formState.enabled}
          />
          <ChannelToggle
            channel="email"
            label="Email"
            checked={formState.channels.email}
            onChange={() => handleToggleChannel('email')}
            disabled={!formState.enabled}
          />
          <ChannelToggle
            channel="push"
            label="Push notifications"
            checked={formState.channels.push}
            onChange={() => handleToggleChannel('push')}
            disabled={!formState.enabled}
          />
        </div>
      </div>
      
      {/* Categories */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Notification Categories</h4>
        
        {(Object.keys(formState.categories) as NotificationCategory[]).map(category => (
          <CategoryPreference
            key={category}
            category={category}
            preferences={formState.categories[category]}
            disabled={!formState.enabled}
            onToggleEnabled={() => handleToggleCategory(category)}
            onToggleChannel={(channel) => handleToggleCategoryChannel(category, channel)}
          />
        ))}
      </div>
      
      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Organize preferences by notification category
  - Provide global and per-category settings
  - Include clear explanations of notification types
  - Support different delivery channels (in-app, email, push)
  - Use appropriate toggles and controls for settings

- **Potential Challenges:**
  - Preference Complexity: Balancing granular control with simplicity
  - Channel Management: Handling different delivery mechanisms
  - Default Settings: Determining appropriate defaults for new users

## Integration Points
- Connects with Authentication system for user-specific notifications
- Interfaces with Forum and Content System for content-related notifications
- Provides data for Gamification System regarding achievements and levels
- Integrates with Wallet Integration for transaction notifications
- Sets foundation for all real-time platform updates

## Testing Strategy
- Component testing of notification display and management
- Real-time event testing with simulated notifications
- Preference management testing for all settings combinations
- Activity feed filtering and display testing
- Mobile responsive testing for notification components
- Accessibility testing for all interactive elements
- Performance testing with large volumes of notifications

## Definition of Done
This task is complete when:
- [ ] Notification center displays user notifications with appropriate categorization
- [ ] Real-time update indicators show when new content is available
- [ ] Activity feed displays platform events in a chronological timeline
- [ ] Notification preference management allows users to configure delivery
- [ ] All components handle loading, empty, and error states appropriately
- [ ] Real-time updates work reliably across the platform
- [ ] Components adapt appropriately to different screen sizes
- [ ] Notification interactions (mark as read, clear all) function correctly
- [ ] Activity filtering works correctly for different event types
- [ ] All interactive elements are accessible via keyboard and screen readers
- [ ] Performance remains stable with large volumes of notifications