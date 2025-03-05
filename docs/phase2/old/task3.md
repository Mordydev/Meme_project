  # Task 3: User Profile Experience

## Task Overview
Implement the comprehensive user profile system that serves as the personal identity center for community members, showcasing their achievements, statistics, and activity while enabling self-expression through customization options. This feature embodies the Success Kid ethos by celebrating user accomplishments and community contributions.

## Required Document Review
- **Design System Document** - Section 3.5 (Imagery and Iconography System) for profile imagery guidelines
- **Masterplan Document** - Section 4.5 (Profile & Social Features) for detailed profile requirements
- **App Flow Document** - Section 4.2.3 (User Profiles) for profile component structure
- **Frontend & Backend Guidelines** - Sections 5.2 (Data Models) and 7.1 (Design System) for implementation patterns

## User Experience Flow
1. **Profile Access:** User accesses their profile through navigation or clicks on another user's profile from content
2. **Visual Identity:** User sees profile header with avatar, username, level, and key stats
3. **Achievement Showcase:** User can view and interact with achievement badges organized by categories
4. **Statistics Display:** User can see their community statistics and contribution metrics
5. **Activity History:** User can browse their recent activity and contributions
6. **Customization:** User can edit their own profile, including avatar, bio, and display preferences
7. **Social Connection:** User can follow others and see mutual connections
8. **Token Integration:** User with connected wallet can see token holdings and related statistics

## Implementation Sub-Tasks

### Sub-Task 1: Profile Display Component
**Description:** Create the primary profile display component that showcases user identity, achievements, and statistics in a visually engaging way.

**Component Hierarchy:**
```
ProfileDisplay/
├── ProfileHeader/         # Main profile identity section
│   ├── AvatarDisplay      # User avatar with frame based on level
│   ├── UserIdentity       # Username, display name, join date
│   ├── UserStats          # Key performance statistics
│   └── ActionButtons      # Follow, message, edit actions
├── ProfileTabs/           # Tab navigation for profile sections
│   ├── Overview           # General profile information
│   ├── Achievements       # Achievement collection display
│   ├── Activity           # Recent user activity
│   ├── Content            # User-created content
│   └── WalletStats        # Blockchain-related information (if connected)
└── ProfileContent/        # Dynamic content area for selected tab
```

**Key Interface/Props:**
```tsx
interface ProfileDisplayProps {
  user: UserProfile;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  onEditProfile?: () => void;
  onSendMessage?: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  level: number;
  bio: string;
  joinDate: string;
  stats: {
    points: number;
    posts: number;
    comments: number;
    achievements: number;
    followers: number;
    following: number;
  };
  walletConnected: boolean;
  // Additional properties as needed
}
```

**Key UI Elements:**
```tsx
function ProfileHeader({ user, isOwnProfile, isFollowing, onFollowToggle, onEditProfile, onSendMessage }: ProfileHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Cover image */}
      <div className="h-32 bg-gradient-to-r from-primary-light to-primary relative">
        {isOwnProfile && (
          <button 
            className="absolute top-2 right-2 bg-white bg-opacity-70 p-1 rounded-full hover:bg-opacity-100"
            aria-label="Change cover image"
          >
            <CameraIcon className="w-5 h-5 text-gray-700" />
          </button>
        )}
      </div>
      
      {/* Profile info */}
      <div className="px-4 py-5 sm:px-6 -mt-16 flex flex-col sm:flex-row">
        <div className="flex flex-col sm:flex-row items-center sm:space-x-5">
          <div className="relative">
            <img 
              src={user.avatarUrl} 
              alt={user.displayName} 
              className="h-24 w-24 rounded-full border-4 border-white object-cover bg-white"
            />
            <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-medium border-2 border-white">
              {user.level}
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0 text-center sm:text-left">
            <h1 className="text-xl font-bold text-gray-900">{user.displayName}</h1>
            <p className="text-sm text-gray-500">@{user.username}</p>
            <p className="text-xs text-gray-400 mt-1">Joined {formatDate(user.joinDate)}</p>
            
            {user.bio && (
              <p className="mt-2 text-gray-700">{user.bio}</p>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="mt-4 sm:mt-0 sm:ml-auto flex space-x-2">
          {isOwnProfile ? (
            <button 
              onClick={onEditProfile}
              className="btn btn-outline-primary px-4 py-1 text-sm"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button 
                onClick={onFollowToggle}
                className={`btn ${isFollowing ? 'btn-outline-primary' : 'btn-primary'} px-4 py-1 text-sm`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button 
                onClick={onSendMessage}
                className="btn btn-outline-primary px-4 py-1 text-sm"
              >
                Message
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="border-t border-gray-200 bg-gray-50 grid grid-cols-3 md:grid-cols-6 divide-x divide-gray-200">
        {/* Stats items for points, posts, achievements, followers, etc. */}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement skeleton loading state for profile data
  - Use optimistic UI updates for social actions
  - Create clear visual hierarchy of profile information
  - Ensure all interactive elements have appropriate hover/focus states
  - Design for different content amounts (short/long bio, many/few achievements)
  - Implement proper error states for data loading failures

- **Potential Challenges:**
  - Content Density: Balancing information display with visual clarity
  - Responsive Layout: Adapting profile layout across device sizes
  - Data Dependencies: Handling partially loaded profile data gracefully

### Sub-Task 2: Achievement Showcase
**Description:** Create the achievement display system that showcases user accomplishments with appropriate visual treatments and organization.

**Component Hierarchy:**
```
AchievementShowcase/
├── AchievementTabs/       # Category navigation for achievements
├── AchievementGrid/       # Grid display of achievements
│   ├── AchievementCard    # Individual achievement display
│   │   ├── AchievementIcon    # Visual representation
│   │   ├── AchievementInfo    # Name, description, date
│   │   └── AchievementRarity  # Rarity indicator
│   └── LockedAchievement  # Placeholder for locked achievements
├── AchievementProgress/   # Progress tracking for incomplete achievements
└── AchievementDetail/     # Expanded view of selected achievement
```

**Key Interface/Props:**
```tsx
interface AchievementShowcaseProps {
  achievements: Achievement[];
  lockedAchievements?: Achievement[];
  inProgressAchievements?: InProgressAchievement[];
  showLocked?: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt?: string; // Only present for unlocked achievements
}

interface InProgressAchievement extends Achievement {
  currentProgress: number;
  targetProgress: number;
  percentComplete: number;
}
```

**State Management:**
```tsx
// Filter and organization state
const [activeCategory, setActiveCategory] = useState('all');
const [sortMethod, setSortMethod] = useState<'recent' | 'rarity' | 'alphabetical'>('recent');

// Detail view state
const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

// Filter achievements by category
const filteredAchievements = useMemo(() => {
  if (activeCategory === 'all') return props.achievements;
  return props.achievements.filter(a => a.category === activeCategory);
}, [props.achievements, activeCategory]);

// Sort achievements based on selected method
const sortedAchievements = useMemo(() => {
  return [...filteredAchievements].sort((a, b) => {
    switch (sortMethod) {
      case 'recent':
        return new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime();
      case 'rarity':
        const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}, [filteredAchievements, sortMethod]);
```

**Key UI Elements:**
```tsx
function AchievementCard({ achievement, isLocked, inProgress, progressPercent, onClick }: AchievementCardProps) {
  // Determine background color based on rarity
  const rarityColors = {
    common: 'bg-gray-100',
    uncommon: 'bg-green-100',
    rare: 'bg-blue-100',
    epic: 'bg-purple-100',
    legendary: 'bg-yellow-100'
  };
  
  // Determine border color based on rarity
  const rarityBorders = {
    common: 'border-gray-300',
    uncommon: 'border-green-300',
    rare: 'border-blue-300',
    epic: 'border-purple-300',
    legendary: 'border-yellow-300'
  };
  
  return (
    <div 
      className={`
        relative rounded-lg border-2 overflow-hidden cursor-pointer transition-transform hover:scale-105
        ${isLocked ? 'border-gray-200 bg-gray-50' : rarityBorders[achievement.rarity]}
      `}
      onClick={onClick}
    >
      <div className={`p-4 text-center ${isLocked ? 'opacity-50' : ''}`}>
        <div className={`
          w-16 h-16 mx-auto rounded-full p-2 flex items-center justify-center
          ${isLocked ? 'bg-gray-200' : rarityColors[achievement.rarity]}
        `}>
          {isLocked ? (
            <LockIcon className="w-8 h-8 text-gray-400" />
          ) : (
            <img 
              src={achievement.iconUrl} 
              alt={achievement.name} 
              className="w-10 h-10"
            />
          )}
        </div>
        
        <h3 className="mt-2 font-medium text-gray-900">
          {achievement.name}
        </h3>
        
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {achievement.description}
        </p>
        
        {/* Progress indicator for in-progress achievements */}
        {inProgress && progressPercent !== undefined && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {progressPercent}% Complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Group achievements by categories for easier browsing
  - Create visual differentiation based on rarity levels
  - Implement clear locked vs. unlocked states
  - Show progress indicators for in-progress achievements
  - Use subtle animations for achievement interactions
  - Include achievement date and points value for context

- **Potential Challenges:**
  - Visual Scaling: Maintaining visual appeal with varying numbers of achievements
  - Progress Tracking: Accurately displaying progress for complex achievements
  - Performance: Efficiently rendering potentially large numbers of achievements

### Sub-Task 3: Activity and Statistics Display
**Description:** Create the activity feed component that displays platform events and user actions in a chronological, filterable timeline, along with statistical visualizations of user contributions.

**Component Hierarchy:**
```
ActivityTimeline/
├── ActivityFilters/       # Filter controls for activity types
├── ActivityFeed/          # Chronological list of activities
│   ├── ActivityDay        # Day grouping with date header
│   └── ActivityItem       # Individual activity entry
│       ├── ActivityIcon   # Visual indicator of activity type
│       ├── ActivityContent # Description of the activity
│       └── ActivityMeta   # Time and additional metadata
└── ActivityLoadMore       # Control to load additional activities

StatsDisplay/
├── PointsOverview/        # Summary of points and level
│   ├── PointsCounter      # Total points display
│   ├── LevelIndicator     # Current level with progress
│   └── NextMilestone      # Points to next level
├── StatsBreakdown/        # Detailed statistics categorization
│   ├── StatCategory       # Grouped related statistics
│   └── StatItem           # Individual statistic display
├── PointsHistory/         # Recent points transactions
└── AchievementStats/      # Achievement collection progress
```

**Key Interface/Props:**
```tsx
interface ActivityTimelineProps {
  userId: string;
  initialActivities?: UserActivity[];
  filter?: ActivityFilter;
  onFilterChange?: (filter: ActivityFilter) => void;
}

interface UserActivity {
  id: string;
  type: 'post' | 'comment' | 'like' | 'follow' | 'achievement' | 'level' | 'token' | 'system';
  timestamp: string;
  content: string;
  referenceId?: string;
  referenceType?: string;
  referenceTitle?: string;
  points?: number;
}

interface StatsDisplayProps {
  userId: string;
  userStats: UserStats;
  pointsHistory?: PointsTransaction[];
  showDetailed?: boolean;
}

interface UserStats {
  totalPoints: number;
  currentLevel: number;
  pointsToNextLevel: number;
  nextLevelThreshold: number;
  levelProgress: number;
  // Additional statistical categories
}
```

**Key UI Elements:**
```tsx
function ActivityItem({ activity }: { activity: UserActivity }) {
  // Get icon and color based on activity type
  const { icon, color } = getActivityTypeConfig(activity.type);
  
  return (
    <div className="flex space-x-3">
      {/* Actor avatar or activity type icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${color} p-2`}>
        {icon}
      </div>
      
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-900">
          {activity.content}
          {activity.referenceTitle && (
            <span className="font-medium"> "{activity.referenceTitle}"</span>
          )}
        </p>
        
        <div className="mt-1 flex items-center text-xs text-gray-500">
          <span>{formatTime(activity.timestamp)}</span>
          
          {activity.points && (
            <>
              <span className="mx-1">&middot;</span>
              <span className="text-success">+{activity.points} points</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PointsOverview({ totalPoints, currentLevel, pointsToNextLevel, nextLevelThreshold, levelProgress }: PointsOverviewProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Points & Level</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your progress and achievements in the community
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-center">
            <p className="text-3xl font-bold text-primary">
              {totalPoints.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Total Points</p>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center">
                <span className="font-bold">{currentLevel}</span>
              </div>
              <span className="ml-2 font-medium text-gray-900">Level {currentLevel}</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500">
                {pointsToNextLevel.toLocaleString()} points to Level {currentLevel + 1}
              </span>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="bg-gray-200 rounded-full h-2.5 w-full">
              <div 
                className="bg-primary rounded-full h-2.5 transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Group activities by day for better context and organization
  - Implement flexible filtering options for activity types
  - Show relevant user and content information for context
  - Use appropriate iconography for different activity types
  - Include pagination or infinite scrolling for large activity volumes
  - Create visual progress indicators for level advancement
  - Implement data visualization for complex statistics

- **Potential Challenges:**
  - Data Volume: Efficiently handling large activity histories
  - Filter Complexity: Balancing filter options with usability
  - Context Restoration: Providing sufficient activity context
  - Visual Clarity: Creating intuitive visualizations for complex statistics

### Sub-Task 4: Profile Edit Interface
**Description:** Create the profile editing interface that allows users to customize their identity, preferences, and display options.

**Component Hierarchy:**
```
ProfileEdit/
├── EditForm/             # Main editing form container
│   ├── AvatarEditor      # Image upload and cropping tool
│   ├── IdentityFields    # Name and username fields
│   ├── BioEditor         # Profile bio with character counter
│   ├── InterestSelector  # Interest category selection
│   └── PrivacySettings   # Profile visibility options
├── ProfilePreview        # Live preview of changes
└── ActionButtons         # Save, cancel, reset actions
```

**Key Interface/Props:**
```tsx
interface ProfileEditProps {
  user: UserProfile;
  onSave: (updatedProfile: UserProfileUpdate) => Promise<void>;
  onCancel: () => void;
}

interface UserProfileUpdate {
  displayName?: string;
  username?: string;
  bio?: string;
  avatarFile?: File;
  avatarUrl?: string;
  interests?: string[];
  privacySettings?: {
    profileVisibility?: 'public' | 'members' | 'private';
    activityVisibility?: 'public' | 'members' | 'private';
    walletVisibility?: 'public' | 'members' | 'private';
  };
}
```

**State Management:**
```tsx
// Form state
const [formState, setFormState] = useState<UserProfileUpdate>({
  displayName: user.displayName,
  username: user.username,
  bio: user.bio || '',
  interests: user.interests || [],
  privacySettings: user.privacySettings || {
    profileVisibility: 'public',
    activityVisibility: 'members',
    walletVisibility: 'private'
  }
});

// Form validation
const [errors, setErrors] = useState<Record<string, string>>({});
const [isDirty, setIsDirty] = useState(false);
const [isSaving, setIsSaving] = useState(false);

// Avatar state
const [avatarFile, setAvatarFile] = useState<File | null>(null);
const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

// Handle form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  setIsSaving(true);
  
  try {
    // Prepare submission data
    const updateData: UserProfileUpdate = { ...formState };
    
    // Add avatar file if changed
    if (avatarFile) {
      updateData.avatarFile = avatarFile;
    }
    
    await props.onSave(updateData);
  } catch (error) {
    console.error('Failed to save profile', error);
    setErrors({ submit: 'Failed to save profile. Please try again.' });
  } finally {
    setIsSaving(false);
  }
};
```

**Key UI Elements:**
```tsx
function ProfileEditForm({ user, formState, errors, onChange, onSubmit, onCancel, isSaving }: ProfileEditFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Information</h3>
          <p className="mt-1 text-sm text-gray-500">Update your profile information visible to other community members.</p>
          
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Avatar editor */}
            <div className="sm:col-span-6">
              <AvatarEditor 
                currentAvatarUrl={user.avatarUrl}
                onImageSelected={onChange.onAvatarChange}
                previewUrl={formState.avatarPreviewUrl}
              />
            </div>
            
            {/* Display name */}
            <div className="sm:col-span-3">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="displayName"
                  id="displayName"
                  value={formState.displayName}
                  onChange={onChange.onInputChange}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md
                    ${errors.displayName ? 'border-red-300' : ''}`}
                />
              </div>
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
              )}
            </div>
            
            {/* Username */}
            <div className="sm:col-span-3">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <div className="relative rounded-md shadow-sm">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    @
                  </span>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formState.username}
                    onChange={onChange.onInputChange}
                    className={`pl-7 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md
                      ${errors.username ? 'border-red-300' : ''}`}
                  />
                </div>
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
            
            {/* Bio */}
            <div className="sm:col-span-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <div className="mt-1">
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={formState.bio}
                  onChange={onChange.onInputChange}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md
                    ${errors.bio ? 'border-red-300' : ''}`}
                  maxLength={160}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500 flex justify-between">
                <span>Brief description for your profile.</span>
                <span>{formState.bio.length}/160</span>
              </p>
            </div>
            
            {/* Additional form fields for interests, privacy settings, etc. */}
          </div>
        </div>
      </div>
      
      {/* Form actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement real-time validation with clear error messages
  - Provide character counter for limited-length fields
  - Show live preview of profile changes when possible
  - Add optimistic UI updates for better user experience
  - Include cancel option that reverts all changes
  - Validate changes both client-side and server-side
  - Preserve unsaved changes if user navigates away accidentally

- **Potential Challenges:**
  - Image Processing: Handling avatar image upload, cropping, and optimization
  - Username Uniqueness: Checking username availability in real-time
  - Validation: Balancing immediate feedback with overwhelming error messages

## Integration Points
- Connects with Authentication system for user identity information
- Interfaces with Gamification System for achievements and points data
- Provides foundation for Forum and Content System user attribution
- Interacts with Wallet Integration UI for token-related information
- Sets context for Notification and Activity System

## Testing Strategy
- Component testing of all profile display and editing functions
- Form validation testing with various input scenarios
- Integration testing of profile data retrieval and updates
- Achievement display testing with different achievement quantities
- Responsive testing across device sizes for layout adaptation
- Accessibility testing for all interactive elements
- Performance testing with large data sets (many achievements, long activity histories)

## Definition of Done
This task is complete when:
- [ ] Profile display component shows user information and statistics
- [ ] Achievement showcase presents user accomplishments with appropriate visual treatment
- [ ] Activity timeline displays user history with proper categorization and filtering
- [ ] Profile editing interface allows complete customization with validation
- [ ] Points and statistics visualization presents data in an engaging way
- [ ] All components adapt appropriately to different screen sizes
- [ ] Profile data changes are properly reflected in real-time
- [ ] All interactive elements have appropriate hover/focus states
- [ ] Loading, empty, and error states are properly handled
- [ ] Full keyboard navigation and screen reader support is implemented
- [ ] All components follow design system specifications
- [ ] API integration points are clearly documented