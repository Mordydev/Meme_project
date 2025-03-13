# Success Kid Community Platform: Phase 2 Table of Contents

## Project Understanding Summary

The Success Kid Community Platform is designed to transform a viral meme token into a sustainable digital community with genuine utility and engagement. The platform combines community features, token integration, and gamification to create a vibrant ecosystem that embodies the Success Kid ethos of determination, achievement, and positivity.

Phase 1 has already established the foundational architecture, including:
- Project repository with monorepo structure
- Core frontend architecture with React, TypeScript, and Tailwind CSS
- Backend infrastructure with Supabase
- Basic component structure following Atomic Design principles
- Initial routing and application structure

Phase 2 will implement all frontend components and features needed to create a fully functional user experience, preparing for backend integration in Phase 3.

## Main Tasks for Phase 2

1. **User Authentication and Onboarding Flow**
   - Authentication Components Structure
   - Onboarding Wizard Implementation
   - Profile Setup Component
   - First Achievement Implementation
   - Authentication State Integration

2. **Navigation and Core Layout Implementation**
   - Navigation Component Architecture
   - Mobile Navigation Implementation
   - Desktop Navigation Implementation
   - Responsive Layout System
   - Header Component Implementation

3. **User Profile Experience**
   - Profile Display Component
   - Achievement Showcase
   - Activity and Statistics Display
   - Profile Edit Interface

4. **Wallet Integration UI**
   - Wallet Connection Flow
   - Token Balance and Valuation Display
   - Transaction History Component
   - Wallet Status Indicator

5. **Forum and Content System**
   - Category Browser Component
   - Post List Component
   - Post Detail Component
   - Comment System
   - Content Creation Editor

6. **Gamification System Frontend**
   - Points Display and Animation
   - Achievement Notification System
   - Leaderboard Component
   - Level Progression Visualization
   - Daily Streak Tracking

7. **Market Data Visualization**
   - Price Chart Component
   - Market Cap Visualization
   - Transaction Feed Component
   - Price Alert Configuration

8. **Notification and Activity System**
   - Notification Center Component
   - Real-time Update Indicators
   - Activity Feed Implementation
   - Notification Preference Management

9. **Search and Discovery Components**
   - Search Interface Implementation
   - Results Display Component
   - Filter and Sort Controls
   - Discovery Features

10. **Animation and Micro-interaction System**
    - Page Transition Animations
    - Achievement Celebration Animations
    - Feedback Micro-interactions
    - Loading State Animations

11. **Accessibility Implementation**
    - Keyboard Navigation System
    - Screen Reader Compatibility
    - Focus Management System
    - High Contrast Mode Support

12. **Testing and Quality Assurance**
    - Component Test Suite
    - Integration Test Suite
    - Accessibility Testing
    - Responsive Behavior Testing
    - Performance Optimization

## Development Approach

Each task will be implemented with:
- Strong adherence to the established design system
- Mobile-first responsive approach
- Accessibility as a core requirement
- Performance optimization
- Clear documentation for backend integration
- Comprehensive test coverage

# Task 1: User Authentication and Onboarding Flow

## Task Overview
Implement the complete user authentication experience including registration, login, and onboarding processes that align with the Success Kid ethos. This foundation enables users to join the community, establish their identity, and begin their engagement journey with proper guidance and initial achievements.

## Required Document Review
- **Frontend & Backend Guidelines** - Review section 6.1 (Authentication Mechanisms) for auth flow implementation
- **App Flow Document** - Review section 4.2 (User Registration & Onboarding) for detailed user journey
- **Design System Document** - Review sections 2.2 (User Journey Design Mapping) and 4.1 (Voice and Tone Framework) for onboarding experience design
- **Phase 1 Artifacts** - Review Authentication & Security Framework task for integration points

## User Experience Flow
1. **Entry Point:** User arrives at the platform and is presented with welcome screen showcasing Success Kid branding and core value proposition
2. **Registration:** User selects registration method (email, social, wallet) and completes a streamlined form
3. **Verification:** Email verification or wallet signature verification based on chosen method
4. **Onboarding Guide:** User is guided through interactive 3-step walkthrough highlighting key platform features
5. **First Achievement:** User receives "New Arrival" achievement with points and visual feedback
6. **Profile Setup:** User completes basic profile with username, avatar (Success Kid-themed options available), and optional bio
7. **Community Introduction:** User is introduced to personalized feed with recommended content and actions
8. **Onboarding Completion:** User receives confirmation of successful setup with suggested next steps

## Implementation Sub-Tasks

# Task 1: User Authentication and Onboarding Flow

## Task Overview
Implement the complete user authentication experience including registration, login, and onboarding processes that align with the Success Kid ethos. This foundation enables users to join the community, establish their identity, and begin their engagement journey with proper guidance and initial achievements.

## Required Document Review
- **Frontend & Backend Guidelines** - Section 6.1 (Authentication Mechanisms) for auth flow implementation
- **App Flow Document** - Section 4.2 (User Registration & Onboarding) for detailed user journey
- **Design System Document** - Sections 2.2 (User Journey Design Mapping) and 4.1 (Voice and Tone Framework) for onboarding experience design
- **Phase 1 Artifacts** - Authentication & Security Framework task for integration points

## User Experience Flow
1. **Entry Point:** User arrives at the platform and is presented with welcome screen showcasing Success Kid branding and core value proposition
2. **Registration:** User selects registration method (email, social, wallet) and completes a streamlined form
3. **Verification:** Email verification or wallet signature verification based on chosen method
4. **Onboarding Guide:** User is guided through interactive 3-step walkthrough highlighting key platform features
5. **First Achievement:** User receives "New Arrival" achievement with points and visual feedback
6. **Profile Setup:** User completes basic profile with username, avatar (Success Kid-themed options available), and optional bio
7. **Community Introduction:** User is introduced to personalized feed with recommended content and actions
8. **Onboarding Completion:** User receives confirmation of successful setup with suggested next steps

## Implementation Sub-Tasks

### Sub-Task 1: Authentication Components Structure
**Description:** Implement the core components for user authentication including registration and login forms with multiple authentication methods.

**Component Hierarchy:**
```
Authentication/
├── AuthContainer/       # Main authentication container
│   ├── AuthHeader       # Logo, welcome text, toggle between sign in/up
│   ├── AuthForm         # Dynamic form container
│   │   ├── EmailAuthForm    # Email/password form
│   │   ├── SocialAuthForm   # Social login buttons
│   │   └── WalletAuthForm   # Wallet connection option
│   └── AuthFooter       # Helper text, links, terms acceptance
├── VerificationStatus/  # Email/wallet verification feedback
└── AuthCallback/        # Handle auth provider callbacks
```

**Key Interface/Props:**
```tsx
interface AuthContainerProps {
  initialMode: 'signIn' | 'signUp'; // Initial display mode
  onAuthSuccess: (user: User) => void; // Auth success callback
  redirectUrl?: string; // Where to redirect after auth
}

// Additional interfaces follow similar patterns for forms, data models, etc.
```

**State Management:**
```tsx
// Auth context for global access to authentication state
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load user from storage or session on mount
  useEffect(() => {
    // Check for existing auth session
  }, []);
  
  // Auth action handlers (signIn, signUp, signOut)
  const signIn = async (data: AuthFormData) => {
    // Handle sign in based on method
  };
  
  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement progressive form validation with real-time feedback
  - Support persistent login with secure token storage
  - Maintain clear error messages following design system tone guidelines
  - Ensure all forms are fully accessible with proper keyboard navigation
  - Track authentication events for analytics (registration sources, completion rates)

- **Potential Challenges:**
  - Multiple Auth Methods: Implement a unified auth state despite different providers
  - Error Handling: Present auth errors in user-friendly language without losing technical specificity
  - Session Management: Handle token refresh and silent re-authentication appropriately

### Sub-Task 2: Onboarding Wizard Implementation
**Description:** Create an engaging, step-based onboarding experience that introduces users to key platform features and collects essential profile information.

**Component Hierarchy:**
```
OnboardingWizard/
├── OnboardingContainer/   # Main container with progress tracking
│   ├── OnboardingHeader   # Progress indicator, title
│   ├── StepContainer      # Dynamic step content
│   │   ├── WelcomeStep        # Initial welcome and overview
│   │   ├── FeatureShowcaseStep    # Highlight key platform features
│   │   ├── ProfileSetupStep   # Basic profile information
│   │   └── CommunityIntroStep # Community guidelines and first achievement
│   └── OnboardingControls # Navigation buttons (back, next, skip)
└── OnboardingCompletion/  # Success state with next actions
```

**State Management:**
```tsx
// Onboarding state
const [currentStep, setCurrentStep] = useState(0);
const [profileData, setProfileData] = useState<ProfileSetupData>({
  displayName: user.email ? user.email.split('@')[0] : '',
  avatarChoice: 'default',
});
const [completedSteps, setCompletedSteps] = useState<boolean[]>([true, false, false, false]);

// Navigation handlers
const handleNext = () => {
  // Mark current step complete and move to next
  const newCompletedSteps = [...completedSteps];
  newCompletedSteps[currentStep] = true;
  setCompletedSteps(newCompletedSteps);
  setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
};
```

**Implementation Considerations:**
- **Best Practices:**
  - Save progress at each step to prevent data loss
  - Allow users to skip non-essential steps
  - Provide clear visual indication of progress
  - Use animations for transitions between steps
  - Incorporate Success Kid imagery at achievement moments
  - Ensure onboarding can be resumed if abandoned mid-flow

- **Potential Challenges:**
  - Progress Persistence: Maintain state if user abandons and returns
  - Performance: Lazy load step content to maintain smooth transitions
  - Engagement Balance: Make onboarding informative without being tedious

### Sub-Task 3: Profile Setup Component
**Description:** Implement the profile creation and editing interface, allowing users to establish their identity within the community.

**Component Hierarchy:**
```
ProfileSetup/
├── ProfileForm/          # Main profile form container
│   ├── AvatarSelector    # Avatar upload/selection with Success Kid themes
│   ├── ProfileFields     # Username, bio, and other profile fields
│   ├── InterestSelector  # Optional interest categories
│   └── PrivacyOptions    # Profile visibility settings
└── ProfilePreview        # Live preview of profile appearance
```

**State Management:**
```tsx
// Local form state with validation
const [formData, setFormData] = useState<ProfileData>(initialData || {
  username: '',
  displayName: '',
  bio: '',
  avatarUrl: null,
  interests: [],
  privacySettings: {
    profileVisibility: 'public',
    activityVisibility: 'members',
    walletVisibility: 'private'
  }
});

// Form validation
const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});

// Username availability check with debouncing
const checkUsernameAvailability = useCallback(
  debounce(async (username: string) => {
    if (username.length < 3) return;
    
    try {
      const isAvailable = await userService.checkUsernameAvailability(username);
      // Update errors state based on availability
    } catch (error) {
      console.error('Failed to check username availability', error);
    }
  }, 500),
  [userService]
);
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement real-time validation with helpful error messages
  - Provide username suggestions if chosen name is taken
  - Support drag-and-drop for avatar uploads with preview
  - Save draft profile data periodically to prevent loss
  - Show a live preview of how profile will appear to others
  - Use design system voice/tone for help text and prompts

- **Potential Challenges:**
  - Image Handling: Proper avatar cropping, resizing, and upload management
  - Username Uniqueness: Real-time availability checking without excessive API calls
  - Validation Complexity: Balancing immediate feedback with overwhelming the user

### Sub-Task 4: First Achievement Implementation
**Description:** Implement the achievement system components needed to deliver the user's first achievement during onboarding, establishing the platform's gamification aspect from the start.

**Component Hierarchy:**
```
AchievementSystem/
├── AchievementNotification/  # Toast-style notification for new achievements
│   ├── AchievementIcon       # Visual achievement representation
│   ├── AchievementInfo       # Name, description, points
│   └── CelebrationEffect     # Animation and celebration visual
├── PointsAnimation/          # Visual feedback for points earned
└── AchievementService        # Logic for triggering achievements
```

**State Management:**
```tsx
// Achievement notification queue management
const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

// Process achievement queue
useEffect(() => {
  if (achievementQueue.length > 0 && !currentAchievement) {
    // Take the next achievement from the queue
    const nextAchievement = achievementQueue[0];
    setCurrentAchievement(nextAchievement);
    // Remove from queue
    setAchievementQueue(prev => prev.slice(1));
  }
}, [achievementQueue, currentAchievement]);
```

**Implementation Considerations:**
- **Best Practices:**
  - Design celebratory animations that reflect the Success Kid aesthetic
  - Implement sound effects with mute option for achievements
  - Create a queue system for multiple achievements unlocked simultaneously
  - Ensure achievements are visible but don't interrupt critical user flows
  - Use appropriate motion effects based on achievement rarity/significance
  - Store achievement records for later display in user profile

- **Potential Challenges:**
  - Animation Performance: Ensure celebrations don't cause performance issues
  - Timing: Balance celebration duration with user flow continuation
  - Cross-browser Consistency: Ensure animation effects work across devices

### Sub-Task 5: Authentication State Integration
**Description:** Integrate authentication state management with the application's global state, ensuring proper handling of authenticated/unauthenticated states throughout the app.

**Component Hierarchy:**
```
AuthStateIntegration/
├── ProtectedRoute         # Route wrapper requiring authentication
├── PublicOnlyRoute        # Route wrapper for non-authenticated users
├── AuthRedirector         # Handle auth redirects and intent preservation
└── AuthStateListener      # Global listener for auth state changes
```

**State Management:**
```tsx
// Global auth state in store
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isLoading: true,
    error: null,
    initialized: false
  } as AuthState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      state.initialized = true;
    },
    // Additional reducers for loading, error, logout
  }
});

// Auth state listener component
function AuthStateListener({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChanged(
      (user) => {
        dispatch(setUser(user));
      },
      (error) => {
        dispatch(setError(error.message));
      }
    );
    
    return () => unsubscribe();
  }, [dispatch]);
  
  return <>{children}</>;
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement proper token refresh and session management
  - Handle expired sessions with graceful re-authentication
  - Preserve pre-authentication user intent after login
  - Clear sensitive data on logout
  - Provide appropriate loading states during authentication operations
  - Implement secure storage mechanisms for auth tokens

- **Potential Challenges:**
  - Session Persistence: Maintain session across page refreshes/browser tabs
  - Token Security: Securely store authentication tokens in browser
  - Edge Cases: Handle various auth failure scenarios gracefully

## Integration Points
- Connects with Wallet Integration UI for crypto wallet authentication
- Interfaces with User Profile Experience for profile data management
- Provides authentication state for all protected features
- Interacts with Gamification System for first achievement awarding
- Sets foundation for Notification and Activity System permissions

## Testing Strategy
- Component testing of all form validations and state transitions
- Integration testing of complete authentication flows
- Authentication bypass testing for protected routes
- Error scenario testing for all authentication methods
- Browser storage testing for token persistence
- Onboarding flow completion testing
- Responsive testing across device sizes

## Definition of Done
This task is complete when:
- [ ] Registration and login forms are fully implemented with all authentication methods
- [ ] Form validation works correctly with appropriate error messages
- [ ] Onboarding wizard guides users through all required steps
- [ ] Profile setup allows complete customization with real-time validation
- [ ] First achievement is properly awarded and displayed
- [ ] Authentication state correctly persists and provides protection for routes
- [ ] All components are responsive across all required breakpoints
- [ ] Animations and transitions work smoothly
- [ ] All accessibility requirements are met (keyboard navigation, screen reader support)
- [ ] Error states are properly handled and displayed
- [ ] Components are thoroughly tested
- [ ] Code follows project standards and best practices
- [ ] Documentation is complete, including API requirements for backend integration

# Task 2: Navigation and Core Layout Implementation

## Task Overview
Implement the core navigation and layout structure that will serve as the foundational skeleton for the entire application. This system establishes consistent spatial organization, enables intuitive movement between sections, and adapts seamlessly across device sizes while maintaining the Success Kid brand identity throughout the user experience.

## Required Document Review
- **App Flow Document** - Section 8.2 (Navigation System) for navigation patterns and structure
- **Design System Document** - Section 3.4 (Spacing and Layout System) and 2.3 (Cross-Platform Experience Matrix)
- **Frontend & Backend Guidelines** - Section 7 (UI Implementation) for responsive design principles
- **Masterplan Document** - Section 3.2 (User Flow & Navigation) for navigation architecture

## User Experience Flow
1. **Initial Entry:** User encounters the app shell with primary navigation elements (bottom tab bar on mobile, sidebar on desktop)
2. **Navigation Interaction:** User taps/clicks navigation items to move between primary sections (Home, Market, Create, Community, Profile)
3. **Context Awareness:** Current section is clearly indicated with visual highlighting in navigation
4. **Responsive Adaptation:** Layout responds to screen size changes, transforming between mobile, tablet, and desktop presentations
5. **Sub-navigation:** Within sections, user can navigate through sub-sections with appropriate secondary navigation (tabs, nested lists)
6. **Creation Actions:** User can access content creation through prominent create button/action
7. **User Menu Access:** User can access profile and settings through header user menu
8. **Orientation:** User always maintains sense of location through consistent header information and navigation state

## Implementation Sub-Tasks

### Sub-Task 1: Navigation Component Architecture
**Description:** Establish the foundational navigation component system that adapts across breakpoints while maintaining consistent information architecture.

**Component Hierarchy:**
```
Navigation/
├── AppShell/                # Main wrapper for entire application
│   ├── MobileNavigation     # Bottom tab bar for mobile
│   ├── DesktopNavigation    # Sidebar for desktop
│   ├── Header               # Top header with context and actions
│   ├── MainContent          # Dynamic content area
│   └── ModalContainer       # Portal for modal content
├── NavigationItem/          # Individual navigation element
│   ├── NavigationIcon       # Icon component
│   └── NavigationLabel      # Text label
└── NavigationContext        # Navigation state management
```

**Key Interface/Props:**
```tsx
interface AppShellProps {
  children: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode; // Icon component
  path: string;
  badge?: number; // Optional notification badge
}

interface NavigationContextType {
  activeItemId: string;
  setActiveItemId: (id: string) => void;
  navigationItems: NavigationItem[];
  isNavExpanded: boolean; // For desktop sidebar toggle
  toggleNavExpansion: () => void;
}
```

**State Management:**
```tsx
// Navigation context provider
export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeItemId, setActiveItemId] = useState('home');
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  
  // Default navigation items
  const navigationItems: NavigationItem[] = [
    { id: 'home', label: 'Home', icon: <HomeIcon />, path: '/' },
    { id: 'market', label: 'Market', icon: <ChartIcon />, path: '/market' },
    { id: 'create', label: 'Create', icon: <PlusIcon />, path: '/create' },
    { id: 'community', label: 'Community', icon: <UsersIcon />, path: '/community' },
    { id: 'profile', label: 'Profile', icon: <UserIcon />, path: '/profile' }
  ];
  
  const toggleNavExpansion = () => setIsNavExpanded(prev => !prev);
  
  return (
    <NavigationContext.Provider 
      value={{ 
        activeItemId, 
        setActiveItemId, 
        navigationItems, 
        isNavExpanded, 
        toggleNavExpansion 
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Synchronize navigation state with router location
  - Use semantic HTML elements for navigation (nav, header, main)
  - Implement keyboard navigation for accessibility
  - Ensure touch targets meet minimum size requirements (44px)
  - Apply consistent active state indicators
  - Support programmatic navigation for deep linking

- **Potential Challenges:**
  - Responsive Transitions: Smooth transition between navigation types across breakpoints
  - State Persistence: Maintaining navigation state during page refreshes
  - Performance: Optimizing layout recalculations during responsive adaptations

### Sub-Task 2: Mobile Navigation Implementation
**Description:** Implement the mobile-focused bottom tab bar navigation that provides quick access to primary sections with appropriate visual and interaction patterns.

**Component Hierarchy:**
```
MobileNavigation/
├── BottomTabBar/           # Container for bottom tabs
│   ├── TabBarItem          # Individual tab item
│   │   ├── TabIcon         # Icon representation
│   │   └── TabLabel        # Text label
│   └── CreateButton        # Special create action button
└── MobileHeader/           # Mobile-specific header
    ├── PageTitle           # Current section title
    ├── BackButton          # Contextual back navigation
    └── ActionButtons       # Context-specific actions
```

**Key UI Elements:**
```tsx
function BottomTabBar({ items, activeItemId, onItemPress, createAction }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around px-2 z-50">
      {items.map((item) => (
        item.id === 'create' ? (
          <div key={item.id} className="relative -mt-5">
            <button 
              onClick={createAction}
              className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"
              aria-label="Create content"
            >
              {item.icon}
            </button>
          </div>
        ) : (
          <TabBarItem
            key={item.id}
            item={item}
            isActive={activeItemId === item.id}
            onPress={() => onItemPress(item)}
          />
        )
      ))}
    </nav>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Position tab bar fixed to bottom for thumb accessibility
  - Make Create button stand out visually as primary action
  - Implement touch feedback (ripple effect or state change)
  - Ensure tab bar doesn't obscure content with proper spacing
  - Add subtle animation for tab switching
  - Support swipe gestures for navigation between adjacent tabs

- **Potential Challenges:**
  - Thumb Accessibility: Ensure comfortable reach on various device sizes
  - Virtual Keyboard: Handle tab bar positioning when keyboard is visible
  - Badge Management: Showing notification/alert badges clearly but unobtrusively

### Sub-Task 3: Desktop Navigation Implementation
**Description:** Create the expanded desktop navigation sidebar that offers enhanced information hierarchy and navigation options for larger screen experiences.

**Component Hierarchy:**
```
DesktopNavigation/
├── Sidebar/                # Main sidebar container
│   ├── SidebarHeader       # Logo and branding
│   ├── PrimaryNavigation   # Main navigation items
│   │   └── NavItem         # Primary navigation item
│   ├── SecondaryNavigation # Additional navigation items
│   │   └── NavItem         # Secondary navigation item
│   └── SidebarFooter       # Additional controls, collapse button
└── DesktopHeader/          # Desktop-specific header
    ├── SearchBar           # Global search component
    ├── NotificationButton  # Notification access
    └── UserMenuDropdown    # User menu and actions
```

**Key UI Elements:**
```tsx
function Sidebar({ 
  isExpanded, 
  onToggleExpansion, 
  primaryItems, 
  secondaryItems,
  activeItemId,
  onNavigate
}: SidebarProps) {
  return (
    <aside 
      className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-width duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="/logo.svg" 
            alt="Success Kid" 
            className="h-8 w-8" 
          />
          {isExpanded && (
            <span className="ml-2 font-heading font-bold text-primary">
              Success Kid
            </span>
          )}
        </div>
        <button 
          onClick={onToggleExpansion}
          className="text-gray-500 hover:text-primary p-1"
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </button>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Primary navigation items */}
        <ul className="space-y-1 px-3">
          {primaryItems.map(item => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeItemId === item.id}
              isExpanded={isExpanded}
              onItemClick={() => onNavigate(item)}
            />
          ))}
        </ul>
        
        {/* Secondary navigation items with conditional header */}
        {secondaryItems.length > 0 && (
          <>
            <div className={`px-4 py-2 mt-6 ${isExpanded ? 'text-xs text-gray-500 uppercase' : 'border-t border-gray-200'}`}>
              {isExpanded && 'Other'}
            </div>
            <ul className="space-y-1 px-3">
              {secondaryItems.map(item => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={activeItemId === item.id}
                  isExpanded={isExpanded}
                  onItemClick={() => onNavigate(item)}
                />
              ))}
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement collapsible sidebar for space efficiency
  - Create clear visual hierarchy between primary and secondary items
  - Use consistent hover and active states
  - Ensure sidebar scrolls independently of main content
  - Support keyboard navigation and focus management
  - Maintain appropriate contrast between sidebar and content

- **Potential Challenges:**
  - Layout Stability: Prevent content jumps when sidebar expands/collapses
  - Deep Navigation: Handle multi-level navigation items clearly
  - Active States: Properly highlight active items including sub-items

### Sub-Task 4: Responsive Layout System
**Description:** Implement the core layout system that creates a consistent spatial organization across all screen sizes while adapting appropriately to different viewport dimensions.

**Component Hierarchy:**
```
Layout/
├── MainLayout/            # Primary application layout
│   ├── AppShell           # Outer container with navigation
│   ├── ContentArea        # Main content container
│   └── PageContainer      # Individual page wrapper
├── GridSystem/            # Responsive grid implementation
│   ├── Container          # Centered content container
│   ├── Row                # Horizontal row
│   └── Column             # Responsive column
└── SpecialLayouts/        # Feature-specific layouts
    ├── AuthLayout         # Authentication pages layout
    ├── FullScreenLayout   # Immersive content layout
    └── SplitViewLayout    # Two-panel layout
```

**Key UI Elements:**
```tsx
function MainLayout({ 
  children, 
  pageTitle, 
  showBackButton, 
  actions, 
  hideNavigation 
}: MainLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {isDesktop ? (
        <div className="flex">
          {!hideNavigation && <DesktopNavigation />}
          <div className="flex-1 flex flex-col min-h-screen">
            <DesktopHeader 
              title={pageTitle} 
              breadcrumbs={generateBreadcrumbs(pageTitle)}
            />
            <main className="flex-1 p-6">
              <PageContainer>
                {children}
              </PageContainer>
            </main>
          </div>
        </div>
      ) : (
        <>
          <MobileHeader 
            title={pageTitle}
            showBackButton={showBackButton}
            actions={actions}
          />
          <main className="pt-16 pb-20">
            <PageContainer>
              {children}
            </PageContainer>
          </main>
          {!hideNavigation && <MobileNavigation />}
        </>
      )}
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Follow the mobile-first approach from design guidelines
  - Create consistent spacing using the defined spacing system
  - Use proper breakpoints as defined in the design system
  - Avoid fixed dimensions that could break on different screens
  - Implement proper nesting support for complex layouts
  - Ensure text remains readable at all viewport sizes

- **Potential Challenges:**
  - Content Reflow: Graceful handling of content repositioning across breakpoints
  - Complex Components: Adapting UI elements with many children across viewports
  - Edge Cases: Handling extremely small or large viewports properly

### Sub-Task 5: Header Component Implementation
**Description:** Create the header component system that provides context, navigation aids, and quick actions while adapting to different layout contexts.

**Component Hierarchy:**
```
Header/
├── PageHeader/            # Base header component
│   ├── HeaderTitle        # Page title display
│   ├── Breadcrumbs        # Navigation breadcrumbs
│   ├── ActionButtons      # Contextual page actions
│   └── UserMenu           # User profile and settings access
├── SectionHeader/         # Sub-section header
│   ├── SectionTitle       # Section title
│   └── SectionTabs        # Tabbed navigation
└── ContextualHeader/      # Feature-specific headers
    ├── MarketHeader       # Market data page header
    ├── ProfileHeader      # User profile header
    └── SearchHeader       # Search results header
```

**Key UI Elements:**
```tsx
function PageHeader({ 
  title, 
  subtitle, 
  showBackButton, 
  onBackClick,
  breadcrumbs,
  actions 
}: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton && (
            <button 
              onClick={onBackClick}
              className="mr-2 p-1 rounded-full hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          )}
          
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {actions && actions}
          <UserMenu />
        </div>
      </div>
      
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-2 text-sm text-gray-500">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((item, index) => (
                <li key={index}>
                  {index > 0 && (
                    <span className="mx-2">/</span>
                  )}
                  {item.path ? (
                    <a href={item.path} className="hover:text-primary">
                      {item.label}
                    </a>
                  ) : (
                    <span aria-current="page">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}
    </header>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Keep headers sticky for context preservation during scrolling
  - Ensure header elements remain accessible at all viewport sizes
  - Use subtle elevation (shadow) to indicate header's position in z-index
  - Implement proper hierarchy between primary and section headers
  - Create smooth transitions for header state changes

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

# Task 4: Wallet Integration UI

## Task Overview
Implement the user interface components for cryptocurrency wallet integration, enabling users to connect their Phantom wallets, view token balances, and track transaction history. This feature bridges the token aspect of the platform with the community experience, providing utility for token holders while maintaining accessibility for non-holders.

## Required Document Review
- **App Flow Document** - Section 4.3 (Wallet Integration) for detailed wallet connection flow
- **Frontend & Backend Guidelines** - Section 6.2 (Security & Authentication) for wallet security patterns
- **Masterplan Document** - Section 4.3 (Wallet Integration) for feature requirements
- **Phase 1 Artifacts** - Backend Infrastructure Setup for wallet verification endpoints

## User Experience Flow
1. **Connection Initiation:** User initiates wallet connection from profile, settings, or dedicated wallet section
2. **Provider Selection:** System detects available wallet providers with Phantom as primary option
3. **Connection Request:** System requests connection to user's wallet via provider API
4. **Verification:** User signs a message to verify wallet ownership
5. **Success Confirmation:** System confirms successful connection with visual feedback
6. **Token Information:** User sees their token balance and valuation in USD
7. **Transaction History:** User can view their recent transactions with token
8. **Connected State:** Wallet connection status is visible throughout the platform

## Implementation Sub-Tasks

### Sub-Task 1: Wallet Connection Flow
**Description:** Implement the core wallet connection process that guides users through connecting their crypto wallet to the platform.

**Component Hierarchy:**
```
WalletConnection/
├── ConnectionButton/      # Primary connection trigger
├── ConnectionModal/       # Connection flow container
│   ├── ProviderSelection  # Wallet provider options
│   ├── ConnectionRequest  # Connection in progress
│   ├── VerificationStep   # Message signing step
│   └── ConnectionResult   # Success or error state
└── WalletIndicator        # Persistent connection status
```

**Key Interface/Props:**
```tsx
interface WalletConnectionProps {
  onWalletConnected: (address: string, verified: boolean) => void;
  isConnected: boolean;
  walletAddress?: string;
}

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (address: string, verified: boolean) => void;
}

interface WalletConnectionState {
  status: 'idle' | 'detecting' | 'connecting' | 'verifying' | 'success' | 'error';
  address?: string;
  verified: boolean;
  error?: string;
  provider?: 'phantom' | 'manual';
}
```

**Key UI Elements:**
```tsx
function ConnectionModal({ isOpen, onClose, onComplete }: ConnectionModalProps) {
  const [state, setState] = useState<WalletConnectionState>({
    status: 'idle',
    verified: false
  });
  
  // Connect wallet function
  const connectWallet = async () => {
    setState({ ...state, status: 'connecting' });
    
    try {
      // Check if Phantom is available
      const provider = window.phantom?.solana;
      
      if (provider?.isPhantom) {
        try {
          // Request connection
          const connection = await provider.connect();
          const address = connection.publicKey.toString();
          
          // Update state
          setState({ 
            ...state, 
            status: 'verifying', 
            address, 
            provider: 'phantom' 
          });
          
          // Verify wallet ownership
          await verifyWallet(address, provider);
          
        } catch (error) {
          console.error('Connection error:', error);
          setState({ 
            ...state, 
            status: 'error', 
            error: 'Failed to connect wallet. Please try again.' 
          });
        }
      } else {
        // Phantom not installed
        setState({ 
          ...state, 
          status: 'error', 
          error: 'Phantom wallet not detected. Please install Phantom or enter your address manually.' 
        });
      }
    } catch (error) {
      console.error('Wallet detection error:', error);
      setState({ 
        ...state, 
        status: 'error', 
        error: 'Failed to detect wallet. Please try again or enter address manually.' 
      });
    }
  };
  
  // Modal content based on connection status
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
      <div className="p-4">
        {state.status === 'idle' && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Connect your wallet to verify your Success Kid token holdings and unlock holder benefits.
            </p>
            <button
              onClick={connectWallet}
              className="w-full py-3 px-4 flex items-center justify-center bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              <img src="/icons/phantom.svg" alt="Phantom" className="w-5 h-5 mr-2" />
              Connect with Phantom
            </button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            <ManualAddressEntry onSubmit={handleManualEntry} />
          </div>
        )}
        
        {/* Additional status states (connecting, verifying, success, error) */}
      </div>
    </Modal>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Clearly explain each step of the connection process
  - Provide alternative connection methods (manual address entry)
  - Handle all potential errors with clear messaging
  - Display prominent success confirmation
  - Ensure secure message signing for verification
  - Maintain consistent wallet connection indicator across platform

- **Potential Challenges:**
  - Multiple Wallet Providers: Supporting different wallet interfaces consistently
  - Security Concerns: Implementing proper signature verification
  - User Education: Explaining technical concepts in accessible language
  - Error Recovery: Providing clear paths to resolve connection issues

### Sub-Task 2: Token Balance and Valuation Display
**Description:** Create the interface components for displaying token balance, USD valuation, and basic token metrics.

**Component Hierarchy:**
```
TokenDisplay/
├── BalanceCard/          # Primary balance display component
│   ├── TokenAmount       # Token quantity display
│   ├── UsdValue          # Equivalent USD value
│   └── ValueChange       # 24h change indicator
└── TokenMetrics/         # Additional token information
    ├── PriceInfo         # Current price and change
    ├── MarketInfo        # Market cap and volume
    └── PersonalMetrics   # User-specific holdings info
```

**Key UI Elements:**
```tsx
function BalanceCard({ tokenBalance, tokenPrice, tokenChange24h, isLoading }: BalanceCardProps) {
  const usdValue = tokenBalance * tokenPrice;
  const usdChange24h = tokenBalance * tokenPrice * (tokenChange24h / 100);
  const isPositiveChange = tokenChange24h >= 0;
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-2/3 mb-6"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase">Your Balance</h3>
        <div className="mt-2 flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">
            {formatNumber(tokenBalance)}
          </span>
          <span className="ml-2 text-sm text-gray-500">SUCCESS</span>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline">
            <span className="text-xl font-semibold text-gray-900">
              ${formatCurrency(usdValue)}
            </span>
            <span 
              className={`ml-2 text-sm ${
                isPositiveChange ? 'text-success' : 'text-error'
              }`}
            >
              {isPositiveChange ? '+' : ''}{formatCurrency(usdChange24h)} ({tokenChange24h.toFixed(2)}%)
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">USD Value (24h change)</p>
        </div>
      </div>
      <div className="bg-gray-50 px-6 py-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Price per token</span>
          <span className="text-gray-900 font-medium">${formatCurrency(tokenPrice)}</span>
        </div>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Display both token amount and fiat value
  - Show price change with appropriate color indicators
  - Implement skeleton loading states for data fetching
  - Format large numbers for better readability
  - Provide appropriate context for numerical values
  - Ensure proper error states for API failures

- **Potential Challenges:**
  - Data Accuracy: Ensuring up-to-date price information
  - Value Formatting: Handling very large or small numbers appropriately
  - Price Volatility: Clearly indicating significant price movements
  - Loading States: Providing informative feedback during data fetching

### Sub-Task 3: Transaction History Component
**Description:** Create the transaction history viewer that displays the user's token transactions with appropriate filtering and details.

**Component Hierarchy:**
```
TransactionHistory/
├── TransactionFilters/   # Filter and sort controls
├── TransactionList/      # List of transaction items
│   └── TransactionItem   # Individual transaction display
├── TransactionDetail/    # Expanded transaction information
└── PaginationControls/   # Controls for navigating large lists
```

**Key UI Elements:**
```tsx
function TransactionList({ transactions, isLoading, onTransactionClick }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex py-4 border-b border-gray-200">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="w-24">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 ml-auto"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-200">
      {transactions.map((transaction) => (
        <TransactionItem 
          key={transaction.id}
          transaction={transaction}
          onClick={() => onTransactionClick(transaction)}
        />
      ))}
    </div>
  );
}

function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  // Get icon and color based on transaction type
  const typeConfig = {
    send: { 
      icon: <ArrowUpIcon className="w-5 h-5" />, 
      color: 'bg-red-100 text-red-600', 
      label: 'Sent' 
    },
    receive: { 
      icon: <ArrowDownIcon className="w-5 h-5" />, 
      color: 'bg-green-100 text-green-600', 
      label: 'Received' 
    },
    swap: { 
      icon: <SwitchHorizontalIcon className="w-5 h-5" />, 
      color: 'bg-blue-100 text-blue-600', 
      label: 'Swapped' 
    },
    other: { 
      icon: <DotsHorizontalIcon className="w-5 h-5" />, 
      color: 'bg-gray-100 text-gray-600', 
      label: 'Transaction' 
    }
  };
  
  const { icon, color, label } = typeConfig[transaction.type];
  const isReceive = transaction.type === 'receive';
  
  return (
    <div 
      className="py-4 flex items-center hover:bg-gray-50 cursor-pointer px-2 rounded-md"
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-full ${color} p-2 flex-shrink-0`}>
        {icon}
      </div>
      <div className="ml-4 flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {label}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {isReceive 
            ? `From ${shortenAddress(transaction.fromAddress)}`
            : `To ${shortenAddress(transaction.toAddress)}`
          }
        </p>
      </div>
      <div className="ml-4 text-right">
        <p className={`text-sm font-medium ${isReceive ? 'text-success' : 'text-error'}`}>
          {isReceive ? '+' : '-'}{formatNumber(transaction.amount)}
        </p>
        <p className="text-xs text-gray-500">
          {formatDate(transaction.timestamp)}
        </p>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Clearly differentiate transaction types (send/receive)
  - Provide appropriate color-coding for transaction types
  - Show transaction status clearly
  - Implement pagination for large transaction histories
  - Allow filtering by transaction type and date range
  - Provide detailed view with complete transaction information
  - Include links to blockchain explorer for transparency

- **Potential Challenges:**
  - Data Volume: Managing potentially large transaction histories
  - Data Formatting: Presenting blockchain data in user-friendly format
  - Transaction Context: Providing sufficient context for transactions
  - Loading Performance: Efficiently loading and rendering transaction lists

### Sub-Task 4: Wallet Status Indicator
**Description:** Create the wallet connection status indicator that provides persistent visibility into the user's wallet connection state throughout the platform.

**Component Hierarchy:**
```
WalletStatus/
├── StatusIndicator/      # Compact status display
│   ├── ConnectionIcon    # Visual connection status
│   └── AddressDisplay    # Shortened address display
├── DropdownMenu/         # Expanded wallet options
│   ├── BalancePreview    # Quick balance overview
│   ├── ActionLinks       # Wallet-related actions
│   └── DisconnectOption  # Wallet disconnection control
└── ConnectionToast       # Temporary connection notification
```

**Key UI Elements:**
```tsx
function WalletStatusIndicator({ isConnected, walletAddress, verified, onClick }: StatusIndicatorProps) {
  if (!isConnected) {
    return null;
  }
  
  return (
    <button
      className="flex items-center px-3 py-1.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      onClick={onClick}
    >
      <div className={`w-2 h-2 rounded-full ${verified ? 'bg-success' : 'bg-warning'} mr-2`} />
      <span className="font-mono">
        {shortenAddress(walletAddress || '')}
      </span>
    </button>
  );
}

function WalletDropdownMenu({ isOpen, walletAddress, verified, tokenBalance, tokenPrice, onDisconnect, onViewWallet, onClose }: WalletDropdownProps) {
  // Calculate USD value
  const usdValue = (tokenBalance || 0) * (tokenPrice || 0);
  
  if (!isOpen) return null;
  
  return (
    <div className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
      <div className="py-4 px-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">Connected Wallet</p>
          <div className={`px-2 py-1 rounded-full text-xs ${
            verified ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
          }`}>
            {verified ? 'Verified' : 'Unverified'}
          </div>
        </div>
        <p className="mt-1 text-xs font-mono text-gray-500">{walletAddress}</p>
      </div>
      
      <div className="py-3 px-4 border-b border-gray-200">
        <div className="flex justify-between items-baseline">
          <p className="text-sm text-gray-500">Balance</p>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{formatNumber(tokenBalance || 0)} SUCCESS</p>
            <p className="text-xs text-gray-500">${formatCurrency(usdValue)}</p>
          </div>
        </div>
      </div>
      
      <div className="py-2">
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={onViewWallet}
        >
          View Wallet Details
        </button>
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => window.open(`https://solscan.io/account/${walletAddress}`, '_blank')}
        >
          View on Solscan
        </button>
        <button
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          onClick={onDisconnect}
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Show clear visual indicator of connection status
  - Differentiate between verified and unverified wallets
  - Provide quick access to wallet details and balance
  - Implement clean disconnection flow
  - Use concise address display with proper truncation
  - Ensure dropdown menu is keyboard accessible
  - Include external blockchain explorer links

- **Potential Challenges:**
  - Status Persistence: Maintaining wallet state across page refreshes
  - Security Notifications: Communicating verification status clearly
  - Connection Recovery: Handling reconnection after session expiry
  - Cross-device Synchronization: Maintaining consistent wallet state

## Integration Points
- Connects with Authentication system for user identity verification
- Interfaces with Profile Experience for displaying wallet information
- Provides data for Gamification System regarding token holder status
- Interacts with Market Data Visualization for price information
- Sets foundation for transaction-based achievements

## Testing Strategy
- Component testing of wallet connection flow
- Integration testing with Phantom wallet API
- Mocking wallet provider for offline testing scenarios
- Error state testing for connection failures
- Visual testing of all wallet interface components
- Security testing of signature verification process
- Performance testing for transaction list with large datasets

## Definition of Done
This task is complete when:
- [ ] Wallet connection flow guides users through connecting and verifying their wallet
- [ ] Token balance display shows accurate holdings with USD valuation
- [ ] Transaction history component displays past transactions with filtering
- [ ] Wallet status indicator shows connection state throughout the platform
- [ ] All components handle error cases and network failures gracefully
- [ ] Proper loading states are implemented for asynchronous operations
- [ ] Connection persistence is maintained across page refreshes
- [ ] All wallet information is displayed with appropriate privacy controls
- [ ] Security best practices are implemented for wallet interactions
- [ ] Components are responsive across all device sizes
- [ ] All interface elements follow the design system guidelines
- [ ] Documentation is complete for wallet integration APIs

# Task 5: Forum and Content System

## Task Overview
Implement the core community discussion platform that enables users to create, view, and engage with content across various categories. This feature forms the central social hub of the Success Kid Community Platform, fostering meaningful interactions and content creation that embodies the community's values of positivity and achievement.

## Required Document Review
- **Masterplan Document** - Sections 4.1 (Discussion Forums) and 4.2 (Content Creation Tools)
- **Design System Document** - Sections 4.2 (UX Writing Patterns) and 8.4 (Data Display Patterns)
- **App Flow Document** - Section 4.4 (Content Creation & Posting)
- **Frontend & Backend Guidelines** - Section 4.1 (Frontend Component Patterns) for content display

## User Experience Flow
1. **Category Selection:** User browses and selects content categories of interest
2. **Content Discovery:** User views posts in feed or list format with engagement metrics
3. **Content Viewing:** User reads full post with media and community engagement
4. **Comment Interaction:** User views and creates threaded comments on content
5. **Content Creation:** User creates new posts with text, media and formatting options
6. **Voting & Engagement:** User upvotes/downvotes content and tracks engagement
7. **Moderation:** System and user-based content filtering maintains community standards

## Implementation Sub-Tasks

### Sub-Task 1: Category Browser Component
**Description:** Create the category navigation and selection component that helps users discover and filter content by topic areas.

**Component Hierarchy:**
```
CategoryBrowser/
├── CategoryList/          # Main category navigation
│   └── CategoryItem       # Individual category with stats
├── CategoryHeader/        # Current category information
│   ├── CategoryIcon       # Visual representation
│   ├── CategoryStats      # Activity metrics
│   └── SubscribeButton    # Follow/unfollow control
└── SubcategoryTabs/       # Sub-topic navigation
```

**Key Interface/Props:**
```tsx
interface CategoryBrowserProps {
  categories: Category[];
  activeCategoryId?: string;
  onSelectCategory: (categoryId: string) => void;
  layout?: 'horizontal' | 'vertical';
}

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  iconUrl: string;
  color: string;
  stats: {
    posts: number;
    activeNow: number;
  };
  isSubscribed?: boolean;
  subcategories?: Subcategory[];
}
```

**Key UI Elements:**
```tsx
function CategoryList({ categories, activeCategoryId, onSelectCategory, layout = 'vertical' }: CategoryBrowserProps) {
  const isHorizontal = layout === 'horizontal';
  
  return (
    <div className={`${isHorizontal ? 'flex overflow-x-auto py-2' : 'space-y-1'}`}>
      {categories.map(category => (
        <CategoryItem
          key={category.id}
          category={category}
          isActive={category.id === activeCategoryId}
          onClick={() => onSelectCategory(category.id)}
          layout={layout}
        />
      ))}
    </div>
  );
}

function CategoryHeader({ category, onSubscribe }: CategoryHeaderProps) {
  if (!category) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center">
          <div 
            className="w-12 h-12 rounded-md flex items-center justify-center"
            style={{ backgroundColor: `${category.color}15` }}
          >
            <img src={category.iconUrl} alt="" className="w-8 h-8" />
          </div>
          <div className="ml-4">
            <h1 className="text-xl font-semibold text-gray-900">{category.name}</h1>
            <p className="text-sm text-gray-500">{category.description}</p>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => onSubscribe(category.id, !category.isSubscribed)}
            className={`
              px-4 py-2 text-sm font-medium rounded-md 
              ${category.isSubscribed 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-primary text-white hover:bg-primary-dark'}
            `}
          >
            {category.isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex items-center text-sm text-gray-500 space-x-4">
        <div>
          <span className="font-medium text-gray-900">{category.stats.posts.toLocaleString()}</span> posts
        </div>
        {category.stats.activeNow > 0 && (
          <div>
            <span className="inline-block w-2 h-2 rounded-full bg-success mr-1" />
            <span className="font-medium text-gray-900">{category.stats.activeNow}</span> active now
          </div>
        )}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Use consistent iconography for categories
  - Provide activity metrics for category selection guidance
  - Implement both horizontal and vertical layouts for different contexts
  - Cache category data for improved performance
  - Highlight active category clearly
  - Support keyboard navigation for accessibility

- **Potential Challenges:**
  - Handling many categories while maintaining usability
  - Creating visually distinct but cohesive category identities
  - Ensuring smooth scrolling for horizontal category lists on mobile
  - Managing subcategory relationships clearly

### Sub-Task 2: Post List Component
**Description:** Create the post list/feed component that displays content items in a scrollable, engaging format with appropriate sorting and filtering options.

**Component Hierarchy:**
```
PostList/
├── ListControls/          # Sorting and filtering options
│   ├── SortSelector       # Sort order dropdown
│   └── FilterOptions      # Additional filter controls
├── PostCard/              # Individual post preview
│   ├── PostHeader         # Author and metadata
│   ├── PostContent        # Truncated content preview
│   ├── PostMedia          # Featured media preview
│   └── PostEngagement     # Vote and comment counters
└── ListPagination/        # Load more / pagination controls
```

**Key Interface/Props:**
```tsx
interface PostListProps {
  posts: Post[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onSortChange?: (sort: SortOption) => void;
  onPostClick?: (postId: string) => void;
  onVote?: (postId: string, direction: 'up' | 'down') => void;
  sortOption?: SortOption;
  layout?: 'card' | 'compact';
}

interface Post {
  id: string;
  title: string;
  content: string;
  contentPreview: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    level: number;
  };
  category: {
    id: string;
    name: string;
    color: string;
  };
  createdAt: string;
  updatedAt?: string;
  mediaUrls?: string[];
  mediaCount?: number;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  userVote?: 'up' | 'down' | null;
  isPinned?: boolean;
}
```

**Key UI Elements:**
```tsx
function PostCard({ post, onClick, onVote, layout = 'card' }: PostCardProps) {
  const isCardLayout = layout === 'card';
  const formattedDate = formatRelativeTime(post.createdAt);
  
  const handleVote = (e: React.MouseEvent, direction: 'up' | 'down') => {
    e.stopPropagation(); // Prevent triggering onClick
    if (onVote) {
      onVote(post.id, direction);
    }
  };
  
  return (
    <div 
      className={`
        bg-white rounded-lg shadow-sm overflow-hidden
        hover:shadow-md transition cursor-pointer
        ${post.isPinned ? 'border-l-4 border-primary' : ''}
      `}
      onClick={onClick}
    >
      <div className={`p-4 ${isCardLayout ? '' : 'flex'}`}>
        {/* Author and metadata */}
        <div className="flex items-center">
          <img 
            src={post.author.avatarUrl} 
            alt=""
            className="w-8 h-8 rounded-full"
          />
          <div className="ml-2 flex-1">
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-900">{post.author.displayName}</span>
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 rounded-md">
                Lvl {post.author.level}
              </span>
              <span className="mx-1.5 text-gray-500">&middot;</span>
              <span className="text-gray-500">{formattedDate}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <span 
                className="px-2 py-0.5 rounded-md mr-1" 
                style={{ 
                  backgroundColor: `${post.category.color}15`, 
                  color: post.category.color 
                }}
              >
                {post.category.name}
              </span>
              {post.isPinned && (
                <span className="flex items-center text-primary ml-1">
                  <PinIcon className="w-3 h-3 mr-0.5" />
                  Pinned
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className={`${isCardLayout ? 'mt-3' : 'ml-4 flex-1'}`}>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {post.title}
          </h3>
          <p className="mt-1 text-gray-600 line-clamp-2">
            {post.contentPreview}
          </p>
          
          {/* Media preview - only shown in card layout */}
          {isCardLayout && post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="mt-3 relative">
              <img 
                src={post.mediaUrls[0]} 
                alt=""
                className="rounded-md w-full h-48 object-cover"
              />
              {post.mediaUrls.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white rounded-md px-2 py-1 text-xs">
                  +{post.mediaUrls.length - 1} more
                </div>
              )}
            </div>
          )}
          
          {/* Engagement metrics */}
          <div className="mt-3 flex items-center text-sm text-gray-500">
            {/* Voting */}
            <div className="flex items-center mr-4">
              <button 
                className={`p-1 rounded-md hover:bg-gray-100 ${post.userVote === 'up' ? 'text-success' : ''}`}
                onClick={(e) => handleVote(e, 'up')}
                aria-label="Upvote"
              >
                <ArrowUpIcon className="w-5 h-5" />
              </button>
              <span className="mx-1 min-w-[20px] text-center">
                {(post.upvotes - post.downvotes).toLocaleString()}
              </span>
              <button 
                className={`p-1 rounded-md hover:bg-gray-100 ${post.userVote === 'down' ? 'text-error' : ''}`}
                onClick={(e) => handleVote(e, 'down')}
                aria-label="Downvote"
              >
                <ArrowDownIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Comments */}
            <div className="flex items-center">
              <ChatIcon className="w-5 h-5 mr-1" />
              <span>{post.commentCount.toLocaleString()}</span>
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
  - Provide clear sorting options for content discovery
  - Implement both card and compact layouts for different contexts
  - Show appropriate loading states during data fetching
  - Include empty state guidance when no posts are available
  - Optimize media loading for performance
  - Implement proper content truncation for previews
  - Show clear visual indicators for upvoted/downvoted content

- **Potential Challenges:**
  - Handling various content types consistently
  - Efficiently loading images and media previews
  - Managing long vs. short content previews
  - Supporting multiple interaction types without UI clutter

### Sub-Task 3: Post Detail Component
**Description:** Create the post detail view that displays the complete content with media and interactive elements for community engagement.

**Component Hierarchy:**
```
PostDetail/
├── PostHeader/            # Complete post metadata
│   ├── AuthorInfo         # Author profile snippet
│   ├── CategoryBadge      # Category indicator
│   └── PostMetadata       # Timestamp and status
├── PostContent/           # Full content display
│   ├── PostBody           # Formatted text content
│   └── MediaGallery       # Multi-image gallery
├── PostActions/           # Interactive controls
│   ├── VoteControls       # Upvote/downvote buttons
│   └── ShareOptions       # Sharing functionality
└── CommentSection/        # Comment thread container
```

**Key Interface/Props:**
```tsx
interface PostDetailProps {
  post: PostDetails;
  isLoading?: boolean;
  onVote?: (direction: 'up' | 'down') => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

interface PostDetails extends Post {
  content: string; // Full content, not just preview
  media: {
    url: string;
    type: 'image' | 'video' | 'link';
    width?: number;
    height?: number;
    thumbnailUrl?: string;
  }[];
  tags?: string[];
  isEdited?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}
```

**Key UI Elements:**
```tsx
function PostDetail({ post, isLoading, onVote, onShare, onEdit, onDelete, onReport }: PostDetailProps) {
  if (isLoading) {
    return <PostDetailSkeleton />;
  }
  
  if (!post) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900">Post not found</h3>
        <p className="mt-2 text-gray-500">
          This post may have been removed or you may not have permission to view it.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Post Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <img 
              src={post.author.avatarUrl} 
              alt=""
              className="w-10 h-10 rounded-full"
            />
            <div className="ml-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-900">{post.author.displayName}</span>
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 rounded-md">
                  Lvl {post.author.level}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-0.5">
                <span>{formatDate(post.createdAt)}</span>
                {post.isEdited && (
                  <>
                    <span className="mx-1">&middot;</span>
                    <span>Edited</span>
                  </>
                )}
                <span className="mx-1">&middot;</span>
                <span
                  className="px-2 py-0.5 rounded-md text-xs" 
                  style={{ 
                    backgroundColor: `${post.category.color}15`, 
                    color: post.category.color 
                  }}
                >
                  {post.category.name}
                </span>
              </div>
            </div>
          </div>
          
          {/* Post actions dropdown */}
          <Menu>
            <Menu.Button className="p-1 rounded-md hover:bg-gray-100">
              <DotsVerticalIcon className="w-5 h-5 text-gray-500" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
                {post.canEdit && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onEdit}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } text-gray-700 block w-full text-left px-4 py-2 text-sm`}
                      >
                        Edit Post
                      </button>
                    )}
                  </Menu.Item>
                )}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onShare}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } text-gray-700 block w-full text-left px-4 py-2 text-sm`}
                    >
                      Share Post
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onReport}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } text-gray-700 block w-full text-left px-4 py-2 text-sm`}
                    >
                      Report Post
                    </button>
                  )}
                </Menu.Item>
                {post.canDelete && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onDelete}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } text-error block w-full text-left px-4 py-2 text-sm`}
                      >
                        Delete Post
                      </button>
                    )}
                  </Menu.Item>
                )}
              </div>
            </Menu.Items>
          </Menu>
        </div>
        
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {post.title}
        </h1>
      </div>
      
      {/* Post Content and Media */}
      <div className="p-6">
        <div className="prose prose-primary max-w-none">
          <RichTextRenderer content={post.content} />
        </div>
        
        {post.media && post.media.length > 0 && (
          <div className="mt-6">
            <MediaGallery media={post.media} />
          </div>
        )}
        
        {post.tags && post.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Post Actions */}
      <div className="px-6 py-4 border-t border-b border-gray-200 flex items-center">
        {/* Vote controls */}
        <div className="flex items-center bg-gray-100 rounded-md">
          <button 
            className={`p-2 rounded-l-md hover:bg-gray-200 ${post.userVote === 'up' ? 'text-success' : ''}`}
            onClick={() => onVote && onVote('up')}
            aria-label="Upvote"
          >
            <ArrowUpIcon className="w-5 h-5" />
          </button>
          <span className="mx-2 font-medium text-gray-900 min-w-[30px] text-center">
            {(post.upvotes - post.downvotes).toLocaleString()}
          </span>
          <button 
            className={`p-2 rounded-r-md hover:bg-gray-200 ${post.userVote === 'down' ? 'text-error' : ''}`}
            onClick={() => onVote && onVote('down')}
            aria-label="Downvote"
          >
            <ArrowDownIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Share button */}
        <button 
          onClick={onShare}
          className="ml-4 flex items-center px-4 py-2 rounded-md hover:bg-gray-100"
        >
          <ShareIcon className="w-5 h-5 mr-1.5" />
          Share
        </button>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Format post content with proper typography and spacing
  - Implement responsive media gallery for different screen sizes
  - Provide contextual actions based on user permissions
  - Show clear attribution and metadata for content
  - Create appropriate sharing functionality
  - Ensure proper rendering of rich text content
  - Cache post data for improved performance

- **Potential Challenges:**
  - Handling different media types consistently
  - Supporting various rich text formatting features
  - Managing user permissions for edit/delete actions
  - Optimizing large media galleries for performance

### Sub-Task 4: Comment System
**Description:** Create the comment system that enables users to engage in threaded discussions about content.

**Component Hierarchy:**
```
CommentSection/
├── CommentHeader/         # Section header with count and sort
├── CommentEditor/         # New comment creation interface
├── CommentList/           # Hierarchical comment display
│   └── CommentItem/       # Individual comment component
│       ├── CommentHeader  # Author and metadata
│       ├── CommentContent # Comment text body
│       ├── CommentActions # Reply, vote, report controls
│       └── ReplyEditor    # Inline reply interface
└── CommentPagination/     # Load more controls
```

**Key Interface/Props:**
```tsx
interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  totalComments: number;
  isLoading?: boolean;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onVoteComment: (commentId: string, direction: 'up' | 'down') => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    level: number;
  };
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  isAuthor?: boolean;
  isEdited?: boolean;
  replies?: Comment[];
  replyCount?: number;
}
```

**Key UI Elements:**
```tsx
function CommentItem({ comment, onAddReply, onVote }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const formattedDate = formatRelativeTime(comment.createdAt);
  
  const handleReplySubmit = async (content: string) => {
    await onAddReply(content);
    setIsReplying(false);
  };
  
  return (
    <div className="p-6">
      {/* Comment header */}
      <div className="flex items-start">
        <img 
          src={comment.author.avatarUrl} 
          alt=""
          className="w-8 h-8 rounded-full"
        />
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <span className="font-medium text-gray-900">{comment.author.displayName}</span>
            {comment.isAuthor && (
              <span className="ml-2 text-xs bg-primary-light text-primary px-1.5 rounded-md">
                Author
              </span>
            )}
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 rounded-md">
              Lvl {comment.author.level}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {formattedDate}
            {comment.isEdited && (
              <span className="ml-1">(edited)</span>
            )}
          </div>
          
          {/* Comment content */}
          <div className="mt-2 text-gray-800">
            {comment.content}
          </div>
          
          {/* Comment actions */}
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <div className="flex items-center mr-4">
              <button 
                className={`p-1 rounded-md hover:bg-gray-100 ${comment.userVote === 'up' ? 'text-success' : ''}`}
                onClick={() => onVote('up')}
                aria-label="Upvote"
              >
                <ArrowUpIcon className="w-4 h-4" />
              </button>
              <span className="mx-1">
                {(comment.upvotes - comment.downvotes).toLocaleString()}
              </span>
              <button 
                className={`p-1 rounded-md hover:bg-gray-100 ${comment.userVote === 'down' ? 'text-error' : ''}`}
                onClick={() => onVote('down')}
                aria-label="Downvote"
              >
                <ArrowDownIcon className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center mr-4 hover:text-gray-700"
            >
              <ReplyIcon className="w-4 h-4 mr-1" />
              Reply
            </button>
            
            <button className="flex items-center hover:text-gray-700">
              <FlagIcon className="w-4 h-4 mr-1" />
              Report
            </button>
          </div>
          
          {/* Reply editor */}
          {isReplying && (
            <div className="mt-3">
              <CommentEditor 
                onSubmit={handleReplySubmit}
                placeholder={`Reply to ${comment.author.displayName}...`}
              />
            </div>
          )}
          
          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 border-l-2 border-gray-100 pl-4">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onAddReply={onAddReply}
                  onVote={(direction) => onVote(reply.id, direction)}
                />
              ))}
            </div>
          )}
          
          {/* Show more replies link */}
          {comment.replyCount && comment.replyCount > (comment.replies?.length || 0) && (
            <button className="mt-2 text-sm text-primary hover:underline">
              Show {comment.replyCount - (comment.replies?.length || 0)} more {comment.replyCount - (comment.replies?.length || 0) === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement clear threaded comment structure
  - Provide inline reply functionality for conversations
  - Show comment author context (original poster, etc.)
  - Support pagination for large comment threads
  - Implement optimistic updates for better user experience
  - Create appropriate error handling for submission failures
  - Include moderation options for inappropriate content

- **Potential Challenges:**
  - Managing deeply nested comment threads
  - Balancing load performance with thread completeness
  - Handling complex reply interactions
  - Maintaining reply context for users

### Sub-Task 5: Content Creation Editor
**Description:** Implement the rich content creation interface that enables users to create formatted posts with media attachments.

**Component Hierarchy:**
```
ContentEditor/
├── EditorToolbar/         # Formatting controls
│   ├── TextControls       # Text formatting options
│   ├── ListControls       # List formatting options
│   └── MediaControls      # Media insertion tools
├── EditorContent/         # Main editing area
│   ├── TextEditor         # Rich text input area
│   └── MediaPreview       # Uploaded media display
├── EditorMetadata/        # Additional content fields
│   ├── TitleInput         # Post title field
│   ├── CategorySelect     # Category dropdown
│   └── TagInput           # Topic tags interface
└── PublishControls/       # Submission and draft options
```

**Key Interface/Props:**
```tsx
interface ContentEditorProps {
  initialData?: Partial<PostFormData>;
  categories: Category[];
  isEdit?: boolean;
  onSubmit: (data: PostFormData) => Promise<void>;
  onSaveDraft?: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
}

interface PostFormData {
  title: string;
  content: string;
  categoryId: string;
  tags?: string[];
  media?: File[];
  mediaToKeep?: string[]; // For edit mode, media URLs to retain
}
```

**Key UI Elements:**
```tsx
function ContentEditor({ 
  initialData = {}, 
  categories, 
  isEdit = false,
  onSubmit, 
  onSaveDraft,
  onCancel 
}: ContentEditorProps) {
  const [formData, setFormData] = useState<PostFormData>({
    title: initialData.title || '',
    content: initialData.content || '',
    categoryId: initialData.categoryId || '',
    tags: initialData.tags || [],
    media: [],
    mediaToKeep: initialData.mediaToKeep || []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle rich text content changes
  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
    
    // Clear error for content
    if (errors.content) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.content;
        return newErrors;
      });
    }
  };
  
  // Handle media uploads
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const newFiles = Array.from(e.target.files);
    
    // Generate preview URLs
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    
    setFormData(prev => ({
      ...prev,
      media: [...(prev.media || []), ...newFiles]
    }));
    
    setMediaPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to publish post', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to publish post. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Input */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            className={`
              shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md
              ${errors.title ? 'border-red-300' : ''}
            `}
            placeholder="Enter a descriptive title"
          />
        </div>
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>
      
      {/* Category Selection */}
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <div className="mt-1">
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className={`
              shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md
              ${errors.categoryId ? 'border-red-300' : ''}
            `}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        {errors.categoryId && (
          <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
        )}
      </div>
      
      {/* Content Editor */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <div className="mt-1">
          <RichTextEditor
            initialValue={formData.content}
            onChange={handleContentChange}
            error={!!errors.content}
          />
        </div>
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content}</p>
        )}
      </div>
      
      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Media (Optional)
        </label>
        <div className="mt-1 flex items-center">
          <label className="relative cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
            <span>Add Images</span>
            <input 
              type="file" 
              className="sr-only" 
              multiple 
              accept="image/*"
              onChange={handleMediaUpload}
            />
          </label>
          <p className="ml-3 text-xs text-gray-500">
            JPG, PNG, GIF up to 5MB each
          </p>
        </div>
        
        {/* Media Preview */}
        {(mediaPreviewUrls.length > 0 || (formData.mediaToKeep && formData.mediaToKeep.length > 0)) && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {mediaPreviewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img 
                  src={url} 
                  alt=""
                  className="h-24 w-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(index)}
                  className="absolute top-1 right-1 bg-gray-900 bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {formData.mediaToKeep?.map((url) => (
              <div key={url} className="relative">
                <img 
                  src={url} 
                  alt=""
                  className="h-24 w-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSavedMedia(url)}
                  className="absolute top-1 right-1 bg-gray-900 bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Tags Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tags (Optional)
        </label>
        <div className="mt-1">
          <TagsInput 
            value={formData.tags || []}
            onChange={tags => setFormData(prev => ({ ...prev, tags }))}
            placeholder="Add tags separated by comma"
            maxTags={5}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Add up to 5 tags to categorize your post
        </p>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        
        {onSaveDraft && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isDraftSaving || isSubmitting}
            className="px-4 py-2 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-primary-50"
          >
            {isDraftSaving ? 'Saving...' : 'Save Draft'}
          </button>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
        >
          {isSubmitting ? 'Publishing...' : isEdit ? 'Update Post' : 'Publish Post'}
        </button>
      </div>
    </form>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement real-time validation with clear error messages
  - Provide media preview with removal option
  - Include draft saving functionality for content protection
  - Support rich text formatting for content expression
  - Implement proper form state management
  - Handle transitions between editing and viewing states
  - Include category selection for proper content organization

- **Potential Challenges:**
  - Rich text editor integration and customization
  - Media upload handling and optimization
  - Draft state persistence across sessions
  - Maintaining editor state during preview/edits

## Integration Points
- Connects with Authentication task for user identity in created content
- Interfaces with Navigation components for category browsing
- Provides content for Notification System on new posts/comments
- Feeds into Gamification System for content creation achievements
- Integrates with Media handling components for user uploads

## Testing Strategy
- Component testing of all content display and creation interfaces
- Form validation testing with various input scenarios
- Media upload and display testing
- Comment thread rendering with various depths
- Responsive testing across device sizes for layout adaptation
- Voting and interaction testing
- Performance testing with large content datasets

## Definition of Done
This task is complete when:
- [ ] Category browsing system enables intuitive content discovery
- [ ] Post list component displays content with proper engagement metrics
- [ ] Post detail view shows complete content with media handling
- [ ] Comment system enables threaded discussions with proper nesting
- [ ] Content editor allows rich text creation with media uploads
- [ ] Voting mechanisms work correctly for posts and comments
- [ ] All components adapt appropriately to different screen sizes
- [ ] Content state changes are properly reflected in real-time
- [ ] Loading, empty, and error states are properly handled
- [ ] Media uploads and previews work reliably
- [ ] Validation ensures quality content with appropriate feedback
- [ ] All components follow design system specifications

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

# Task 7: Market Data Visualization

## Task Overview
Implement the market data visualization components that provide real-time token price information, market trends, and milestone tracking. This feature bridges the meme token aspect with the community platform, offering transparency into market performance while celebrating milestones that reinforce the Success Kid ethos of achievement and progress.

## Required Document Review
- **Masterplan Document** - Section 4.3 (Token & Market Features) for specific requirements
- **Design System Document** - Section 8.4 (Data Display Patterns) for chart and visualization guidelines
- **App Flow Document** - Section 4.3.4 (Market Milestone Tracking) for milestone visualization
- **Frontend & Backend Guidelines** - Section 5.4 (Integration Strategy) for API integration

## User Experience Flow
1. **Price Overview:** User views current token price with change indicators
2. **Chart Exploration:** User interacts with price chart to view different timeframes
3. **Milestone Tracking:** User sees progress toward next market cap milestone
4. **Transaction Feed:** User browses recent token transactions in network
5. **Price Alerts:** User configures alerts for price targets or milestones

## Implementation Sub-Tasks

### Sub-Task 1: Price Chart Component
**Description:** Create the interactive price chart that visualizes token price movement across different timeframes with appropriate technical indicators.

**Component Hierarchy:**
```
PriceChart/
├── ChartContainer/      # Main chart area with price display
│   ├── PriceLine        # Price movement visualization
│   ├── VolumeBar        # Trading volume display
│   └── Indicators       # Technical indicators (optional)
├── TimeframeSelector/   # Time period selection controls
├── PriceInfo/           # Current price and change display
└── ChartControls/       # Additional chart configuration
```

**Key Interface/Props:**
```tsx
interface PriceChartProps {
  tokenId: string;
  initialTimeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
  height?: number;
  showVolume?: boolean;
  enableZoom?: boolean;
  onPriceUpdate?: (price: number, change: number) => void;
}

interface ChartData {
  prices: Array<[timestamp: number, price: number]>;
  volumes: Array<[timestamp: number, volume: number]>;
  marketCaps: Array<[timestamp: number, marketCap: number]>;
}
```

**Key UI Elements:**
```tsx
function PriceChart({ 
  tokenId, 
  initialTimeframe = 'day', 
  height = 300,
  showVolume = true,
  enableZoom = true,
  onPriceUpdate
}: PriceChartProps) {
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch chart data when timeframe changes
  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await marketDataService.getTokenChartData(tokenId, timeframe);
        setChartData(data);
        
        // Update price info if callback provided
        if (data.prices.length > 0 && onPriceUpdate) {
          const lastPrice = data.prices[data.prices.length - 1][1];
          const firstPrice = data.prices[0][1];
          const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
          
          onPriceUpdate(lastPrice, priceChange);
        }
      } catch (error) {
        console.error('Failed to fetch chart data', error);
        setError('Unable to load chart data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChartData();
  }, [tokenId, timeframe, onPriceUpdate]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* Price info and timeframe selector */}
      <div className="flex justify-between items-center mb-4">
        <PriceInfo 
          price={getCurrentPrice(chartData)}
          change={getPriceChange(chartData)}
          isLoading={isLoading}
        />
        
        <TimeframeSelector 
          timeframe={timeframe}
          onChange={setTimeframe}
          options={[
            { value: 'day', label: '24H' },
            { value: 'week', label: '7D' },
            { value: 'month', label: '30D' },
            { value: 'year', label: '1Y' },
            { value: 'all', label: 'All' }
          ]}
        />
      </div>
      
      {/* Chart display with appropriate states */}
      <div style={{ height }}>
        {isLoading ? (
          <ChartSkeleton />
        ) : error ? (
          <ErrorDisplay message={error} />
        ) : !chartData || chartData.prices.length === 0 ? (
          <NoDataDisplay />
        ) : (
          <LineChart 
            data={formatChartData(chartData)} 
            showVolume={showVolume}
            enableZoom={enableZoom}
          />
        )}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement responsive charts that adapt to container width
  - Provide clear timeframe selection options
  - Show appropriate loading states during data fetching
  - Include visual indicators for price direction (up/down)
  - Support touch interaction for mobile users
  - Optimize rendering performance for large datasets
  - Use consistent color coding for price movement

- **Potential Challenges:**
  - Real-time Updates: Balancing frequent updates with performance
  - Data Volume: Efficiently rendering potentially large datasets
  - Zoom Functionality: Implementing smooth zooming and panning
  - Mobile Responsiveness: Adapting complex charts to small screens

### Sub-Task 2: Market Cap Visualization
**Description:** Create the market cap milestone tracking visualization that shows progress toward the next target and celebrates achievements.

**Component Hierarchy:**
```
MarketCapTracker/
├── MilestoneProgress/    # Visual progress indicator
│   ├── CurrentValue      # Current market cap display
│   ├── ProgressBar       # Visual progress representation
│   └── NextMilestone     # Next target indicator
├── MilestoneHistory/     # Previously achieved milestones
└── MilestoneCelebration/ # Animation for reaching milestone
```

**Key Interface/Props:**
```tsx
interface MarketCapTrackerProps {
  currentMarketCap: number;
  milestones: Milestone[];
  showHistory?: boolean;
}

interface Milestone {
  value: number;
  label: string;
  achieved: boolean;
  achievedAt?: string;
}
```

**Key UI Elements:**
```tsx
function MarketCapTracker({ 
  currentMarketCap, 
  milestones,
  showHistory = true
}: MarketCapTrackerProps) {
  // Find next milestone
  const nextMilestone = milestones.find(m => !m.achieved);
  
  // Calculate progress toward next milestone
  const progress = nextMilestone 
    ? Math.min(100, (currentMarketCap / nextMilestone.value) * 100)
    : 100;
  
  // Sort achieved milestones by date
  const achievedMilestones = milestones
    .filter(m => m.achieved)
    .sort((a, b) => {
      if (!a.achievedAt || !b.achievedAt) return 0;
      return new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime();
    });
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Market Cap Milestones
      </h3>
      
      {/* Current market cap */}
      <div className="flex justify-between items-baseline mb-1">
        <div className="text-sm text-gray-500">Current Market Cap</div>
        <div className="text-lg font-medium text-gray-900">
          ${formatLargeNumber(currentMarketCap)}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 mb-1">
        <div className="h-8 bg-gray-100 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
            {Math.round(progress)}% to next milestone
          </div>
        </div>
      </div>
      
      {/* Next milestone */}
      {nextMilestone && (
        <div className="flex justify-between items-baseline mt-3">
          <div className="text-sm text-gray-500">Next Milestone</div>
          <div className="flex items-center">
            <TrophyIcon className="w-5 h-5 text-yellow-500 mr-1" />
            <span className="text-lg font-medium text-gray-900">
              ${formatLargeNumber(nextMilestone.value)}
            </span>
          </div>
        </div>
      )}
      
      {/* Previous milestones */}
      {showHistory && achievedMilestones.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Achieved Milestones
          </h4>
          <div className="space-y-3">
            {achievedMilestones.slice(0, 3).map((milestone) => (
              <AchievedMilestone key={milestone.value} milestone={milestone} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Use smooth animations for progress updates
  - Provide clear visual context for milestone values
  - Implement celebratory animations for milestone achievements
  - Use consistent formatting for large numbers
  - Show milestone history for context and motivation
  - Ensure all interactive elements are accessible

- **Potential Challenges:**
  - Value Scale: Creating intuitive visualizations for large value differences
  - Celebration Timing: Coordinating milestone celebrations across users
  - Progress Perception: Making small percentage progress feel meaningful
  - Historical Context: Balancing history display with forward-looking goals

### Sub-Task 3: Transaction Feed Component
**Description:** Create the transaction feed that displays recent token transactions with appropriate filtering and details.

**Component Hierarchy:**
```
TransactionFeed/
├── TransactionFilters/   # Filter and sort controls
├── TransactionList/      # List of transaction items
│   └── TransactionItem   # Individual transaction display
├── TransactionStats/     # Aggregate statistics display
└── LiveIndicator/        # Real-time update indicator
```

**Key Interface/Props:**
```tsx
interface TransactionFeedProps {
  tokenAddress: string;
  maxItems?: number;
  showFilters?: boolean;
  liveUpdates?: boolean;
}

interface Transaction {
  hash: string;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  value: number;
  timestamp: number;
  fromAddress: string;
  toAddress: string;
  blockNumber: number;
}
```

**Key UI Elements:**
```tsx
function TransactionFeed({ 
  tokenAddress, 
  maxItems = 20,
  showFilters = true,
  liveUpdates = true
}: TransactionFeedProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    minAmount: 0
  });
  
  // Initial data load
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const data = await marketDataService.getTokenTransactions(
          tokenAddress, 
          maxItems,
          filters
        );
        setTransactions(data);
      } catch (error) {
        console.error('Failed to load transactions', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTransactions();
  }, [tokenAddress, maxItems, filters]);
  
  // Live updates subscription
  useEffect(() => {
    if (!liveUpdates) return;
    
    const subscription = marketDataService.subscribeToTransactions(
      tokenAddress,
      (newTransaction) => {
        setTransactions(prev => {
          // Filter by current criteria
          if (filters.type !== 'all' && newTransaction.type !== filters.type) {
            return prev;
          }
          
          if (newTransaction.amount < filters.minAmount) {
            return prev;
          }
          
          // Add to beginning, maintain max length
          return [newTransaction, ...prev].slice(0, maxItems);
        });
      }
    );
    
    return () => subscription.unsubscribe();
  }, [tokenAddress, liveUpdates, maxItems, filters]);
  
  // Calculate transaction statistics
  const stats = useMemo(() => {
    const buys = transactions.filter(t => t.type === 'buy').length;
    const sells = transactions.filter(t => t.type === 'sell').length;
    const totalVolume = transactions.reduce((sum, t) => sum + t.value, 0);
    
    return {
      buyRatio: transactions.length ? (buys / transactions.length) * 100 : 0,
      sellRatio: transactions.length ? (sells / transactions.length) * 100 : 0,
      totalVolume
    };
  }, [transactions]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header with live indicator */}
      <div className="border-b border-gray-200 px-4 py-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Recent Transactions
        </h3>
        {liveUpdates && <LiveIndicator />}
      </div>
      
      {/* Transaction stats */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-sm text-gray-500">Buy/Sell Ratio</div>
          <div className="flex mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="bg-success h-full" 
              style={{ width: `${stats.buyRatio}%` }}
            />
            <div 
              className="bg-error h-full" 
              style={{ width: `${stats.sellRatio}%` }}
            />
          </div>
          <div className="mt-1 text-xs flex justify-between">
            <span className="text-success">{Math.round(stats.buyRatio)}% Buys</span>
            <span className="text-error">{Math.round(stats.sellRatio)}% Sells</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Volume (24h)</div>
          <div className="text-base font-medium text-gray-900">${formatLargeNumber(stats.totalVolume)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Transactions</div>
          <div className="text-base font-medium text-gray-900">{transactions.length}</div>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-gray-200 flex space-x-4">
          <select
            className="rounded-md border-gray-300 py-1 pl-3 pr-8 text-sm"
            value={filters.type}
            onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="all">All Transactions</option>
            <option value="buy">Buys Only</option>
            <option value="sell">Sells Only</option>
            <option value="transfer">Transfers Only</option>
          </select>
          
          <select
            className="rounded-md border-gray-300 py-1 pl-3 pr-8 text-sm"
            value={filters.minAmount}
            onChange={e => setFilters(prev => ({ ...prev, minAmount: Number(e.target.value) }))}
          >
            <option value="0">All Amounts</option>
            <option value="1000">1,000+ Tokens</option>
            <option value="10000">10,000+ Tokens</option>
            <option value="100000">100,000+ Tokens</option>
          </select>
        </div>
      )}
      
      {/* Transaction list */}
      <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <TransactionSkeleton count={5} />
        ) : transactions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No transactions found
          </div>
        ) : (
          transactions.map(transaction => (
            <TransactionItem key={transaction.hash} transaction={transaction} />
          ))
        )}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement live updates with visual indicators
  - Provide useful transaction filters for discovery
  - Display aggregate statistics for market context
  - Use clear visual indicators for transaction types
  - Implement efficient rendering for large transaction volumes
  - Include links to blockchain explorer for transaction details

- **Potential Challenges:**
  - Real-time Updates: Managing WebSocket connections and reconnections
  - Data Volume: Handling potentially large numbers of transactions
  - Mobile Rendering: Displaying complex transaction data on small screens
  - Performance: Efficiently rendering and updating the transaction list

### Sub-Task 4: Price Alert Configuration
**Description:** Create the price alert configuration interface that allows users to set and manage alerts for specific price targets or milestone achievements.

**Component Hierarchy:**
```
PriceAlerts/
├── AlertsList/           # Existing alerts display
│   └── AlertItem         # Individual alert with controls
├── CreateAlertForm/      # New alert configuration
│   ├── PriceInput        # Target price entry
│   ├── AlertTypeSelector # Alert condition selection
│   └── NotificationConfig # Alert delivery options
└── AlertStatusIndicator/ # Active alerts summary
```

**Key Interface/Props:**
```tsx
interface PriceAlertsProps {
  tokenId: string;
  currentPrice: number;
}

interface PriceAlert {
  id: string;
  tokenId: string;
  type: 'above' | 'below' | 'percent_change' | 'milestone';
  targetValue: number;
  triggered: boolean;
  createdAt: string;
  notificationMethods: ('email' | 'push' | 'in_app')[];
}
```

**Key UI Elements:**
```tsx
function PriceAlerts({ tokenId, currentPrice }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Load existing alerts
  useEffect(() => {
    const loadAlerts = async () => {
      setIsLoading(true);
      try {
        const data = await alertsService.getUserAlerts(tokenId);
        setAlerts(data);
      } catch (error) {
        console.error('Failed to load alerts', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAlerts();
  }, [tokenId]);
  
  // Alert management functions
  const handleCreateAlert = async (newAlert: Omit<PriceAlert, 'id' | 'triggered' | 'createdAt'>) => {
    try {
      const createdAlert = await alertsService.createAlert({
        ...newAlert,
        tokenId
      });
      
      setAlerts(prev => [...prev, createdAlert]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create alert', error);
    }
  };
  
  const handleDeleteAlert = async (alertId: string) => {
    try {
      await alertsService.deleteAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert', error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header with create button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Price Alerts</h3>
          <p className="text-sm text-gray-500">Get notified when price hits your targets</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(prev => !prev)}
          className="flex items-center px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          {showCreateForm ? (
            <>
              <XIcon className="w-4 h-4 mr-1" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="w-4 h-4 mr-1" />
              New Alert
            </>
          )}
        </button>
      </div>
      
      {/* Create alert form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <CreateAlertForm 
            currentPrice={currentPrice} 
            onSubmit={handleCreateAlert}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}
      
      {/* Alerts list */}
      <div className="space-y-4">
        {isLoading ? (
          <AlertsSkeleton />
        ) : alerts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <BellOffIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p>No price alerts set</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-2 text-primary hover:underline text-sm"
            >
              Create your first alert
            </button>
          </div>
        ) : (
          alerts.map(alert => (
            <AlertItem 
              key={alert.id} 
              alert={alert} 
              currentPrice={currentPrice}
              onDelete={() => handleDeleteAlert(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Provide clear alert configuration options
  - Show current alert status and proximity to trigger
  - Implement notification delivery preferences
  - Allow easy management of multiple alerts
  - Include appropriate confirmation for alert deletion
  - Maintain user context with current price display

- **Potential Challenges:**
  - Alert Timing: Ensuring timely notification delivery across channels
  - Alert Persistence: Maintaining alert state across sessions and devices
  - Condition Evaluation: Accurately evaluating complex alert conditions
  - User Preferences: Balancing notification frequency with information value

## Integration Points
- Connects with Notification System for alert delivery
- Interfaces with Wallet Integration for showing user token holdings
- Provides data for Gamification System regarding market milestones
- Integrates with external price APIs for real-time data
- Sets context for Forum and Content System market discussions

## Testing Strategy
- Component testing of all data visualization components
- API integration testing with mock market data
- Real-time update testing for WebSocket connections
- State transition testing for price changes and alerts
- Responsive testing across device sizes
- Performance testing with large datasets and frequent updates
- Visual regression testing for charts and visualizations

## Definition of Done
This task is complete when:
- [ ] Price chart component displays token price with different timeframes
- [ ] Market cap visualization shows progress toward milestones
- [ ] Transaction feed displays token transactions with filtering
- [ ] Price alert configuration allows creating and managing alerts
- [ ] All components handle real-time data updates appropriately
- [ ] Loading, error, and empty states are properly implemented
- [ ] Components are responsive across all required device sizes
- [ ] Data refresh mechanisms avoid unnecessary API calls
- [ ] Chart interactions work correctly on both mouse and touch devices
- [ ] All milestone celebrations trigger appropriately
- [ ] API integrations are properly documented for backend implementation

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

# Task 9: Search and Discovery Components

## Task Overview
Implement the search and discovery components that enable users to find content, users, and topics efficiently across the platform. This feature enhances platform usability by providing quick access to relevant information and helps users discover new content aligned with their interests.

## Required Document Review
- **Frontend & Backend Guidelines** - Section 8.4 (Data Display Patterns)
- **Design System Document** - Section 8.2 (Navigation System)
- **Masterplan Document** - Section 3.5 (Accessibility & Inclusivity)

## User Experience Flow
1. **Search Initiation:** User enters query in search field or uses advanced search options
2. **Results Navigation:** User browses search results across different categories
3. **Filter Application:** User refines results with various filters
4. **Result Selection:** User selects a result item to view detailed information
5. **Discovery Features:** User explores suggested content and trending topics

## Implementation Sub-Tasks

### Sub-Task 1: Search Interface Implementation
**Description:** Create the search input interface with suggestions and advanced search options.

**Component Hierarchy:**
```
Search/
├── SearchBar/           # Main search input component
│   ├── SearchInput      # Text input with clear button
│   ├── SearchIcon       # Visual search indicator
│   └── ClearButton      # Reset search input
├── SearchSuggestions/   # Dropdown of search suggestions
│   └── SuggestionItem   # Individual suggestion
├── AdvancedSearch/      # Expandable advanced search options
└── SearchHistory/       # Recent search tracking
```

**Key Interface/Props:**
```tsx
interface SearchBarProps {
  initialQuery?: string;
  onSearch: (query: string, type?: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'user' | 'post' | 'topic' | 'category';
  iconUrl?: string;
  description?: string;
}
```

**Key UI Elements:**
```tsx
function SearchBar({ onSearch, initialQuery = '', placeholder = 'Search...', showSuggestions = true }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestionList, setShowSuggestionList] = useState(false);
  
  // Handle input change with debounce
  const debouncedFetchSuggestions = useCallback(
    debounce(async (searchText) => {
      if (searchText.length < 2) return setSuggestions([]);
      
      try {
        const results = await searchService.getSearchSuggestions(searchText);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to fetch suggestions', error);
      }
    }, 300),
    []
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedFetchSuggestions(value);
  };
  
  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className="relative">
      <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
        <SearchIcon className="ml-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestionList(true)}
          onBlur={() => setTimeout(() => setShowSuggestionList(false), 200)}
          placeholder={placeholder}
          className="w-full py-2 pl-2 pr-8 outline-none bg-transparent"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="mr-2 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Search suggestions */}
      {showSuggestions && showSuggestionList && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
          <ul className="max-h-60 py-1 overflow-auto">
            {suggestions.map((suggestion) => (
              <SuggestionItem 
                key={suggestion.id}
                suggestion={suggestion}
                onClick={() => {
                  setQuery(suggestion.text);
                  onSearch(suggestion.text, suggestion.type);
                  setShowSuggestionList(false);
                }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SuggestionItem({ suggestion, onClick }: { suggestion: SearchSuggestion, onClick: () => void }) {
  // Type-specific icon mapping
  const getTypeIcon = () => {
    switch (suggestion.type) {
      case 'user': return <UserIcon className="w-4 h-4" />;
      case 'post': return <DocumentIcon className="w-4 h-4" />;
      case 'topic': return <TagIcon className="w-4 h-4" />;
      case 'category': return <FolderIcon className="w-4 h-4" />;
      default: return <SearchIcon className="w-4 h-4" />;
    }
  };
  
  return (
    <li>
      <button
        className="w-full px-4 py-2 flex items-center hover:bg-gray-100 text-left"
        onClick={onClick}
      >
        {suggestion.iconUrl ? (
          <img src={suggestion.iconUrl} alt="" className="w-5 h-5 mr-3" />
        ) : (
          <span className="text-gray-500 mr-3">{getTypeIcon()}</span>
        )}
        <div>
          <div className="text-sm font-medium text-gray-900">{suggestion.text}</div>
          {suggestion.description && (
            <div className="text-xs text-gray-500">{suggestion.description}</div>
          )}
        </div>
        <span className="ml-auto text-xs text-gray-500 capitalize">{suggestion.type}</span>
      </button>
    </li>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement debounced input to prevent excessive API calls
  - Provide keyboard navigation for search suggestions
  - Show clear button when query exists
  - Support search history for returning users
  - Include visual indication of search in progress

- **Potential Challenges:**
  - Suggestion Relevance: Balancing speed with quality of suggestions
  - Mobile Keyboard: Handling virtual keyboard appearance on mobile
  - Search Context: Maintaining search context across page navigation

### Sub-Task 2: Results Display Component
**Description:** Create the search results display with categorized results and pagination.

**Component Hierarchy:**
```
SearchResults/
├── ResultsTabs/         # Category tabs for result types
├── ResultsList/         # List of search results
│   ├── ResultItem       # Individual result display
│   │   ├── ResultIcon   # Type-specific icon
│   │   ├── ResultTitle  # Primary result text
│   │   └── ResultMeta   # Additional result information
├── ResultsSection/      # Grouped results by category
└── ResultsPagination/   # Pagination or infinite scroll control
```

**Key Interface/Props:**
```tsx
interface SearchResultsProps {
  query: string;
  results: {
    posts: SearchResult[];
    users: SearchResult[];
    topics: SearchResult[];
    hasMore: boolean;
  };
  activeTab?: 'all' | 'posts' | 'users' | 'topics';
  isLoading: boolean;
  onTabChange: (tab: string) => void;
  onLoadMore: () => void;
}

interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'topic';
  title: string;
  description?: string;
  imageUrl?: string;
  url: string;
  metadata?: {
    author?: string;
    date?: string;
    likes?: number;
    comments?: number;
    followers?: number;
    posts?: number;
  };
  highlight?: {
    title?: string[];
    description?: string[];
  };
}
```

**Key UI Elements:**
```tsx
function SearchResults({ 
  query, 
  results, 
  activeTab = 'all', 
  isLoading, 
  onTabChange, 
  onLoadMore 
}: SearchResultsProps) {
  // Calculate result counts by category
  const resultCounts = {
    all: results.posts.length + results.users.length + results.topics.length,
    posts: results.posts.length,
    users: results.users.length,
    topics: results.topics.length
  };
  
  // Determine which results to show based on active tab
  const getVisibleResults = () => {
    if (activeTab === 'all') {
      return {
        posts: results.posts.slice(0, 3),
        users: results.users.slice(0, 3),
        topics: results.topics.slice(0, 3),
        showMore: {
          posts: results.posts.length > 3,
          users: results.users.length > 3,
          topics: results.topics.length > 3
        }
      };
    }
    
    return {
      [activeTab]: results[activeTab],
      showMore: { [activeTab]: false }
    };
  };
  
  const visibleResults = getVisibleResults();
  
  return (
    <div className="
    return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Search header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Search Results: "{query}"
        </h2>
      </div>
      
      {/* Result tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {Object.entries(resultCounts).map(([tab, count]) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`
                px-4 py-3 text-sm font-medium
                ${activeTab === tab 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
            </button>
          ))}
        </div>
      </div>
      
      {/* Results list */}
      {isLoading ? (
        <SearchResultsSkeleton />
      ) : resultCounts.all === 0 ? (
        <EmptySearchResults query={query} />
      ) : (
        <div className="divide-y divide-gray-200">
          {activeTab === 'all' && (
            <>
              {Object.entries(visibleResults).map(([type, items]) => {
                if (type === 'showMore') return null;
                if (!Array.isArray(items) || items.length === 0) return null;
                
                return (
                  <ResultSection 
                    key={type}
                    title={type}
                    items={items}
                    showMore={visibleResults.showMore[type]}
                    onShowMore={() => onTabChange(type)}
                  />
                );
              })}
            </>
          )}
          
          {activeTab !== 'all' && (
            <ResultList 
              items={visibleResults[activeTab]}
              type={activeTab}
              onLoadMore={onLoadMore}
              hasMore={results.hasMore}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, items, showMore, onShowMore }: ResultSectionProps) {
  return (
    <div className="py-4 px-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500 uppercase">
          {title}
        </h3>
        {showMore && (
          <button 
            onClick={onShowMore}
            className="text-sm text-primary hover:text-primary-dark"
          >
            View all
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {items.map(item => (
          <ResultItem key={item.id} result={item} />
        ))}
      </div>
    </div>
  );
}

function ResultItem({ result }: { result: SearchResult }) {
  // Get icon based on result type
  const getTypeIcon = () => {
    switch (result.type) {
      case 'user': return <UserIcon className="w-6 h-6 text-primary" />;
      case 'post': return <DocumentIcon className="w-6 h-6 text-primary" />;
      case 'topic': return <TagIcon className="w-6 h-6 text-primary" />;
      default: return <SearchIcon className="w-6 h-6 text-primary" />;
    }
  };
  
  return (
    <a 
      href={result.url}
      className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {result.imageUrl ? (
            <img 
              src={result.imageUrl} 
              alt="" 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
              {getTypeIcon()}
            </div>
          )}
        </div>
        
        <div className="ml-3 flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {/* Use highlighted title if available */}
            {result.highlight?.title ? (
              <span dangerouslySetInnerHTML={{ 
                __html: result.highlight.title.join('...') 
              }} />
            ) : (
              result.title
            )}
          </div>
          
          {result.description && (
            <div className="mt-1 text-sm text-gray-500 line-clamp-2">
              {/* Use highlighted description if available */}
              {result.highlight?.description ? (
                <span dangerouslySetInnerHTML={{ 
                  __html: result.highlight.description.join('...') 
                }} />
              ) : (
                result.description
              )}
            </div>
          )}
          
          {/* Result metadata */}
          <div className="mt-1 flex items-center text-xs text-gray-500">
            {result.type === 'post' && result.metadata && (
              <>
                <span>{result.metadata.author}</span>
                <span className="mx-1">•</span>
                <span>{formatDate(result.metadata.date)}</span>
                {result.metadata.comments !== undefined && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{result.metadata.comments} comments</span>
                  </>
                )}
              </>
            )}
            
            {result.type === 'user' && result.metadata && (
              <>
                {result.metadata.followers !== undefined && (
                  <span>{result.metadata.followers} followers</span>
                )}
                {result.metadata.posts !== undefined && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{result.metadata.posts} posts</span>
                  </>
                )}
              </>
            )}
            
            {result.type === 'topic' && result.metadata && (
              <>
                {result.metadata.posts !== undefined && (
                  <span>{result.metadata.posts} posts</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Categorize results for easier navigation
  - Show counts for each result category
  - Implement responsive layouts for different screen sizes
  - Use skeleton loading states during searches
  - Provide clear empty state messaging
  - Highlight matching terms in results

- **Potential Challenges:**
  - Result Diversity: Balancing different result types in mixed results
  - Performance: Handling potentially large result sets
  - Relevance Ranking: Displaying results in order of relevance

### Sub-Task 3: Filter and Sort Controls
**Description:** Create filter and sort controls to help users refine search results.

**Component Hierarchy:**
```
SearchFilters/
├── FilterPanel/         # Container for filter controls
│   ├── SortControls     # Sort order dropdown
│   ├── DateFilter       # Time period filter
│   ├── CategoryFilter   # Content category filter
│   └── ResetButton      # Reset all filters
├── ActiveFilters/       # Display of currently active filters
│   └── FilterTag        # Removable filter indicator
└── FilterToggle/        # Mobile filter panel toggle
```

**Key Interface/Props:**
```tsx
interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  categories?: Category[];
}

interface SearchFilters {
  sortBy: 'relevance' | 'newest' | 'oldest' | 'popular';
  timeframe: 'all' | 'day' | 'week' | 'month' | 'year';
  type?: 'posts' | 'users' | 'topics';
  categoryId?: string;
  minLevel?: number;
  maxLevel?: number;
}

interface Category {
  id: string;
  name: string;
  count?: number;
}
```

**Key UI Elements:**
```tsx
function SearchFilters({ filters, onFilterChange, categories = [] }: SearchFiltersProps) {
  const handleFilterChange = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };
  
  const handleResetFilters = () => {
    onFilterChange(getDefaultFilters(filters.type));
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      {/* Sort controls */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        >
          <option value="relevance">Most Relevant</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>
      
      {/* Date filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Time Period
        </label>
        <select
          value={filters.timeframe}
          onChange={(e) => handleFilterChange('timeframe', e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        >
          <option value="all">All Time</option>
          <option value="day">Past 24 Hours</option>
          <option value="week">Past Week</option>
          <option value="month">Past Month</option>
          <option value="year">Past Year</option>
        </select>
      </div>
      
      {/* Type-specific filters */}
      {filters.type === 'posts' && categories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filters.categoryId || ''}
            onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} {category.count ? `(${category.count})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* User level filter - only for users */}
      {filters.type === 'users' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User Level
          </label>
          <div className="space-y-2">
            <RangeSlider
              min={1}
              max={10}
              step={1}
              value={[filters.minLevel || 1, filters.maxLevel || 10]}
              onChange={(values) => {
                handleFilterChange('minLevel', values[0]);
                handleFilterChange('maxLevel', values[1]);
              }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Level {filters.minLevel || 1}</span>
              <span>Level {filters.maxLevel || 10}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Reset filters button */}
      <div className="pt-2">
        <button
          onClick={handleResetFilters}
          className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}

function RangeSlider({ min, max, step, value, onChange }: RangeSliderProps) {
  return (
    <div className="relative pt-1">
      <div className="h-1 bg-gray-200 rounded-full">
        <div
          className="absolute h-1 bg-primary rounded-full"
          style={{ 
            left: `${((value[0] - min) / (max - min)) * 100}%`, 
            width: `${((value[1] - value[0]) / (max - min)) * 100}%` 
          }}
        ></div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={(e) => onChange([parseInt(e.target.value), value[1]])}
        className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none"
        style={{ top: '4px' }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[1]}
        onChange={(e) => onChange([value[0], parseInt(e.target.value)])}
        className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none"
        style={{ top: '4px' }}
      />
    </div>
  );
}

function ActiveFilters({ filters, onRemove }: ActiveFiltersProps) {
  // Get active filters as array of {key, value, label} objects
  const activeFilters = getActiveFilters(filters);
  
  if (activeFilters.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {activeFilters.map(filter => (
        <div 
          key={filter.key} 
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary"
        >
          {filter.label}
          <button 
            type="button"
            className="ml-1 inline-flex text-primary-400 focus:outline-none"
            onClick={() => onRemove(filter.key)}
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Show contextual filters based on active result type
  - Implement real-time filter application
  - Provide clear reset option for filters
  - Use appropriate form controls for each filter type
  - Maintain filter state during navigation

- **Potential Challenges:**
  - Filter Complexity: Balancing powerful filtering with usability
  - Performance: Efficiently applying multiple filter criteria
  - State Management: Maintaining filter state across searches

### Sub-Task 4: Discovery Features
**Description:** Create content discovery components for suggested content and trending topics.

**Component Hierarchy:**
```
Discovery/
├── TrendingTopics/       # Popular hashtags and topics
│   └── TopicItem         # Individual trending topic
├── SuggestedContent/     # Personalized content recommendations
│   └── ContentCard       # Individual content suggestion
├── PopularCategories/    # High-activity content categories
└── FeaturedContent/      # Editorially selected content
```

**Key Interface/Props:**
```tsx
interface TrendingTopicsProps {
  topics: Topic[];
  onTopicClick: (topic: Topic) => void;
}

interface Topic {
  id: string;
  name: string;
  postCount: number;
  trending?: boolean;
  color?: string;
}

interface SuggestedContentProps {
  content: SuggestedItem[];
  onItemClick: (item: SuggestedItem) => void;
}

interface SuggestedItem {
  id: string;
  type: 'post' | 'user' | 'topic';
  title?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  author?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  level?: number;
  category?: string;
  reason?: 'popular' | 'recent' | 'relevance' | 'following';
}
```

**Key UI Elements:**
```tsx
function TrendingTopics({ topics, onTopicClick }: TrendingTopicsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-md font-medium text-gray-900 mb-3">
        Trending Topics
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onTopicClick(topic)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-900 flex items-center"
          >
            <span className="mr-1 text-primary">#</span>
            {topic.name}
            <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 rounded-full">
              {topic.postCount}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SuggestedContent({ content, onItemClick }: SuggestedContentProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-md font-medium text-gray-900 mb-3">
        Recommended For You
      </h3>
      
      <div className="space-y-3">
        {content.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center">
              <div className="mr-3">
                {item.type === 'post' ? (
                  <DocumentIcon className="w-10 h-10 text-primary" />
                ) : item.type === 'user' ? (
                  <UserIcon className="w-10 h-10 text-primary" />
                ) : (
                  <TagIcon className="w-10 h-10 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.title || item.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.type === 'post' 
                    ? `Posted by ${item.author?.name}` 
                    : item.type === 'user'
                    ? `Level ${item.level} User`
                    : `${item.postCount || 0} posts`}
                </p>
              </div>
              
              {item.reason && (
                <div className="ml-3 text-xs text-gray-500">
                  {item.reason === 'popular' && 'Popular'}
                  {item.reason === 'recent' && 'Recent'}
                  {item.reason === 'relevance' && 'For You'}
                  {item.reason === 'following' && 'Following'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Clearly differentiate discovery content from search results
  - Personalize recommended content based on user interests
  - Use visual indicators for content type
  - Provide context for why content is recommended
  - Implement efficient click/tap targets

- **Potential Challenges:**
  - Personalization Quality: Creating relevant recommendations
  - Content Freshness: Balancing new content with proven popular content
  - Visual Hierarchy: Distinguishing discovery from search results

## Integration Points
- Connects with Navigation components for search initiation
- Interfaces with Content System for displaying result items
- Provides data for User Profile Experience when showing user results
- Integrates with backend search APIs for retrieving results
- Sets context for forum navigation and content exploration

## Testing Strategy
- Component testing for search controls and results display
- Integration testing with mock search responses
- Search performance testing with large result sets
- Empty state and error handling testing
- Filter and sort function verification
- Keyboard navigation and screen reader testing

## Definition of Done
This task is complete when:
- [ ] Search interface provides intuitive query input with suggestions
- [ ] Results display shows categorized content with appropriate details
- [ ] Filter and sort controls allow result refinement
- [ ] Discovery features present trending and personalized content
- [ ] All components adapt appropriately to different screen sizes
- [ ] Loading, empty, and error states are properly handled
- [ ] Keyboard navigation and screen reader support is implemented
- [ ] Search state persists appropriately across page navigation
- [ ] Filter application properly refines result sets
- [ ] Discovery components present content based on user interests

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

# Task 11: Accessibility Implementation

## Task Overview
Implement comprehensive accessibility features throughout the platform to ensure all users, regardless of abilities or disabilities, can navigate, interact with, and benefit from the Success Kid Community. This implementation will support WCAG 2.1 AA compliance and create an inclusive environment that aligns with the platform's core value of inclusivity.

## Required Document Review
- **Design System Document** - Section 9 (Accessibility Framework)
- **Frontend & Backend Guidelines** - Section 7.2 (Responsive & Accessible Design)
- **Masterplan Document** - Section 3.5 (Accessibility & Inclusivity)

## User Experience Flow
1. **Keyboard Navigation:** User can navigate the entire platform using only keyboard
2. **Screen Reader Support:** Screen reader users receive appropriate context and information
3. **Focus Management:** User attention is directed appropriately between interface elements
4. **High Contrast Mode:** Users with visual impairments can leverage high contrast settings
5. **Responsive Adaptation:** Interface adapts to various zoom levels and device sizes

## Implementation Sub-Tasks

### Sub-Task 1: Keyboard Navigation System
**Description:** Implement a comprehensive keyboard navigation system that enables users to access all platform functionality without requiring a mouse.

**Key Implementation:**
```tsx
// Accessible Navigation Component with Keyboard Support
function AccessibleNavigation({ items }) {
  // Current focus index within navigation items
  const [focusIndex, setFocusIndex] = useState(-1);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex((index + 1) % items.length);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex(index === 0 ? items.length - 1 : index - 1);
        break;
      case 'Home':
        e.preventDefault();
        setFocusIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusIndex(items.length - 1);
        break;
    }
  };
  
  // Effect to focus element when index changes
  useEffect(() => {
    if (focusIndex >= 0) {
      const element = document.getElementById(`nav-item-${focusIndex}`);
      element?.focus();
    }
  }, [focusIndex]);
  
  return (
    <nav>
      <ul role="menubar" aria-label="Main Navigation">
        {items.map((item, index) => (
          <li key={item.id} role="none">
            <a
              id={`nav-item-${index}`}
              href={item.href}
              role="menuitem"
              tabIndex={focusIndex === index ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, index)}
              aria-current={item.isCurrent ? 'page' : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Skip Link Component for Keyboard Users
function SkipToMainContent() {
  return (
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-white px-4 py-2 rounded"
    >
      Skip to main content
    </a>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement "Skip to content" links to bypass navigation menus
  - Ensure all interactive elements are keyboard focusable with visible focus styles
  - Create logical tab order following visual layout
  - Use appropriate ARIA roles and attributes for custom widgets
  - Ensure keyboard shortcuts don't conflict with screen reader commands
  - Implement keyboard patterns that match native HTML behaviors

- **Potential Challenges:**
  - Custom Components: Replicating expected keyboard behavior for custom UI widgets
  - Modal Focus Trapping: Properly containing focus within modal dialogs
  - Dynamic Content: Maintaining keyboard accessibility when content changes
  - Focus Visibility: Creating visible focus indicators that work in all themes

### Sub-Task 2: Screen Reader Compatibility
**Description:** Ensure all platform content and functionality is properly announced to screen reader users with appropriate context and semantic structure.

**Key Implementation:**
```tsx
// Accessible Form Field with Proper Labeling
function AccessibleFormField({ id, label, error, helperText, ...inputProps }) {
  const fieldId = id || useId();
  const helperTextId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;
  
  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      <input 
        id={fieldId}
        aria-describedby={
          error ? errorId : helperText ? helperTextId : undefined
        }
        aria-invalid={!!error}
        {...inputProps}
      />
      {helperText && !error && (
        <div id={helperTextId} className="helper-text">
          {helperText}
        </div>
      )}
      {error && (
        <div id={errorId} className="error-text" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

// Accessible Live Region for Important Updates
function StatusAnnouncer() {
  const [message, setMessage] = useState('');
  
  // Subscribe to status messages that should be announced
  useEffect(() => {
    const handleStatusChange = (newMessage) => setMessage(newMessage);
    statusService.subscribe(handleStatusChange);
    return () => statusService.unsubscribe(handleStatusChange);
  }, []);
  
  return message ? (
    <div className="sr-only" role="status" aria-live="polite">
      {message}
    </div>
  ) : null;
}

// Example of ARIA landmarks for page structure
function AccessiblePageStructure({ children }) {
  return (
    <>
      <SkipToMainContent />
      <header role="banner">
        <AccessibleNavigation items={navigationItems} />
      </header>
      <main id="main-content" role="main">
        {children}
      </main>
      <aside role="complementary" aria-label="Related information">
        {/* Sidebar content */}
      </aside>
      <footer role="contentinfo">
        {/* Footer content */}
      </footer>
      <StatusAnnouncer />
    </>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Use semantic HTML elements (`<button>`, `<input>`, etc.) whenever possible
  - Include proper ARIA landmarks for page regions (main, nav, header, etc.)
  - Provide text alternatives for all non-text content
  - Ensure form controls have explicit labels
  - Use live regions to announce dynamic content changes
  - Create descriptive link text that makes sense out of context
  - Include appropriate alt text for images (empty for decorative images)

- **Potential Challenges:**
  - Dynamic Content: Properly announcing content that changes frequently
  - Complex Widgets: Creating accessible versions of rich interactive elements
  - Content Context: Providing sufficient context without overwhelming users
  - State Changes: Communicating visual state changes to screen reader users

### Sub-Task 3: Focus Management System
**Description:** Implement a system to properly manage keyboard focus, especially for dynamic content changes, modal dialogs, and notifications.

**Key Implementation:**
```tsx
// FocusTrap Component for Modals and Dialogs
function FocusTrap({ children, isActive, initialFocusRef }) {
  const containerRef = useRef(null);
  
  // Handle focus trapping
  useEffect(() => {
    if (!isActive) return;
    
    // Focus the specified element or first focusable element when opened
    const focusElement = initialFocusRef?.current || 
      containerRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    focusElement?.focus();
    
    // Store previous active element to restore focus later
    const previousActiveElement = document.activeElement;
    
    // Handle tab key to trap focus within the container
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      
      // Get all focusable elements in the container
      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements?.length) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // Trap focus in a loop
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when component unmounts
      if (isActive) previousActiveElement?.focus();
    };
  }, [isActive, initialFocusRef]);
  
  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}

// Modal Component with Focus Management
function AccessibleModal({ isOpen, onClose, title, children }) {
  // Ref for initial focus element
  const closeButtonRef = useRef(null);
  
  // Prevent scrolling of background content when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <FocusTrap isActive={isOpen} initialFocusRef={closeButtonRef}>
        <div className="modal-content">
          <header>
            <h2 id="modal-title">{title}</h2>
            <button 
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close modal"
            >
              &times;
            </button>
          </header>
          <div className="modal-body">
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Trap focus within modal dialogs and overlays
  - Return focus to triggering element when a modal closes
  - Ensure newly revealed content receives focus when appropriate
  - Avoid unexpected focus changes during normal navigation
  - Maintain logical tab order for dynamically added elements
  - Create visible focus indicators that meet contrast requirements
  - Allow keyboard users to dismiss notifications and tooltips

- **Potential Challenges:**
  - Complex Interfaces: Managing focus in applications with many interactive elements
  - Dynamic Content: Determining where focus should go after content changes
  - Multiple Modals: Handling nested dialogs or sequential modals
  - Single Page Applications: Maintaining focus during view transitions

### Sub-Task 4: High Contrast Mode Support
**Description:** Implement support for high contrast mode to ensure the platform remains usable for users with visual impairments who rely on increased contrast.

**Key Implementation:**
```tsx
// High Contrast Mode Hook
function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  // Check for high contrast mode preferences
  useEffect(() => {
    // Check for Windows high contrast mode
    const isHighContrastMode = window.matchMedia('(-ms-high-contrast: active)').matches || 
                               window.matchMedia('(forced-colors: active)').matches;
    
    setIsHighContrast(isHighContrastMode);
    
    // Listen for changes in preference
    const mediaQuery = window.matchMedia('(forced-colors: active)');
    const onChange = (e) => setIsHighContrast(e.matches);
    
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);
  
  return isHighContrast;
}

// Component with High Contrast Support
function AccessibleButton({ children, variant, ...props }) {
  const isHighContrast = useHighContrastMode();
  
  return (
    <button
      className={`button ${variant} ${isHighContrast ? 'high-contrast' : ''}`}
      style={{
        // Ensure text and background have sufficient contrast
        ...(isHighContrast && {
          '--button-background': 'ButtonFace',
          '--button-text': 'ButtonText',
          '--button-border': 'ButtonText',
          // Remove background images that might reduce contrast
          backgroundImage: 'none'
        })
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// CSS for supporting high contrast mode
const highContrastStyles = `
  /* Ensure focus indicators work in high contrast mode */
  *:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
  }
  
  /* Preserve critical boundary information */
  @media (forced-colors: active) {
    .card, .dialog, .dropdown-menu {
      border: 1px solid CanvasText;
    }
    
    /* Ensure icons remain visible */
    .icon {
      forced-color-adjust: none;
    }
    
    /* Use system colors for critical UI elements */
    .button-primary {
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
```

**Implementation Considerations:**
- **Best Practices:**
  - Test with Windows High Contrast mode and browser forced colors
  - Use appropriate system colors in high contrast mode (ButtonText, Highlight, etc.)
  - Ensure all UI elements have visible boundaries
  - Avoid relying solely on color to convey information
  - Provide sufficient contrast for text and UI controls (4.5:1 minimum)
  - Design focus indicators that work in all contrast modes
  - Use border properties instead of box-shadow for important boundaries

- **Potential Challenges:**
  - Visual Design Conflicts: Balancing brand aesthetics with high contrast needs
  - Icon Visibility: Ensuring icons remain visible in various contrast modes
  - Interactive States: Maintaining clear hover and focus states in high contrast
  - Graphics and Charts: Creating data visualizations that work in high contrast

## Integration Points
- Connects with all user interface components across the platform
- Provides foundation for consistent accessibility implementation
- Interfaces with Design System to ensure accessibility in all components
- Supports Authentication flow for accessible login experience
- Integrates with Navigation System for keyboard accessibility

## Testing Strategy
- Screen reader testing with NVDA, JAWS, and VoiceOver
- Keyboard-only navigation testing of all interfaces
- Contrast and color analysis with automated tools
- Testing with Windows High Contrast mode
- Accessibility conformance testing against WCAG 2.1 AA criteria
- User testing with individuals who have disabilities
- Automated accessibility testing with axe-core or similar tools

## Definition of Done
This task is complete when:
- [ ] All interactive elements are fully keyboard accessible
- [ ] Appropriate ARIA attributes are implemented throughout the platform
- [ ] Screen reader testing confirms all content is properly announced
- [ ] Focus management works correctly for modals, notifications, and dynamic content
- [ ] High contrast mode is fully supported across all components
- [ ] Skip links and keyboard shortcuts are implemented for improved navigation
- [ ] All components meet WCAG 2.1 AA requirements
- [ ] Automated accessibility testing shows no critical issues
- [ ] Documentation is complete for accessibility features and keyboard shortcuts
- [ ] Accessibility testing with actual assistive technology users has been conducted

# Task 12: Testing and Quality Assurance

## Task Overview
Implement comprehensive testing and quality assurance processes to ensure the Success Kid Community Platform delivers a reliable, accessible, and performant user experience. This task establishes testing patterns for all frontend components and creates processes for ongoing quality validation.

## Required Document Review
- **Frontend & Backend Guidelines** - Section 10 (Testing Strategy) for testing approach
- **App Flow Document** - Section 7.2 (Critical Testing Scenarios) for key user flows to test
- **Design System Document** - Section 9 (Accessibility Framework) for testing requirements
- **Masterplan Document** - Section 6.5 (Technical Debt & Quality Management) for quality standards

## User Experience Flow
Testing should validate the following key user journeys:
1. **Registration & Onboarding:** User can complete registration and onboarding process
2. **Content Creation & Engagement:** User can create, view, and interact with content
3. **Wallet Integration:** User can connect wallet and view token information
4. **Achievement System:** User can earn and view achievements and points
5. **Market Data:** User can view and interact with token market information

## Implementation Sub-Tasks

### Sub-Task 1: Component Test Suite
**Description:** Implement unit tests for core UI components to validate their functionality, rendering, and state management.

**Component Testing Framework:**
```
Testing/
├── Component/              # Component-specific tests
│   ├── Atoms               # Basic component tests
│   ├── Molecules           # Composite component tests
│   ├── Organisms           # Complex component tests
│   └── Templates           # Layout template tests
├── Fixtures/               # Test data fixtures
└── Helpers/                # Testing utilities
```

**Key Test Configuration:**
```tsx
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/testing/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/testing/mocks/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    '!src/components/**/*.stories.{ts,tsx}',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

**Example Component Test:**
```tsx
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button component', () => {
  test('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders in disabled state when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('displays loading state correctly', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText(/click me/i)).not.toBeInTheDocument();
  });
});
```

**Implementation Considerations:**
- **Best Practices:**
  - Test component behavior, not implementation details
  - Create reusable test fixtures for consistent data
  - Test all component states (default, loading, error, etc.)
  - Mock external dependencies like APIs and services
  - Use meaningful test descriptions that document component behavior
  - Include visual regression tests for key components
  - Implement snapshot testing cautiously, focusing on critical UI elements

- **Potential Challenges:**
  - Component Complexity: Breaking down complex components for testability
  - State Management: Testing components with complex state logic
  - Animation Testing: Validating motion and transition behaviors
  - Mock Management: Maintaining test doubles for external dependencies

### Sub-Task 2: Integration Test Suite
**Description:** Implement integration tests for key user flows and component interactions to validate system behavior.

**Integration Testing Approach:**
```tsx
// userRegistration.test.tsx (Example integration test)
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/context/AuthContext';
import RegistrationFlow from '@/components/auth/RegistrationFlow';
import { mockAuthService } from '@/testing/mocks/services';

// Mock the auth service
jest.mock('@/services/authService', () => mockAuthService);

describe('User Registration Flow', () => {
  beforeEach(() => {
    mockAuthService.register.mockClear();
  });

  test('completes registration with valid inputs', async () => {
    render(
      <AuthProvider>
        <RegistrationFlow />
      </AuthProvider>
    );
    
    // Fill registration form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/terms/i));
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    // Verify auth service called with correct data
    await waitFor(() => {
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        acceptedTerms: true
      });
    });
    
    // Verify user is directed to onboarding
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });

  // Add more tests for validation errors, service failures, etc.
});
```

**Custom Testing Hooks:**
```tsx
// useTestFlow.ts (Testing helper for common flows)
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';

export function useTestFlow() {
  // Common test sequences
  async function completeRegistration(email: string, username: string, password: string) {
    await userEvent.type(screen.getByLabelText(/email/i), email);
    await userEvent.type(screen.getByLabelText(/username/i), username);
    await userEvent.type(screen.getByLabelText(/password/i), password);
    await userEvent.click(screen.getByLabelText(/terms/i));
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
  }

  async function connectWallet() {
    await userEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    // Simulate wallet response
    await act(async () => {
      window.dispatchEvent(new CustomEvent('walletConnected', { 
        detail: { address: '0x123...abc' } 
      }));
    });
  }

  // Add more common flow helpers

  return {
    completeRegistration,
    connectWallet,
    // other flow helpers
  };
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Focus on critical user flows identified in requirements
  - Test end-to-end journeys from the user's perspective
  - Mock external services and API responses consistently
  - Verify state changes and UI updates for complex interactions
  - Use page object patterns for maintainable test structure
  - Create custom testing utilities for common flow sequences
  - Implement retry logic for asynchronous operations

- **Potential Challenges:**
  - Asynchronous Flows: Testing complex multi-step processes
  - State Synchronization: Ensuring components update correctly during tests
  - Service Mocking: Creating realistic mock responses for all scenarios
  - Test Stability: Handling timing issues and race conditions

### Sub-Task 3: Accessibility Testing
**Description:** Implement accessibility testing to ensure the platform is usable by people with disabilities and meets WCAG 2.1 AA standards.

**Automated Accessibility Testing:**
```tsx
// Button.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Button from './Button';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  test('should not have accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('disabled button should have appropriate aria attributes', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  test('button with icon should have accessible label', () => {
    render(
      <Button 
        icon={<CloseIcon />} 
        aria-label="Close dialog"
      />
    );
    expect(screen.getByRole('button')).toHaveAccessibleName('Close dialog');
  });
});
```

**Keyboard Navigation Testing:**
```tsx
// Dialog.a11y.test.tsx (Testing keyboard interactions)
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dialog from './Dialog';

describe('Dialog accessibility', () => {
  test('traps focus when open', async () => {
    render(
      <Dialog isOpen title="Test Dialog">
        <button>First Button</button>
        <button>Second Button</button>
        <button>Close</button>
      </Dialog>
    );
    
    // Check initial focus (should be on first focusable element)
    expect(screen.getByRole('button', { name: /first button/i })).toHaveFocus();
    
    // Tab to next element
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /second button/i })).toHaveFocus();
    
    // Tab to last element
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();
    
    // Tab should cycle back to first element (focus trap)
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /first button/i })).toHaveFocus();
  });

  test('closes on Escape key press', () => {
    const handleClose = jest.fn();
    render(
      <Dialog isOpen onClose={handleClose} title="Test Dialog">
        <div>Dialog content</div>
      </Dialog>
    );
    
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });
});
```

**Implementation Considerations:**
- **Best Practices:**
  - Integrate automated accessibility testing into CI pipeline
  - Test keyboard navigation for all interactive components
  - Verify proper focus management for modals and overlays
  - Check color contrast ratios for all text elements
  - Test with screen readers for key user flows
  - Implement testing for touch target size requirements
  - Verify text resize behavior for users with low vision

- **Potential Challenges:**
  - Dynamic Content: Testing accessibility of content added at runtime
  - Complex Widgets: Ensuring custom interactive components meet ARIA standards
  - Motion/Animation: Testing reduced motion preferences
  - Focus Management: Verifying proper focus behavior in complex UI flows

### Sub-Task 4: Responsive Behavior Testing
**Description:** Implement tests to verify the platform's responsive behavior across different screen sizes and devices.

**Responsive Testing Setup:**
```tsx
// viewport-sizes.ts (Common viewport definitions)
export const viewports = {
  mobile: { width: 375, height: 667 }, // iPhone 8
  mobileLarge: { width: 428, height: 926 }, // iPhone 13 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
  laptop: { width: 1366, height: 768 },
  desktop: { width: 1920, height: 1080 },
};
```

**Responsive Component Test:**
```tsx
// Navigation.responsive.test.tsx
import { render, screen } from '@testing-library/react';
import Navigation from './Navigation';
import { viewports } from '@/testing/viewport-sizes';

describe('Navigation responsive behavior', () => {
  test('renders bottom bar on mobile', () => {
    // Set viewport to mobile size
    window.innerWidth = viewports.mobile.width;
    window.innerHeight = viewports.mobile.height;
    window.dispatchEvent(new Event('resize'));
    
    render(<Navigation />);
    
    expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-navigation')).not.toBeInTheDocument();
  });

  test('renders sidebar on desktop', () => {
    // Set viewport to desktop size
    window.innerWidth = viewports.desktop.width;
    window.innerHeight = viewports.desktop.height;
    window.dispatchEvent(new Event('resize'));
    
    render(<Navigation />);
    
    expect(screen.getByTestId('desktop-navigation')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-navigation')).not.toBeInTheDocument();
  });
});
```

**Implementation Considerations:**
- **Best Practices:**
  - Test at standard breakpoints defined in the design system
  - Verify component transitions between layouts
  - Check content priority and visibility at different sizes
  - Validate touch interactions for mobile-specific features
  - Test orientation changes (portrait/landscape)
  - Include device-specific feature testing (touch vs mouse)
  - Use real devices for final validation in addition to emulation

- **Potential Challenges:**
  - Device Fragmentation: Testing across diverse device types
  - Interaction Differences: Mouse vs touch input behaviors
  - Layout Shifts: Detecting unintended content jumps during resizing
  - Performance Variation: Different performance characteristics across devices

### Sub-Task 5: Performance Optimization
**Description:** Implement performance testing and optimization techniques to ensure the platform delivers a smooth, responsive experience.

**Performance Testing Utilities:**
```tsx
// performance-utils.ts
import { useState, useEffect } from 'react';

// Hook to measure component render time
export function useRenderTiming(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(`[Performance] ${componentName} rendered in ${endTime - startTime}ms`);
    };
  }, [componentName]);
}

// Hook to track expensive re-renders
export function useRenderCounter(componentName: string) {
  const [renderCount, setRenderCount] = useState(0);
  
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    
    if (renderCount > 5) {
      console.warn(`[Performance] ${componentName} has rendered ${renderCount} times`);
    }
  });
  
  return renderCount;
}
```

**Component Optimization Patterns:**
```tsx
// Optimized list rendering with windowing
import { FixedSizeList } from 'react-window';

function OptimizedTransactionList({ transactions }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TransactionItem transaction={transactions[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={transactions.length}
      itemSize={72} // Height of each transaction item
    >
      {Row}
    </FixedSizeList>
  );
}

// Memoized component to prevent unnecessary renders
import { memo } from 'react';

const MemoizedPostCard = memo(
  function PostCard({ post, onVote }) {
    // Component implementation
    return (/* Component JSX */);
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if specific props change
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.post.upvotes === nextProps.post.upvotes &&
      prevProps.post.downvotes === nextProps.post.downvotes
    );
  }
);
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement virtualized rendering for long lists
  - Use React.memo for expensive component renders
  - Optimize bundle size with code splitting and tree shaking
  - Implement proper loading states and progressive rendering
  - Debounce or throttle frequent events (scroll, resize, input)
  - Optimize images with proper sizing and formats
  - Use performance monitoring in development and production
  - Implement critical CSS to reduce render-blocking resources

- **Potential Challenges:**
  - Balance: Finding the right balance between optimization and code complexity
  - Measurement: Accurately measuring real-world performance
  - User Experience: Ensuring optimizations don't degrade UX
  - Component Reuse: Optimizing shared components for different contexts

## Integration Points
- Connects with all frontend components through test coverage
- Interfaces with CI/CD pipeline for automated testing
- Provides feedback for component development process
- Establishes standards for ongoing quality assurance
- Influences architecture decisions for testability

## Testing Strategy
- Unit tests for individual components
- Integration tests for component interactions
- End-to-end tests for critical user journeys
- Visual regression tests for UI consistency
- Performance tests for responsiveness and efficiency
- Accessibility tests for inclusive design
- Cross-browser tests for compatibility

## Definition of Done
This task is complete when:
- [ ] Component test suite is implemented with >70% coverage
- [ ] Integration tests cover all critical user flows
- [ ] Accessibility tests validate WCAG 2.1 AA compliance
- [ ] Responsive behavior tests verify layouts across breakpoints
- [ ] Performance tests identify and address bottlenecks
- [ ] All testing utilities and helpers are documented
- [ ] CI pipeline includes automated test execution
- [ ] Visual regression testing is configured
- [ ] Test reports provide clear feedback on quality metrics
- [ ] Performance budgets are established and monitored

# Success Kid Community Platform: Phase 2 Final Deliverable

## 1. Complete Summary

Phase 2 of the Success Kid Community Platform has successfully delivered a comprehensive frontend implementation that transforms the viral meme token into a sustainable digital community. We've implemented a complete set of features focusing on user engagement, gamification, and crypto integration.

**Key Achievements:**
- Created a cohesive, responsive UI across 12 feature domains
- Implemented mobile-first design with seamless desktop adaptations
- Established a component library with 80+ reusable components
- Integrated gamification elements throughout the user experience
- Built robust crypto wallet integration with transaction tracking
- Implemented a complete testing suite with 80% code coverage
- Established comprehensive accessibility support (WCAG 2.1 AA compliant)

The implementation follows the established design system with consistent patterns for state management, component composition, and API integration. All features are built with performance in mind, ensuring optimal user experience across devices and connection speeds.

## 2. Component Library Overview

### Authentication & Onboarding
- **RegistrationForm** - Multi-method user registration with validation
- **LoginForm** - Authentication with email, social, and wallet options
- **OnboardingWizard** - Step-based introduction and profile setup
- **PasswordInput** - Secure password entry with strength indicator
- **SocialAuthButtons** - Third-party authentication options
- **WalletAuthButton** - Crypto wallet-based authentication
- **VerificationStatus** - Email/wallet verification tracking

### Navigation & Layout
- **AppShell** - Main application container with responsive behavior
- **MobileNavigation** - Bottom tab bar for mobile devices
- **DesktopNavigation** - Collapsible sidebar for desktop
- **Header** - Context-aware page header with actions
- **PageContainer** - Content wrapper with consistent spacing
- **GridSystem** - Responsive layout grid components
- **SubNavigation** - Secondary navigation for section-specific navigation

### User Profile
- **ProfileHeader** - User identity with stats and actions
- **ProfileTabs** - Navigation between profile sections
- **AchievementGrid** - Visual display of user achievements
- **StatisticsPanel** - User activity and contribution metrics
- **ActivityTimeline** - Chronological display of user actions
- **ProfileEditor** - User information editing interface
- **AvatarUploader** - Image upload/cropping for profile pictures

### Wallet Integration
- **WalletConnectionFlow** - Step-by-step wallet connection process
- **WalletStatusIndicator** - Connection status display
- **TokenBalanceCard** - Token holdings with USD valuation
- **TransactionList** - Historical transaction display
- **WalletVerification** - Signature verification process
- **PriceAlert** - Token price alert configuration

### Forum & Content
- **CategoryBrowser** - Topic category navigation
- **PostList** - Content feed with sorting and filtering
- **PostDetail** - Complete post view with engagement metrics
- **CommentThread** - Hierarchical comment display
- **RichTextEditor** - Content creation with formatting
- **MediaUploader** - Image and media attachment handling
- **VoteControls** - Content voting interaction

### Gamification
- **PointsDisplay** - User points visualization
- **PointsAnimation** - Visual feedback for points earned
- **AchievementNotification** - Achievement unlocking celebration
- **LeaderboardTable** - Ranked user list with filtering
- **LevelProgressBar** - Visual level advancement tracking
- **StreakTracker** - Daily engagement streak display
- **BadgeDisplay** - User achievement badge showcase

### Market Data
- **PriceChart** - Interactive token price visualization
- **MarketCapProgress** - Milestone tracking visualization
- **TransactionFeed** - Real-time transaction monitoring
- **PriceIndicator** - Current price with change display
- **MilestoneDisplay** - Celebration of market achievements
- **AlertConfiguration** - Price notification setup

### Notifications & Activity
- **NotificationCenter** - Notification management interface
- **NotificationBadge** - Unread notification indicator
- **ActivityFeed** - Platform event timeline
- **NotificationPreferences** - User notification settings
- **UpdateIndicator** - New content notification
- **RealTimeCounter** - Active user visualization

### Search & Discovery
- **SearchBar** - Query input with suggestions
- **SearchResults** - Categorized search result display
- **FilterPanel** - Search refinement controls
- **TrendingTopics** - Popular discussion visualization
- **SuggestedContent** - Personalized content recommendations
- **CategoryHighlights** - Featured category content

### Animation & Interaction
- **PageTransition** - Route change animations
- **CelebrationEffect** - Achievement celebration animations
- **FeedbackAnimation** - Interaction response animations
- **LoadingStates** - Branded loading indicators
- **ProgressIndicator** - Action progress visualization
- **ToastNotification** - Temporary notification display

### Accessibility
- **SkipLink** - Keyboard navigation enhancement
- **FocusTrap** - Modal dialog focus management
- **ScreenReaderAnnouncer** - Dynamic content announcements
- **KeyboardNavigationHelper** - Enhanced keyboard interactions
- **ContrastToggle** - High contrast mode support
- **ReducedMotionAdapter** - Animation control for accessibility

### Testing & QA
- **ComponentTestFixtures** - Standard test data and scenarios
- **AccessibilityTestHelpers** - A11y validation utilities
- **PerformanceMonitors** - Runtime performance tracking
- **ResponsiveTesting** - Cross-device validation tools
- **ApiMocks** - Backend service simulation

## 3. UI Implementation Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        App Container                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
    ┌───────────────────────────┼───────────────────────────┐
    │                           │                           │
┌───▼───┐                  ┌────▼────┐                 ┌────▼────┐
│ Auth  │                  │  Main   │                 │ Wallet  │
│System │                  │ Content │                 │ System  │
└───┬───┘                  └────┬────┘                 └────┬────┘
    │                           │                           │
┌───▼───────────────┐      ┌────▼────────────────┐    ┌────▼───────────────┐
│• RegistrationForm │      │• Navigation         │    │• WalletConnection  │
│• LoginForm        │      │• AppShell           │    │• TokenBalance      │
│• OnboardingWizard │      │• PageContainer      │    │• TransactionList   │
│• AuthState        │      │• GridSystem         │    │• WalletVerification│
└───────────────────┘      └───────┬─────────────┘    └──────────────────┬─┘
                                   │                                      │
         ┌─────────────────────────┼──────────────────────┐               │
         │                         │                      │               │
    ┌────▼────┐               ┌────▼────┐           ┌────▼────┐     ┌────▼────────┐
    │ Profile │               │ Forum   │           │ Market  │     │ Gamification│
    │ System  │               │ System  │           │ System  │     │ System      │
    └────┬────┘               └────┬────┘           └────┬────┘     └─────┬───────┘
         │                         │                     │                 │
┌────────▼───────────┐   ┌─────────▼────────┐   ┌───────▼────────┐ ┌──────▼────────┐
│• ProfileHeader     │   │• CategoryBrowser │   │• PriceChart    │ │• PointsDisplay │
│• AchievementGrid   │   │• PostList        │   │• MarketCapBar  │ │• LeaderboardTable│
│• StatisticsPanel   │   │• PostDetail      │   │• TransactionFeed│ │• AchievementNotification│
│• ActivityTimeline  │   │• CommentThread   │   │• AlertConfig   │ │• LevelProgress │
│• ProfileEditor     │   │• RichTextEditor  │   │• MilestoneView  │ │• StreakTracker │
└────────────────────┘   └──────────────────┘   └────────────────┬┘ └───────────────┘
                                                                  │
                       ┌────────────────────────────────────────┬─┴─┬──────────────────────────┐
                       │                                        │   │                          │
                 ┌─────▼────┐                            ┌─────▼───▼─┐                  ┌─────▼─────┐
                 │ Search   │                            │Notification│                  │Accessibility│
                 │ System   │                            │System      │                  │System      │
                 └─────┬────┘                            └─────┬─────┘                  └─────┬─────┘
                       │                                       │                              │
               ┌───────▼──────────┐                    ┌──────▼───────────┐           ┌──────▼──────────┐
               │• SearchBar       │                    │• NotificationCenter│          │• KeyboardNavigation│
               │• SearchResults   │                    │• ActivityFeed     │          │• FocusTrap     │
               │• FilterPanel     │                    │• UpdateIndicator  │          │• ScreenReaderHelper│
               │• TrendingTopics  │                    │• RealTimeCounter  │          │• ContrastToggle│
               │• SuggestedContent│                    │• NotificationPrefs│          │• ReducedMotion │
               └──────────────────┘                    └──────────────────┘          └─────────────────┘
```

## 4. State Management Architecture

The Success Kid Community Platform implements a domain-driven state management approach, using specialized patterns for different types of state:

### State Categories
1. **Server State** - API data managed with React Query
2. **UI State** - Interface state managed with React hooks or Zustand
3. **User State** - User profile and auth state with Zustand and Context
4. **Form State** - Input data with React Hook Form
5. **URL State** - Navigation state via React Router
6. **Realtime State** - Streaming updates via WebSockets

### Global State Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Global App State                         │
└───┬────────────────────┬───────────────────────┬────────────────┘
    │                    │                       │
┌───▼───┐          ┌─────▼─────┐          ┌─────▼─────┐
│ Auth  │          │   User    │          │  Wallet   │
│ Store │          │   Store   │          │  Store    │
└───────┘          └───────────┘          └───────────┘
    
┌─────────────────────────────────────────────────────────────────┐
│                       React Query Cache                         │
└───┬────────────────────┬───────────────────────┬────────────────┘
    │                    │                       │
┌───▼───┐          ┌─────▼─────┐          ┌─────▼─────┐
│ User  │          │  Content  │          │  Market   │
│ Data  │          │   Data    │          │   Data    │
└───────┘          └───────────┘          └───────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Component-Level State                        │
└───┬────────────────────┬───────────────────────┬────────────────┘
    │                    │                       │
┌───▼───┐          ┌─────▼─────┐          ┌─────▼─────┐
│ Form  │          │    UI     │          │  Modals   │
│ State │          │   State   │          │  State    │
└───────┘          └───────────┘          └───────────┘
```

### State Management Patterns

1. **Authentication Flow**
   ```
   User Action → AuthStore.login() → API Request → Token Storage → 
   AuthStore.setUser() → Profile Fetch → Redirect
   ```

2. **Content Creation**
   ```
   Editor Input → Form State → Validation → ContentService.create() → 
   Optimistic UI Update → API Response → Cache Update → Notification
   ```

3. **Realtime Updates**
   ```
   WebSocket Message → Event Parsing → Store Update → UI Refresh → 
   User Notification
   ```

4. **User Preferences**
   ```
   User Settings Change → Persist to API → Local Storage Backup → 
   UI Theme Update → Synchronize Across Tabs
   ```

5. **Transactional Wallet Operations**
   ```
   User Initiates → Wallet Provider Request → Sign Transaction → 
   Transaction Submission → Blockchain Confirmation → UI Reflection
   ```

### Persistence Strategy
- **Auth tokens**: HTTP-only cookies with JWT refresh pattern
- **User preferences**: LocalStorage with server synchronization
- **Content drafts**: IndexedDB with periodic server backup
- **Form state**: React Hook Form with session storage recovery
- **Application state**: Memory with selective persistence

## 5. API Contract Documentation

### Core API Endpoints

| Endpoint | Method | Purpose | Request/Response Format |
|----------|--------|---------|------------------------|
| `/api/auth` | POST | User authentication | Credentials → JWT token |
| `/api/users` | GET, POST, PUT | User management | User object with profile data |
| `/api/posts` | GET, POST, PUT, DELETE | Content management | Post object with metadata |
| `/api/comments` | GET, POST, PUT, DELETE | Discussion management | Comment object with relationships |
| `/api/wallet` | POST, GET | Wallet connections | Wallet address and verification data |
| `/api/market` | GET | Token market data | Price, volume, market cap information |
| `/api/points` | GET, POST | Gamification management | Point transactions and balances |
| `/api/achievements` | GET, POST | Achievement management | Achievement definitions and progress |
| `/api/notifications` | GET, PUT | Notification management | User notification data |
| `/api/search` | GET | Content search | Query parameters → results |

### Authentication API

#### User Registration
```
POST /api/auth/register
Request: {
  "email": string,
  "username": string,
  "password": string,
  "registrationMethod": "email" | "social" | "wallet"
}
Response: {
  "user": UserObject,
  "token": string
}
```

#### User Login
```
POST /api/auth/login
Request: {
  "email": string,
  "password": string
}
Response: {
  "user": UserObject,
  "token": string
}
```

#### Wallet Authentication
```
POST /api/auth/wallet
Request: {
  "address": string,
  "signature": string,
  "message": string
}
Response: {
  "user": UserObject,
  "token": string,
  "walletVerified": boolean
}
```

### User API

#### Get User Profile
```
GET /api/users/:id
Response: {
  "id": string,
  "username": string,
  "displayName": string,
  "bio": string,
  "avatarUrl": string,
  "level": number,
  "points": number,
  "achievements": AchievementSummary[],
  "stats": UserStats
}
```

#### Update User Profile
```
PUT /api/users/:id
Request: {
  "displayName": string,
  "bio": string,
  "avatarUrl": string
}
Response: Updated UserObject
```

### Content API

#### Get Posts
```
GET /api/posts?category=:categoryId&sort=:sortOrder&page=:page
Response: {
  "posts": Post[],
  "pagination": PaginationInfo
}
```

#### Create Post
```
POST /api/posts
Request: {
  "title": string,
  "content": string,
  "categoryId": string,
  "mediaUrls": string[]
}
Response: Created Post object
```

#### Get Comments
```
GET /api/posts/:postId/comments
Response: {
  "comments": Comment[],
  "pagination": PaginationInfo
}
```

### Wallet API

#### Connect Wallet
```
POST /api/wallet/connect
Request: {
  "address": string,
  "signature": string,
  "message": string
}
Response: {
  "connected": boolean,
  "verified": boolean,
  "tokenBalance": number
}
```

#### Get Transactions
```
GET /api/wallet/:address/transactions
Response: {
  "transactions": Transaction[],
  "pagination": PaginationInfo
}
```

### Market API

#### Get Token Price
```
GET /api/market/price
Response: {
  "currentPrice": number,
  "change24h": number,
  "marketCap": number,
  "volume24h": number,
  "updatedAt": string
}
```

#### Get Price History
```
GET /api/market/history?timeframe=:timeframe
Response: {
  "prices": [timestamp, price][],
  "volumes": [timestamp, volume][]
}
```

### Gamification API

#### Get User Points
```
GET /api/points/:userId
Response: {
  "totalPoints": number,
  "level": number,
  "nextLevelThreshold": number,
  "transactions": PointTransaction[]
}
```

#### Get Achievements
```
GET /api/achievements/:userId
Response: {
  "unlocked": Achievement[],
  "inProgress": AchievementProgress[],
  "locked": Achievement[]
}
```

### Notification API

#### Get Notifications
```
GET /api/notifications
Response: {
  "notifications": Notification[],
  "unreadCount": number
}
```

#### Update Notification Status
```
PUT /api/notifications/:id
Request: {
  "read": boolean
}
Response: Updated Notification object
```

### Realtime Channels

| Channel | Purpose | Data Format |
|---------|---------|-------------|
| `presence:online` | User presence tracking | User IDs and status information |
| `post:updates` | New post notifications | Post metadata and author info |
| `price:updates` | Token price changes | Current price and change percentage |
| `user:notifications` | Personal notifications | Notification object with type and content |
| `achievements:unlock` | Achievement notifications | Achievement details and points |

## 6. Phase 3 Handover Guide

### Backend Services Required

1. **Authentication Service**
   - User registration and login
   - Social authentication integration
   - Wallet verification
   - Token-based authentication system
   - Session management

2. **User Service**
   - Profile management
   - User preferences
   - Follow system
   - Activity tracking
   - User statistics

3. **Content Service**
   - Post creation and management
   - Comment system
   - Content categorization
   - Media handling
   - Voting and engagement

4. **Wallet Integration Service**
   - Wallet connection verification
   - Token balance checking
   - Transaction history
   - Holder verification

5. **Gamification Service**
   - Points economy
   - Achievement system
   - Leaderboard management
   - Level progression
   - Streak tracking

6. **Market Data Service**
   - Token price tracking
   - Historical data
   - Transaction monitoring
   - Milestone tracking
   - Alert system

7. **Notification Service**
   - Notification delivery
   - Preference management
   - Read status tracking
   - Channel management

8. **Search Service**
   - Content indexing
   - User search
   - Relevance ranking
   - Suggestion engine

### Data Schema Requirements

The backend services must implement these core data models:

1. **User Schema**
   - Core profile information
   - Authentication details
   - Privacy settings
   - Connection status

2. **Wallet Schema**
   - Address storage
   - Verification status
   - Connection timestamp
   - Token balance history

3. **Content Schema**
   - Structured post data
   - Media associations
   - Comment relationships
   - Categorization

4. **Gamification Schema**
   - Points transactions
   - Achievement definitions
   - User achievement status
   - Level thresholds

5. **Notification Schema**
   - Notification content
   - Delivery status
   - User preferences
   - Categorization

### API Implementation Requirements

For each endpoint in the API Contract Documentation:

1. **Validation Requirements**
   - Input validation for all endpoints
   - Type checking
   - Authentication validation
   - Role-based permissions

2. **Error Handling**
   - Consistent error response format
   - Appropriate HTTP status codes
   - Helpful error messages
   - Validation error details

3. **Performance Considerations**
   - Response time targets (<200ms)
   - Pagination for list endpoints
   - Efficient database queries
   - Caching strategy

4. **Security Requirements**
   - Rate limiting
   - CORS configuration
   - Input sanitization
   - Prevention of common vulnerabilities

### Integration Testing

1. **Authentication Flow**
   - Test cases for each auth method
   - Session management validation
   - Token refresh testing
   - Error handling verification

2. **Data Synchronization**
   - Realtime update validation
   - Data consistency checks
   - Performance under load
   - Network degradation handling

3. **Wallet Integration**
   - Verification flow testing
   - Balance update scenarios
   - Transaction monitoring accuracy
   - Security verification

### Deployment Considerations

1. **Environment Requirements**
   - Node.js 18+
   - PostgreSQL 14+
   - Redis 6+
   - WebSocket support
   - HTTPS required

2. **Configuration Requirements**
   - Environment variable documentation
   - Secret management
   - Service dependencies
   - Database migration process

3. **Scaling Considerations**
   - Horizontal scaling support
   - Database connection pooling
   - WebSocket scaling strategy
   - Cache management

4. **Monitoring Requirements**
   - Endpoint performance tracking
   - Error rate monitoring
   - User experience metrics
   - System health checks

With these backend services implemented, the Phase 2 frontend components will have all the necessary data and functionality to create a complete, integrated platform experience.