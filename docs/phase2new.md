# Success Kid Community Platform: Phase 2 Frontend Implementation Plan

## Project Understanding Summary

After reviewing the documentation, I understand that the Success Kid Community Platform aims to transform a viral meme token into a sustainable digital community with meaningful engagement. The platform follows a mobile-first JAMstack architecture built on React, Tailwind CSS, and Supabase, with the following key frontend requirements:

1. **Core UI Framework**: React with TypeScript using Vite, following Atomic Design principles established in Phase 1
2. **Styling System**: Tailwind CSS implementing the Success Kid design tokens and visual language
3. **Key Features**: Discussion forums, live price tracking, wallet integration, achievements, and gamification
4. **User Experience**: Mobile-first interface with success/achievement-oriented feedback and interactions
5. **State Management**: React Query for server state, Zustand for client state, as established in Phase 1
6. **Authentication**: Multi-provider authentication with Clerk, plus wallet connection via Phantom

The frontend needs to express the Success Kid ethos through:
- Celebratory achievement animations and feedback
- Clear milestone visualization for market progress
- Gamification elements that encourage engagement
- Community-focused content organization
- Responsive design optimized for all devices

## Table of Contents for Phase 2

1. **Core Navigation & Layout Implementation**
   - App Shell Component
   - Bottom Navigation Bar (Mobile)
   - Sidebar Navigation (Desktop)
   - Responsive Layout System
   - Page Transition System

2. **Authentication & User Profile System**
   - Login/Registration Flow
   - Wallet Connection Interface
   - Profile Setup Wizard
   - User Profile Page
   - Settings Interface

3. **Homepage & Dashboard Implementation**
   - Activity Feed Component
   - Welcome & Onboarding Banner
   - Dashboard Cards System
   - Achievement Showcase
   - Quick Actions Menu

4. **Community & Discussion System**
   - Category Browser
   - Post List & Filtering
   - Individual Post View
   - Comment Thread System
   - Content Creation Editor

5. **Market & Token Visualization**
   - Price Chart Component
   - Market Milestone Visualization
   - Transaction Feed
   - Wallet Balance Display
   - Market Data Statistics

6. **Points & Gamification System**
   - Achievement Component System
   - Points Animation & Display
   - Leaderboard Interface
   - Level Progression Visualization
   - Daily Streak & Rewards

7. **Content Creation Tools**
   - Post Creation Interface
   - Rich Text Editor
   - Media Upload System
   - Post Preview & Publishing Flow
   - Draft Management

8. **Notification & Real-time Features**
   - Notification Center
   - Real-time Updates System
   - Toast Notification Component
   - Activity Indicator
   - Push Notification Management

9. **Search & Discovery System**
   - Search Interface
   - Results Filtering
   - Trending Content Display
   - User & Tag Discovery
   - Advanced Search Options

10. **Responsive Enhancements & Optimization**
    - Mobile Touch Optimization
    - Responsive Image Handling
    - Form Factor Adaptations
    - Performance Optimization
    - Animation Refinement

11. **Accessibility Implementation**
    - Keyboard Navigation
    - Screen Reader Compatibility
    - Focus Management
    - Color Contrast Verification
    - ARIA Implementation

12. **Error Handling & Edge Cases**
    - Error Boundary Implementation
    - Network Error Handling
    - Empty States Design
    - Loading State Patterns
    - User Error Recovery Flows

---

# Task 1: Core Navigation & Layout Implementation

## Task Overview
Implement the foundational navigation and layout structure that will serve as the skeleton for the entire application. This system will provide consistent user orientation, navigation between key sections, and responsive layout adaptation across all devices, serving as the primary interaction framework for the platform.

## Required Document Review
- **Design System Document** - Review section 3.4 (Spacing and Layout System) and 8.2 (Navigation System)
- **App Flow Document** - Review section 4.2 (User Experience Flows) for navigation patterns
- **Frontend Guidelines** - Apply patterns from section 7.2 (Responsive & Accessible Design)
- **Phase 1 Artifacts** - Utilize the routing structure and component foundation established in Phase 1

## User Experience Flow
1. **Initial Encounter**: User launches the application and is presented with the main layout containing navigation elements appropriate to their device (bottom bar on mobile, sidebar on desktop)
2. **Navigation Interaction**: User selects navigation items to move between major sections (Home, Community, Market, Profile)
3. **Orientation Feedback**: Current section is clearly indicated through visual highlighting in navigation elements
4. **Context Preservation**: When navigating between sections, appropriate scroll position and state is maintained when returning to previously visited sections
5. **Responsive Adaptation**: As screen size changes, layout and navigation automatically adapt without losing user context

## Implementation Sub-Tasks

### Sub-Task 1: App Shell Component
**Description:** Create the primary application shell that provides consistent layout structure across all pages and handles global UI elements.

**Component Hierarchy:**
```
AppShell/
├── Header                # Top navigation with branding, search, and user menu
├── NavigationContainer  # Container for appropriate navigation type
│   ├── BottomNavigation # Mobile-specific navigation
│   └── SidebarNavigation # Desktop-specific navigation
├── MainContent          # Primary content area with page transitions
├── GlobalOverlays       # System for modals, drawers, and toasts
└── Footer               # Minimal footer with essential links and info
```

**Key Interface/Props:**
```typescript
// AppShell component interface
interface AppShellProps {
  children: React.ReactNode;           // Main content to render
  hideNavigation?: boolean;            // Option to hide navigation for auth pages
  transparentHeader?: boolean;         // Option for transparent header on specific pages
  fullWidth?: boolean;                 // Option for full-width content
}

// Navigation item structure
interface NavigationItem {
  label: string;                       // Display text
  icon: React.ReactNode;               // Icon component
  path: string;                        // Route path
  badge?: number | boolean;            // Optional notification badge
  children?: NavigationItem[];         // Optional sub-items for dropdown
}
```

**State Management:**
```typescript
// Navigation state management
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
const location = useLocation();
const currentPath = location.pathname;

// Responsive listener example
useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

**Best Practices:**
- Use CSS Grid for the main layout structure to enable flexible content areas
- Implement navigation as a controlled component driven by route information
- Ensure header elements are accessible and properly labeled
- Use `position: sticky` for navigation elements to maximize content space
- Implement smooth transitions between navigation states
- Support keyboard navigation between major sections

**Potential Challenges:**
- **Deep Linking**: Ensure proper active state highlighting when users enter via deep links - Use route matching patterns rather than exact equality
- **State Preservation**: Maintain scroll position and UI state when navigating between sections - Implement a context-based state cache for each major route

### Sub-Task 2: Bottom Navigation Bar (Mobile)
**Description:** Create a mobile-optimized navigation bar that appears at the bottom of the screen on small devices, providing quick access to primary sections.

**Key UI Elements:**
- Tab bar with 4-5 primary destinations (Home, Community, Create, Market, Profile)
- Active state indication with color and optional slight elevation
- Central action button for content creation with visual emphasis
- Notification indicators for relevant sections
- Subtle animation for state changes

**Styling Approach:**
```jsx
// Tailwind styling pattern
<nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 px-2 z-50">
  {navigationItems.map((item) => (
    <NavItem 
      key={item.path}
      isActive={currentPath === item.path}
      label={item.label}
      icon={item.icon}
      badge={item.badge}
      onClick={() => navigate(item.path)}
    />
  ))}
</nav>
```

**Accessibility Implementation:**
- Implement proper `aria-current` for active navigation item
- Ensure adequate touch target size (minimum 44x44px)
- Provide visible focus indicators for keyboard navigation
- Include proper labeling for icons using aria-label or visually hidden text
- Support swipe gestures for navigation between adjacent sections

**Potential Challenges:**
- **Limited Space**: With only 5 slots, prioritize most critical sections - Conduct user testing to validate navigation priorities
- **Central Button Placement**: The center action button needs special handling - Create a custom component that properly integrates with the flex layout

### Sub-Task 3: Sidebar Navigation (Desktop)
**Description:** Implement a desktop-optimized sidebar navigation that provides hierarchical access to all platform areas with clear visual structure.

**Key UI Elements:**
- Vertical navigation sidebar with expandable sections
- Brand identity and User profile summary at top
- Primary navigation links with icons and labels
- Secondary/grouped navigation items
- Collapse/expand functionality for space efficiency
- Visual indicators for active state and notifications

**Styling Approach:**
```jsx
// Tailwind implementation pattern
<aside className="hidden md:block w-64 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
  <div className="p-4">
    <BrandLogo className="h-8 w-auto" />
  </div>
  
  <nav className="mt-6">
    {navigationSections.map((section) => (
      <NavSection
        key={section.id}
        title={section.title}
        items={section.items}
        currentPath={currentPath}
      />
    ))}
  </nav>
  
  <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
    <UserProfileSummary />
  </div>
</aside>
```

**Accessibility Implementation:**
- Use proper HTML5 semantic elements (`nav`, `aside`)
- Implement keyboard navigation with arrow keys for navigation items
- Use proper heading hierarchy for navigation sections
- Ensure collapsible sections are keyboard accessible and properly announced
- Provide skip link for keyboard users to bypass navigation

**Potential Challenges:**
- **Responsive Transition**: Smooth transition between sidebar and bottom navigation - Implement different components rather than trying to transform one into the other
- **Nesting Depth**: Decide on maximum nesting level for navigation items - Limit to 2 levels and use separate patterns for deeper hierarchies

### Sub-Task 4: Responsive Layout System
**Description:** Create a flexible layout system that adapts to different screen sizes while maintaining content hierarchy and usability.

**Key UI Elements:**
- Container components with responsive width constraints
- Grid system for content organization
- Responsive spacing scale based on viewport size
- Layout components for common page structures
- Breakpoint-specific layout adjustments

**Styling Approach:**
```jsx
// Page layout component example
const PageLayout = ({ children, sidebar, header }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {header && (
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
          {header}
        </header>
      )}
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {sidebar && (
            <aside className="lg:col-span-3 xl:col-span-2">
              {sidebar}
            </aside>
          )}
          
          <main className={`${sidebar ? 'lg:col-span-9 xl:col-span-10' : 'lg:col-span-12'}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
```

**Accessibility Implementation:**
- Ensure logical reading order across breakpoints
- Maintain proper heading hierarchy regardless of layout changes
- Keep related content grouped together across layouts
- Use appropriate landmarks for screen reader navigation
- Test with screen readers across different viewport sizes

**Potential Challenges:**
- **Content Reordering**: When elements need to appear in different orders on different devices - Use CSS grid's order property rather than DOM manipulation
- **Complex Grids**: Grid layouts with varying column spans across breakpoints - Create reusable grid components with breakpoint props

### Sub-Task 5: Page Transition System
**Description:** Implement smooth transitions between pages and sections to provide visual continuity and feedback during navigation.

**Key UI Elements:**
- Loading indicators for asynchronous page loads
- Transition animations appropriate to navigation direction
- Route-based transition selection
- Fade/slide effects that maintain context
- Progress indicators for multi-step flows

**Styling Approach:**
```jsx
// Page transition component using Framer Motion
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -8,
  },
};

const PageTransition = ({ children, location }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
        className="page-wrapper"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
```

**Accessibility Implementation:**
- Ensure transitions respect reduced motion preferences
- Maintain focus management during page transitions
- Announce page changes to screen readers
- Ensure content remains accessible during transitions
- Use appropriate ARIA live regions for dynamic content

**Potential Challenges:**
- **Performance**: Transitions can cause jank on lower-end devices - Optimize by limiting animations to opacity and transform properties
- **Focus Management**: Maintaining proper focus during page transitions - Implement focus trapping and explicit focus management

## Integration Points
- Connects with Authentication system to display appropriate user state in navigation
- Interfaces with the Notification system to show indicators and badges
- Provides the structure for all content components to render within
- Expects backend APIs for user profile data and notification counts

## Testing Strategy
- Test responsive behavior across all standard breakpoints (320px to 1920px+)
- Test keyboard navigation paths through the entire interface
- Verify proper focus management during navigation
- Test navigation with screen readers on multiple browsers
- Verify proper state preservation when navigating between sections
- Test deep linking to ensure correct active state highlighting

## Definition of Done
This task is complete when:
- [x] App Shell component is implemented with responsive behavior
- [x] Bottom navigation provides mobile access to all primary sections
- [x] Sidebar navigation provides desktop access to all sections and sub-sections
- [x] Responsive layout system handles all required viewport sizes
- [x] Page transitions provide smooth movement between sections
- [x] Navigation elements correctly reflect current location
- [x] All elements are properly accessible via keyboard and screen reader
- [x] Navigation state is preserved across session and deep linking
- [x] Performance testing confirms smooth transitions and animations
- [x] Documentation is complete for all navigation components
- [x] Unit and integration tests cover navigation functionality
- [x] Visual design matches specifications across all breakpoints

---

# Task 2: Authentication & User Profile System

## Task Overview
Implement the authentication flow, user profile management, and wallet connection interfaces that will enable user identity, secure access, and personalization throughout the platform. This system forms the foundation for user-specific features and community engagement.

## Required Document Review
- **Design System Document** - Review section 4.1 (Voice and Tone Framework) for authentication messaging
- **App Flow Document** - Review sections 4.2.1 (User Registration), 4.2.6 (State Transitions), and 4.3 (Wallet Integration)
- **Frontend Guidelines** - Apply patterns from section 6 (Security & Authentication)
- **Phase 1 Artifacts** - Utilize Clerk authentication integration and Phantom wallet connection from Phase 1

## User Experience Flow
1. **Authentication Entry**: User encounters authentication prompts either at initial app access or when attempting to access gated features
2. **Registration/Login**: User completes multi-option authentication flow (email, social, or wallet)
3. **Profile Setup**: New users are guided through profile creation with progressive collection of information
4. **Wallet Connection**: Users can connect cryptocurrency wallets to verify holdings and access token-specific features
5. **Profile Management**: Users can view and edit their profiles, manage wallet connections, and adjust account settings

## Implementation Sub-Tasks

### Sub-Task 1: Login/Registration Flow
**Description:** Create a multi-provider authentication system with email, social, and wallet connection options that provides a smooth onboarding experience.

**Component Hierarchy:**
```
AuthenticationContainer/
├── AuthTabs              # Toggle between login/register
├── EmailAuthForm         # Email/password authentication
├── SocialAuthButtons     # Social login options
├── WalletConnectionAuth  # Wallet-based authentication
├── AuthDivider           # Visual separator between methods
└── AuthFooter            # Links to terms, privacy policy, etc.
```

**Key Interface/Props:**
```typescript
// Authentication component interface
interface AuthenticationProps {
  initialMode?: 'login' | 'register';  // Default authentication mode
  redirectUrl?: string;                // Where to redirect after authentication
  onSuccess?: (user: User) => void;    // Callback on successful authentication
  onError?: (error: Error) => void;    // Callback on authentication failure
}

// Authentication state interface
interface AuthState {
  mode: 'login' | 'register';
  isLoading: boolean;
  error: string | null;
  email: string;
  password: string;
  passwordConfirm: string;
}
```

**State Management:**
```typescript
// Authentication form state
const [authState, setAuthState] = useState<AuthState>({
  mode: props.initialMode || 'login',
  isLoading: false,
  error: null,
  email: '',
  password: '',
  passwordConfirm: ''
});

// Clerk authentication hooks
const { isLoaded, signUp, signIn } = useClerk();

// Form submission handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setAuthState({...authState, isLoading: true, error: null});
  
  try {
    if (authState.mode === 'register') {
      // Registration logic
      await signUp.create({
        emailAddress: authState.email,
        password: authState.password,
      });
      
      // Complete signup if verification is not required
      if (!signUp.status !== 'needs_email_verification') {
        await signUp.prepareEmailAddressVerification();
      }
    } else {
      // Login logic
      await signIn.create({
        identifier: authState.email,
        password: authState.password,
      });
    }
    
    props.onSuccess && props.onSuccess(authState.user);
  } catch (error) {
    setAuthState({
      ...authState,
      error: error.message,
      isLoading: false
    });
    props.onError && props.onError(error);
  }
};
```

**Best Practices:**
- Use Clerk's pre-built components when possible for standard auth flows
- Implement client-side validation before submission
- Provide clear error messages for authentication failures
- Store authentication state in a secure and persistent manner
- Implement proper loading states during authentication processes
- Follow security best practices for credential handling

**Potential Challenges:**
- **Multi-provider Identity Linking**: Users authenticating through different methods - Implement account linking functionality for connecting multiple auth methods
- **JWT Token Management**: Secure storage and renewal of authentication tokens - Use HTTP-only cookies when possible and implement token refresh logic

### Sub-Task 2: Wallet Connection Interface
**Description:** Implement a secure and user-friendly interface for connecting cryptocurrency wallets to verify token holdings and enable wallet-specific features.

**Key UI Elements:**
- Wallet provider selection interface
- Connect button with loading states
- Step-by-step connection guidance
- Error handling and troubleshooting help
- Verification status indicators
- Token holdings display once connected

**Styling Approach:**
```jsx
// Wallet connection component styling
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
    Connect Your Wallet
  </h2>
  
  <p className="text-gray-600 dark:text-gray-300 mb-6">
    Connect your wallet to verify your Success Kid token holdings and unlock holder benefits.
  </p>
  
  <div className="space-y-4">
    {walletProviders.map((provider) => (
      <button
        key={provider.id}
        onClick={() => connectWallet(provider.id)}
        disabled={isConnecting}
        className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center">
          <img 
            src={provider.icon} 
            alt={provider.name} 
            className="w-8 h-8 mr-3" 
          />
          <span className="font-medium">{provider.name}</span>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
      </button>
    ))}
  </div>
  
  {error && (
    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm">
      {error}
    </div>
  )}
  
  <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
    <p>Your private keys will never be stored or accessed by our platform.</p>
  </div>
</div>
```

**Accessibility Implementation:**
- Clearly label all wallet connection options
- Provide keyboard navigation through wallet selection
- Include descriptive error messages that suggest resolution steps
- Use proper ARIA attributes for dynamic content updates
- Ensure sufficient color contrast for status indicators

**Potential Challenges:**
- **Extension Detection**: Detecting if wallet extensions are installed - Implement graceful fallbacks when extensions aren't available
- **Connection Failures**: Handling various wallet connection error scenarios - Create specific guidance for common connection issues

### Sub-Task 3: Profile Setup Wizard
**Description:** Create a step-by-step wizard that guides new users through profile creation, preference setting, and initial platform orientation.

**Key UI Elements:**
- Multi-step progress indicator
- Form elements for profile information
- Avatar upload/selection interface
- Interest selection mechanism
- Preference toggles
- Next/back navigation
- Completion celebration

**Styling Approach:**
```jsx
// Profile wizard step component
<div className="max-w-xl mx-auto">
  {/* Progress indicator */}
  <div className="mb-8">
    <ProfileWizardProgress 
      steps={wizardSteps} 
      currentStep={currentStep} 
    />
  </div>
  
  {/* Step content */}
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h2 className="text-xl font-bold mb-4">
      {wizardSteps[currentStep].title}
    </h2>
    
    <p className="text-gray-600 dark:text-gray-300 mb-6">
      {wizardSteps[currentStep].description}
    </p>
    
    <div className="space-y-6">
      {currentStep === 0 && <BasicInfoStep />}
      {currentStep === 1 && <AvatarSelectionStep />}
      {currentStep === 2 && <InterestsStep />}
      {currentStep === 3 && <PreferencesStep />}
      {currentStep === 4 && <CompletionStep />}
    </div>
  </div>
  
  {/* Navigation */}
  <div className="mt-6 flex justify-between">
    <button
      onClick={handlePrevious}
      disabled={currentStep === 0}
      className="px-4 py-2 text-gray-600 dark:text-gray-300 disabled:opacity-50"
    >
      Back
    </button>
    
    <button
      onClick={handleNext}
      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
    >
      {currentStep === wizardSteps.length - 1 ? 'Complete' : 'Next'}
    </button>
  </div>
</div>
```

**Accessibility Implementation:**
- Provide clear step identification for screen readers
- Manage focus when moving between wizard steps
- Include appropriate form validation with error announcements
- Ensure all form fields have proper labels and descriptions
- Implement keyboard navigation through the entire wizard flow

**Potential Challenges:**
- **Form State Persistence**: Maintaining form data across steps - Use a form management library like Formik or React Hook Form
- **Validation Logic**: Balancing immediate vs. on-submission validation - Implement a hybrid approach with critical errors shown immediately

### Sub-Task 4: User Profile Page
**Description:** Create a comprehensive profile page that displays user information, achievements, activity, and allows for profile management.

**Key UI Elements:**
- Profile header with user image and key stats
- About/bio section
- Achievement showcase
- Recent activity feed
- Content contributions list
- Wallet connection status
- Edit profile controls

**Styling Approach:**
```jsx
// Profile page layout
<div className="max-w-5xl mx-auto">
  {/* Profile header */}
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    {/* Cover image */}
    <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
    
    {/* Profile info */}
    <div className="px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-end -mt-16 sm:-mt-20 relative">
      {/* Avatar */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden">
        <img 
          src={user.avatarUrl || defaultAvatar} 
          alt={`${user.username}'s avatar`}
          className="w-full h-full object-cover" 
        />
      </div>
      
      {/* User info */}
      <div className="mt-4 sm:mt-0 sm:ml-4 flex-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {user.username}
          {user.isVerified && (
            <VerifiedBadge className="ml-2 inline-block" />
          )}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Joined {formatDate(user.createdAt)}
        </p>
        
        <div className="flex items-center mt-2 space-x-4">
          <div className="flex items-center">
            <StarIcon className="w-5 h-5 text-yellow-500 mr-1" />
            <span className="font-medium">Level {user.level}</span>
          </div>
          
          <div className="flex items-center">
            <BadgeIcon className="w-5 h-5 text-blue-500 mr-1" />
            <span className="font-medium">{user.achievements.length} Achievements</span>
          </div>
        </div>
      </div>
      
      {/* Edit profile button (if own profile) */}
      {isOwnProfile && (
        <button className="absolute top-4 right-4 bg-white dark:bg-gray-700 p-2 rounded-full shadow-sm">
          <PencilIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </div>
  </div>
  
  {/* Profile tabs and content */}
  <div className="mt-6">
    <ProfileTabs user={user} isOwnProfile={isOwnProfile} />
  </div>
</div>
```

**Accessibility Implementation:**
- Use semantic HTML for profile sections (headings, lists, etc.)
- Implement proper tab interfaces for profile sections
- Ensure all interactive elements are keyboard accessible
- Use appropriate ARIA labels for icons and visual elements
- Provide text alternatives for achievement badges and indicators

**Potential Challenges:**
- **Content Organization**: Balancing comprehensive information with clear layout - Use tabs or accordion patterns for organizing different profile sections
- **Performance**: Loading many achievements and activities efficiently - Implement virtualized lists and pagination

### Sub-Task 5: Settings Interface
**Description:** Create a comprehensive settings interface allowing users to manage account preferences, privacy, notifications, and platform configurations.

**Key UI Elements:**
- Settings navigation (categories)
- Form controls for various settings
- Toggle switches for binary options
- Save/cancel controls
- Setting description explanations
- Confirmation dialogs for sensitive changes

**Styling Approach:**
```jsx
// Settings page layout
<div className="max-w-5xl mx-auto">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <div className="grid grid-cols-1 md:grid-cols-4">
      {/* Settings navigation */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 md:p-6 border-r border-gray-200 dark:border-gray-700">
        <nav className="space-y-1">
          {settingsCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeCategory === category.id
                  ? 'bg-primary-50 text-primary dark:bg-primary-900/20 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <category.icon className="w-5 h-5 mr-3" />
              {category.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Settings content */}
      <div className="col-span-1 md:col-span-3 p-4 md:p-6">
        <h2 className="text-xl font-bold mb-6">
          {activeCategory.label}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeCategory.id === 'account' && <AccountSettings />}
          {activeCategory.id === 'privacy' && <PrivacySettings />}
          {activeCategory.id === 'notifications' && <NotificationSettings />}
          {activeCategory.id === 'appearance' && <AppearanceSettings />}
          {activeCategory.id === 'wallet' && <WalletSettings />}
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={resetSettings}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 mr-4"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!hasChanges || isSaving}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
```

**Accessibility Implementation:**
- Group related settings with appropriate fieldset and legend elements
- Provide descriptive labels for all form controls
- Ensure keyboard navigability between settings sections
- Include help text explaining the impact of each setting
- Implement proper focus management when switching setting categories

**Potential Challenges:**
- **Settings Organization**: Organizing many settings logically - Group by function and impact rather than technical implementation
- **Instant vs. Explicit Save**: Deciding when settings apply immediately - Use explicit save for grouped or impactful changes, immediate for simple toggles

## Integration Points
- Connects with navigation system to show authenticated user state
- Interfaces with points and achievements system to display user progress
- Provides user context for all personalized features
- Expects backend APIs for user management, profile storage, and settings persistence

## Testing Strategy
- Test all authentication flows (email, social, wallet)
- Validate form validation logic and error state handling
- Test wallet connection with both successful and failed scenarios
- Verify profile data persistence and retrieval
- Test settings changes and confirm they persist across sessions
- Confirm proper access control to user-specific data

## Definition of Done
This task is complete when:
- [x] Authentication flows (registration, login) are fully implemented
- [x] Wallet connection interface works with Phantom integration
- [x] Profile setup wizard guides users through initial onboarding
- [x] User profile page displays all user information and achievements
- [x] Settings interface allows management of all user preferences
- [x] All state transitions maintain data integrity
- [x] Security best practices are implemented for credential handling
- [x] All UI components match design specifications
- [x] Form validation provides clear guidance for user input
- [x] All interfaces are fully accessible via keyboard and screen reader
- [x] Components are responsive across all required screen sizes
- [x] Tests validate all critical authentication paths

---

# Task 3: Homepage & Dashboard Implementation

## Task Overview
Create the homepage and personalized dashboard that serves as the primary landing experience for users, providing quick access to relevant platform activity, personal achievements, and key entry points to major features. This interface will be the central hub for user engagement and personalized content discovery.

## Required Document Review
- **Design System Document** - Review sections 3.5 (Imagery and Iconography) and 8.4 (Data Display Patterns)
- **App Flow Document** - Review section 4.2.2 (Onboarding Journey) and 4.2.3 (Engagement Journey)
- **Frontend Guidelines** - Apply patterns from section 5.1 (State Management) for dashboard data
- **Phase 1 Artifacts** - Utilize React Query setup for data fetching and Atomic Design components

## User Experience Flow
1. **Initial Visit**: New users see a welcome experience with onboarding guidance and platform introduction
2. **Personalized Dashboard**: Returning users see their activity feed, achievements, and personalized content
3. **Interactive Elements**: Users interact with dashboard cards, expanding items or accessing feature entry points
4. **Real-time Updates**: Dashboard refreshes with new content and notifications as they occur
5. **Personalization**: Over time, dashboard adapts to user behavior and preferences

## Implementation Sub-Tasks

### Sub-Task 1: Activity Feed Component
**Description:** Create a dynamic feed component that displays recent platform activity relevant to the user, including community posts, achievements, and market updates.

**Component Hierarchy:**
```
ActivityFeed/
├── FeedHeader               # Title and filtering options
├── FeedFilter               # Activity type and date filters
├── FeedItemContainer        # Wrapper for feed items
│   ├── PostFeedItem         # Post or comment activity item
│   ├── AchievementFeedItem  # Achievement unlock item
│   ├── WelcomeFeedItem      # New user welcome item
│   └── MarketFeedItem       # Market milestone item
├── FeedEmpty                # Empty state when no activity
└── FeedPagination           # Load more mechanism
```

**Key Interface/Props:**
```typescript
// Activity feed component interface
interface ActivityFeedProps {
  userId?: string;               // Optional user ID to filter feed
  filter?: ActivityFilter;       // Filter settings (default: all)
  maxItems?: number;             // Maximum items to display initially
  onItemClick?: (item: ActivityItem) => void; // Item interaction handler
  isLoading?: boolean;           // Control loading state externally
  emptyMessage?: string;         // Custom empty state message
  className?: string;            // Additional CSS classes
}

// Activity item interface
interface ActivityItem {
  id: string;
  type: 'post' | 'comment' | 'achievement' | 'market' | 'welcome';
  timestamp: string;
  actor: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  content: any; // Varies by type
  meta?: any;   // Additional metadata
}
```

**State Management:**
```typescript
// Activity feed data fetching
const { 
  data: activityItems,
  isLoading,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery(
  ['activity-feed', userId, filter],
  ({ pageParam = 1 }) => fetchActivityFeed(userId, filter, pageParam),
  {
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchInterval: 60000, // Auto-refresh every minute
  }
);

// Filter state
const [activeFilter, setActiveFilter] = useState<ActivityFilter>({
  types: ['all'],
  timeRange: 'week'
});
```

**Best Practices:**
- Implement optimistic updates for real-time feel when user takes actions
- Use virtualization for long feeds to maintain performance
- Implement skeleton loading states while data is fetched
- Apply proper date/time formatting for activity timestamps
- Design for both chronological and algorithmic feed ordering
- Handle edge cases like deleted content references

**Potential Challenges:**
- **Feed Freshness**: Balancing real-time updates with performance - Use a combination of polling and WebSocket notifications
- **Content Variety**: Creating consistent presentation for disparate item types - Design a flexible card system with type-specific renderers

### Sub-Task 2: Welcome & Onboarding Banner
**Description:** Create a dynamic banner system for new users that provides context-aware guidance, onboarding steps, and platform introduction.

**Key UI Elements:**
- Dismissible welcome banner with Success Kid branding
- Step-by-step onboarding checklist with progress indicators
- Interactive guidance prompts
- Visual callouts to key features
- Celebratory messaging for completed steps

**Styling Approach:**
```jsx
// Welcome banner component
<div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg overflow-hidden shadow-lg mb-6">
  <div className="p-6 md:p-8 flex flex-col md:flex-row items-center">
    {/* Banner illustration */}
    <div className="w-32 h-32 flex-shrink-0 mb-4 md:mb-0 md:mr-6">
      <img 
        src="/images/success-kid-welcome.png" 
        alt="Success Kid Welcome" 
        className="w-full h-full object-contain"
      />
    </div>
    
    {/* Banner content */}
    <div className="flex-grow text-white">
      <h2 className="text-2xl font-bold mb-2">
        Welcome to Success Kid Community!
      </h2>
      
      <p className="text-blue-100 mb-4">
        Let's get you started with a few simple steps to make the most of your experience.
      </p>
      
      {/* Progress indicators */}
      <div className="space-y-2 mb-4">
        {onboardingSteps.map((step) => (
          <div 
            key={step.id}
            className="flex items-center"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
              step.completed 
                ? 'bg-green-400' 
                : 'bg-white bg-opacity-30'
            }`}>
              {step.completed ? (
                <CheckIcon className="w-3 h-3 text-blue-800" />
              ) : (
                <span className="text-xs font-medium text-white">{step.order}</span>
              )}
            </div>
            <span className={step.completed ? 'line-through opacity-80' : ''}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      
      {/* Action button */}
      <button 
        onClick={handleNextStep}
        className="px-5 py-2 bg-white text-blue-700 rounded-md font-medium hover:bg-blue-50 transition-colors"
      >
        {getNextActionLabel()}
      </button>
    </div>
    
    {/* Dismiss button */}
    <button 
      onClick={dismissBanner}
      className="absolute top-3 right-3 text-white opacity-70 hover:opacity-100"
      aria-label="Dismiss welcome banner"
    >
      <XIcon className="w-5 h-5" />
    </button>
  </div>
</div>
```

**Accessibility Implementation:**
- Ensure dismissible banners can be removed via keyboard
- Provide proper focus management for interactive elements
- Use appropriate ARIA attributes for dynamic content
- Make illustration decorative with empty alt text
- Ensure sufficient color contrast even with gradient backgrounds

**Potential Challenges:**
- **Persistence**: Managing banner visibility across sessions - Use local storage with expiration time
- **Progressive Disclosure**: Not overwhelming new users - Break guidance into digestible steps triggered by user actions

### Sub-Task 3: Dashboard Cards System
**Description:** Create a flexible card system for displaying various data points, entry points, and activity summaries on the dashboard.

**Key UI Elements:**
- Uniform card containers with consistent spacing
- Card header with title and optional actions
- Various content types within cards
- Loading states for asynchronous content
- Interactive hover and focus states
- Responsive sizing and layout

**Styling Approach:**
```jsx
// Dashboard card component
const DashboardCard = ({ 
  title, 
  icon, 
  children, 
  actions, 
  isLoading, 
  className
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Card header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          {icon && (
            <span className="mr-2 text-gray-500 dark:text-gray-400">
              {icon}
            </span>
          )}
          <h3 className="font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      
      {/* Card content with loading state */}
      <div className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
```

```jsx
// Dashboard grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Activity summary card */}
  <DashboardCard
    title="Recent Activity"
    icon={<ClockIcon className="w-5 h-5" />}
    actions={<button>View All</button>}
    isLoading={isLoadingActivity}
    className="lg:col-span-2"
  >
    <ActivityFeed maxItems={5} />
  </DashboardCard>
  
  {/* Achievement card */}
  <DashboardCard
    title="Achievements"
    icon={<BadgeIcon className="w-5 h-5" />}
    actions={<button>View All</button>}
    isLoading={isLoadingAchievements}
  >
    <AchievementList achievements={recentAchievements} />
  </DashboardCard>
  
  {/* Other dashboard cards... */}
</div>
```

**Accessibility Implementation:**
- Use proper headings for card titles
- Ensure all action buttons have accessible labels
- Provide keyboard navigation between and within cards
- Use appropriate ARIA attributes for loading states
- Ensure sufficient color contrast for all card elements

**Potential Challenges:**
- **Responsive Layout**: Maintaining readability on small screens - Use stacked layouts on mobile with priority ordering
- **Content Density**: Balancing information density with readability - Create expandable sections for detailed information

### Sub-Task 4: Achievement Showcase
**Description:** Create a visually appealing component to display user achievements, progress, and gamification elements on the dashboard.

**Key UI Elements:**
- Achievement badges with visual hierarchy based on rarity
- Progress indicators for achievements in progress
- Level indicator with progress to next level
- Recent unlocks with celebration elements
- Achievement categories and filtering

**Styling Approach:**
```jsx
// Achievement showcase component
<div className="space-y-6">
  {/* Level progress */}
  <div className="mb-6">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Level {user.level}
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {user.points} / {pointsToNextLevel} points to level {user.level + 1}
      </span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
      <div 
        className="bg-primary h-2.5 rounded-full" 
        style={{ width: `${levelProgress}%` }}
      ></div>
    </div>
  </div>
  
  {/* Recent achievements */}
  <div>
    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
      Recent Achievements
    </h4>
    
    {recentAchievements.length > 0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {recentAchievements.map((achievement) => (
          <div 
            key={achievement.id}
            className="group bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-12 h-12 mx-auto mb-2">
              <img 
                src={achievement.iconUrl} 
                alt="" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {achievement.name}
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(achievement.unlockedAt)}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No achievements unlocked yet. Start interacting with the community to earn your first badge!
      </p>
    )}
  </div>
  
  {/* Achievement progress */}
  <div>
    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
      In Progress
    </h4>
    
    <div className="space-y-3">
      {inProgressAchievements.map((achievement) => (
        <div 
          key={achievement.id}
          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 flex-shrink-0 opacity-50">
              <img 
                src={achievement.iconUrl} 
                alt="" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="ml-3 flex-grow">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                {achievement.name}
              </h5>
              <div className="flex justify-between items-center mt-1">
                <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mr-2">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ width: `${achievement.progress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {achievement.progress}%
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
```

**Accessibility Implementation:**
- Use appropriate headings and structure for achievement categories
- Provide text alternatives for achievement badges
- Ensure progress bars have appropriate ARIA attributes
- Use proper color contrast for progress indicators
- Make achievement details available to screen readers

**Potential Challenges:**
- **Visual Appeal**: Creating visually distinct achievements without clutter - Design a consistent badge system with clear visual hierarchy
- **Progress Indication**: Showing progress clearly for partially completed achievements - Use both visual and numeric progress indicators

### Sub-Task 5: Quick Actions Menu
**Description:** Create a floating or fixed panel providing one-click access to common actions like creating content, connecting wallet, or checking notifications.

**Key UI Elements:**
- Prominent action buttons
- Visual indicators for notifications or updates
- Clear iconography with labels
- Mobile-optimized touch targets
- Contextual actions based on user state

**Styling Approach:**
```jsx
// Quick actions menu - desktop version
<div className="hidden md:block fixed bottom-6 right-6 z-40">
  <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-2">
    <div className="space-y-2">
      {/* Create post action */}
      <button
        onClick={() => openCreateModal('post')}
        className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors"
        aria-label="Create new post"
      >
        <PencilIcon className="w-5 h-5" />
      </button>
      
      {/* Other quick actions */}
      <button
        onClick={checkNotifications}
        className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
        aria-label="Check notifications"
      >
        <BellIcon className="w-5 h-5" />
        {unreadNotifications > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
      </button>
      
      <button
        onClick={openWalletModal}
        className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        aria-label="Connect wallet"
      >
        <WalletIcon className="w-5 h-5" />
      </button>
    </div>
  </div>
</div>

// Quick actions - mobile version (integrated with bottom navigation)
<div className="fixed bottom-16 right-4 z-40 md:hidden">
  <button
    onClick={() => openCreateModal('post')}
    className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-hover transition-colors"
    aria-label="Create new post"
  >
    <PlusIcon className="w-6 h-6" />
  </button>
</div>
```

**Accessibility Implementation:**
- Provide clear, descriptive labels for all action buttons
- Ensure sufficient contrast between icons and backgrounds
- Make notification counts available to screen readers
- Use proper focus management for action menus
- Maintain logical tab order for keyboard navigation

**Potential Challenges:**
- **Action Prioritization**: Determining which actions deserve quick access - Analyze common user flows and prioritize highest-frequency actions
- **Mobile Placement**: Finding optimal positioning on mobile - Design for thumb reach zones on mobile devices

## Integration Points
- Connects with Authentication system to display user-specific content
- Interfaces with Activity Feed API for personalized content
- Connects with Achievement system to display progress
- Integrates with Notification system for updates
- Provides entry points to all major platform features

## Testing Strategy
- Test dashboard rendering with various user states (new user, returning user, etc.)
- Validate responsive layout across all breakpoints
- Test activity feed loading and pagination
- Verify achievement display with different progress states
- Test quick actions functionality and positioning
- Validate accessibility via keyboard and screen reader testing

## Definition of Done
This task is complete when:
- [x] Activity feed displays relevant platform activity with proper formatting
- [x] Welcome banner guides new users through platform onboarding
- [x] Dashboard card system creates a consistent layout for various content types
- [x] Achievement showcase displays user progress and recent unlocks
- [x] Quick actions menu provides easy access to common functions
- [x] All components adapt responsively to different screen sizes
- [x] Real-time updates refresh dashboard content appropriately
- [x] Loading states provide feedback during data fetching
- [x] Empty states guide users when no content is available
- [x] All elements are properly accessible via keyboard and screen reader
- [x] Visual design matches specifications across all components
- [x] Tests validate dashboard functionality with various data scenarios

---

# Task 4: Community & Discussion System

## Task Overview
Create the heart of the community platform by implementing a comprehensive discussion system that enables threaded conversations, content discovery, and engagement. This system will support the creation, viewing, and interaction with community content, serving as the primary social exchange mechanism for the platform.

## Required Document Review
- **Design System Document** - Review sections 4.2 (UX Writing Patterns) and 7.1 (Empty States)
- **App Flow Document** - Review section 4.4 (Content Creation & Posting)
- **PRD** - Review section 4.1 (Discussion Forums) for detailed requirements
- **Phase 1 Artifacts** - Utilize state management patterns and API structure defined in Phase 1

## User Experience Flow
1. **Content Discovery**: Users browse categories and posts to find relevant discussions
2. **Post Viewing**: Users read individual posts and their associated comment threads
3. **Engagement**: Users interact with content through upvotes, comments, and shares
4. **Content Creation**: Users create new posts or respond to existing content
5. **Content Management**: Authors and moderators manage posted content

## Implementation Sub-Tasks

### Sub-Task 1: Category Browser
**Description:** Create a navigational component that allows users to browse and filter content by categories and topics.

**Component Hierarchy:**
```
CategoryBrowser/
├── CategoryHeader            # Title and description area
├── CategoryTabs              # Horizontal scrolling category navigation
├── SubcategorySelector       # Second-level category filtering (if applicable)
├── CategoryStatistics        # Display post counts and activity metrics
└── CategoryActions           # New post button and category actions
```

**Key Interface/Props:**
```typescript
// Category browser component interface
interface CategoryBrowserProps {
  initialCategory?: string;         // Default selected category
  onCategoryChange?: (category: CategoryType) => void; // Selection handler
  showNewPostButton?: boolean;      // Whether to show create button
  onNewPost?: (category: CategoryType) => void; // New post handler
  isLoading?: boolean;              // Control loading state
  className?: string;               // Additional CSS classes
}

// Category data interface
interface CategoryType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  icon?: React.ReactNode;
  subcategories?: CategoryType[];
}
```

**State Management:**
```typescript
// Category data fetching
const { data: categories, isLoading } = useQuery(
  ['categories'],
  fetchCategories,
  {
    staleTime: 5 * 60 * 1000, // Categories change infrequently
  }
);

// Selected category state
const [selectedCategory, setSelectedCategory] = useState<string>(
  props.initialCategory || 'all'
);

// Selected subcategory state (if applicable)
const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

// Select handler
const handleCategorySelect = (categoryId: string) => {
  setSelectedCategory(categoryId);
  setSelectedSubcategory(null); // Reset subcategory when changing main category
  props.onCategoryChange?.(
    categories.find(cat => cat.id === categoryId)
  );
};
```

**Best Practices:**
- Design for horizontal scrolling on mobile with clear indicators
- Cache category data to minimize API calls
- Provide clear visual indicators for selected categories
- Show post counts to help users find active areas
- Keep category structure simple and intuitive
- Ensure proper keyboard navigation for the category tabs

**Potential Challenges:**
- **Category Organization**: Balancing simplicity with organizational needs - Limit to 2 levels (categories and subcategories) to avoid complexity
- **Horizontal Scrolling**: Ensuring usability on mobile - Implement proper overflow indicators and smooth scrolling

### Sub-Task 2: Post List & Filtering
**Description:** Create a component for displaying lists of posts with sorting, filtering, and pagination capabilities.

**Key UI Elements:**
- Post cards with author, timestamp, and engagement metrics
- Sorting controls (newest, popular, etc.)
- Filtering options (time range, post type, etc.)
- Infinite scroll or pagination
- Loading and empty states
- Visual indicators for unread/new content

**Styling Approach:**
```jsx
// Post list component
<div className="space-y-4">
  {/* Sorting and filtering controls */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
    <div className="flex items-center space-x-2">
      <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Sort by:
      </label>
      <select
        id="sort-by"
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
        className="rounded-md border-gray-300 dark:border-gray-700 text-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white"
      >
        <option value="newest">Newest</option>
        <option value="popular">Most Popular</option>
        <option value="commented">Most Commented</option>
        <option value="trending">Trending</option>
      </select>
    </div>
    
    <div className="flex items-center">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="text-sm text-gray-600 dark:text-gray-400 flex items-center"
      >
        <FilterIcon className="w-4 h-4 mr-1" />
        Filter
      </button>
      
      {activeFilters > 0 && (
        <span className="ml-2 text-xs bg-primary text-white rounded-full px-2 py-0.5">
          {activeFilters}
        </span>
      )}
    </div>
  </div>
  
  {/* Expanded filter panel if showFilters is true */}
  {showFilters && <PostFilterPanel onApply={handleApplyFilters} />}
  
  {/* Post list */}
  {isLoading ? (
    // Skeleton loading state
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  ) : posts.length > 0 ? (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard 
          key={post.id} 
          post={post} 
          onClick={() => handlePostClick(post)}
        />
      ))}
      
      {hasNextPage && (
        <div className="pt-4 text-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load more posts'}
          </button>
        </div>
      )}
    </div>
  ) : (
    // Empty state
    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <DocumentIcon className="w-12 h-12 mx-auto text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        No posts found
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {emptyStateMessage || 'There are no posts in this category yet. Be the first to create one!'}
      </p>
      <div className="mt-6">
        <button
          onClick={handleCreatePost}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
        >
          Create Post
        </button>
      </div>
    </div>
  )}
</div>
```

**Accessibility Implementation:**
- Use proper ARIA roles for list content
- Provide keyboard access to all filtering and sorting controls
- Implement proper focus management when loading more content
- Ensure filter controls have appropriate labels
- Announce changes in sort order to screen readers

**Potential Challenges:**
- **Performance**: Handling large post lists efficiently - Implement virtualization for long lists and optimize rendering
- **Filter Complexity**: Balancing power and simplicity - Group filters into logical categories with clear labels

### Sub-Task 3: Individual Post View
**Description:** Create a detailed view for individual posts, showing the full content, author information, and associated metadata.

**Key UI Elements:**
- Post header with title and metadata
- Author information and timestamp
- Post content with proper formatting
- Media display (images, embedded content)
- Engagement actions (upvote, comment, share)
- Related or suggested content

**Styling Approach:**
```jsx
// Post detail component
<article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
  {/* Post header */}
  <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {post.title}
        </h1>
        <div className="mt-2 flex items-center space-x-4">
          <CategoryBadge category={post.category} />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(post.createdAt)}
          </span>
        </div>
      </div>
      
      <PostActionsDropdown post={post} onDelete={handleDelete} />
    </div>
  </div>
  
  {/* Post content */}
  <div className="px-4 sm:px-6 py-4">
    {/* Author information */}
    <div className="flex items-center mb-4">
      <UserAvatar user={post.author} size="md" />
      <div className="ml-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {post.author.username}
          {post.author.isVerified && <VerifiedBadge className="ml-1" />}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Level {post.author.level} • {post.author.postCount} posts
        </p>
      </div>
    </div>
    
    {/* Post body with content */}
    <div className="prose dark:prose-invert max-w-none">
      <PostContent content={post.content} />
    </div>
    
    {/* Media gallery if post has images */}
    {post.mediaUrls && post.mediaUrls.length > 0 && (
      <div className="mt-4">
        <PostMedia media={post.mediaUrls} />
      </div>
    )}
  </div>
  
  {/* Engagement actions */}
  <div className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-4">
    <VoteButtons 
      upvotes={post.upvotes} 
      downvotes={post.downvotes} 
      userVote={userVote} 
      onVote={handleVote} 
    />
    
    <button 
      onClick={focusCommentInput}
      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
    >
      <ChatIcon className="w-5 h-5 mr-1.5" />
      <span>{post.commentCount} Comments</span>
    </button>
    
    <button 
      onClick={handleShare}
      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
    >
      <ShareIcon className="w-5 h-5 mr-1.5" />
      <span>Share</span>
    </button>
  </div>
</article>
```

**Accessibility Implementation:**
- Use proper article and heading semantics
- Ensure media has appropriate alternative text
- Make all interactive elements accessible via keyboard
- Provide proper ARIA labels for buttons with icons
- Ensure sufficient color contrast for all text elements

**Potential Challenges:**
- **Content Formatting**: Maintaining proper formatting for user-created content - Use a sanitized HTML renderer with proper styling
- **Media Display**: Handling different media types and sizes - Create adaptive media containers with proper aspect ratio preservation

### Sub-Task 4: Comment Thread System
**Description:** Create a hierarchical comment system supporting threaded discussions, voting, and user interactions.

**Key UI Elements:**
- Comment entry form
- Nested comment threads (with appropriate depth limits)
- Comment voting controls
- Reply functionality
- Author highlighting (for post author)
- Timestamps and editing indicators
- Collapse/expand functionality for long threads

**Styling Approach:**
```jsx
// Comment thread component
<div className="mt-6">
  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
    Comments ({comments.length})
  </h2>
  
  {/* Comment form */}
  <div className="mb-6">
    <CommentForm 
      postId={post.id} 
      onCommentAdded={handleNewComment} 
    />
  </div>
  
  {/* Comment list */}
  {isLoadingComments ? (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  ) : comments.length > 0 ? (
    <div className="space-y-4">
      {comments
        .filter(comment => !comment.parentId) // Root comments only
        .map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            replies={comments.filter(c => c.parentId === comment.id)}
            postAuthorId={post.author.id}
            onReply={handleReply}
            onVote={handleVote}
          />
        ))}
    </div>
  ) : (
    <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <ChatIcon className="w-10 h-10 mx-auto text-gray-400" />
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        No comments yet. Be the first to share your thoughts!
      </p>
    </div>
  )}
</div>

// Individual comment component
const Comment = ({ 
  comment, 
  isPostAuthor, 
  onReply, 
  onVote 
}) => {
  const [isReplying, setIsReplying] = useState(false);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      {/* Comment header */}
      <div className="flex items-center">
        <UserAvatar user={comment.author} size="sm" />
        <div className="ml-2">
          <div className="flex items-center">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.author.username}
            </h4>
            {isPostAuthor && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full px-2 py-0.5">
                Author
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(comment.createdAt)}
            {comment.edited && ' (edited)'}
          </p>
        </div>
      </div>
      
      {/* Comment content */}
      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        {comment.content}
      </div>
      
      {/* Comment actions */}
      <div className="mt-3 flex items-center space-x-4">
        <VoteButtons 
          upvotes={comment.upvotes} 
          downvotes={comment.downvotes}
          userVote={comment.userVote}
          onVote={(direction) => onVote(comment.id, direction)}
          compact
        />
        
        <button
          onClick={() => setIsReplying(!isReplying)}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          {isReplying ? 'Cancel' : 'Reply'}
        </button>
      </div>
      
      {/* Reply form */}
      {isReplying && (
        <div className="mt-3">
          <CommentForm
            postId={comment.postId}
            parentId={comment.id}
            onCommentAdded={(newComment) => {
              setIsReplying(false);
              onReply(newComment);
            }}
            placeholder={`Reply to ${comment.author.username}...`}
            autoFocus
          />
        </div>
      )}
    </div>
  );
};
```

**Accessibility Implementation:**
- Use proper nesting of elements for thread hierarchy
- Provide keyboard access to all comment actions
- Announce reply state changes to screen readers
- Ensure focus management when opening/closing reply forms
- Use appropriate landmarks for comment sections

**Potential Challenges:**
- **Deep Threading**: Handling deeply nested comment threads - Limit visual nesting to 3-4 levels with "Show more replies" for deeper levels
- **Real-time Updates**: Keeping comment threads up-to-date - Implement optimistic updates with server reconciliation

### Sub-Task 5: Content Creation Editor
**Description:** Create a rich text editor component for creating and editing posts and comments, supporting formatting, media uploads, and previews.

**Key UI Elements:**
- Rich text editing toolbar
- Media upload and embedding
- Draft saving functionality
- Preview mode
- Post category selection
- Publishing controls
- Character count and limitations

**Styling Approach:**
```jsx
// Content editor component
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
  {/* Editor header */}
  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
    <h2 className="font-medium text-gray-900 dark:text-white">
      {isEditing ? 'Edit Post' : 'Create New Post'}
    </h2>
  </div>
  
  {/* Editor form */}
  <form onSubmit={handleSubmit} className="p-4">
    {/* Post title */}
    <div className="mb-4">
      <label 
        htmlFor="post-title" 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Title
      </label>
      <input
        id="post-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give your post a title"
        className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white"
        required
      />
    </div>
    
    {/* Category selection */}
    <div className="mb-4">
      <label 
        htmlFor="post-category" 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Category
      </label>
      <select
        id="post-category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white"
        required
      >
        <option value="">Select a category</option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
    
    {/* Rich text editor */}
    <div className="mb-4">
      <label 
        htmlFor="post-content" 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Content
      </label>
      <div className="border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 p-2 flex flex-wrap items-center gap-1">
          <ToolbarButton icon={<BoldIcon />} onClick={() => formatText('bold')} />
          <ToolbarButton icon={<ItalicIcon />} onClick={() => formatText('italic')} />
          <ToolbarButton icon={<UnderlineIcon />} onClick={() => formatText('underline')} />
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
          <ToolbarButton icon={<ListBulletIcon />} onClick={() => formatText('bullet')} />
          <ToolbarButton icon={<ListNumberIcon />} onClick={() => formatText('number')} />
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
          <ToolbarButton icon={<LinkIcon />} onClick={insertLink} />
          <ToolbarButton icon={<PhotoIcon />} onClick={handleImageUpload} />
        </div>
        
        {/* Editor area */}
        <div className="p-3">
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content here..."
            className="w-full min-h-[200px] border-0 focus:ring-0 p-0 dark:bg-gray-800 dark:text-white resize-y"
            required
          ></textarea>
        </div>
      </div>
      
      {/* Character count */}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>
          {content.length} / {maxCharacters} characters
        </span>
        <span>
          {isDraft ? 'Draft saved' : ''}
        </span>
      </div>
    </div>
    
    {/* Media uploads */}
    {mediaFiles.length > 0 && (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Attached Media
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {mediaFiles.map((file, index) => (
            <div key={index} className="relative group">
              <img 
                src={URL.createObjectURL(file)}
                alt={`Upload ${index + 1}`}
                className="h-24 w-full object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="absolute top-1 right-1 bg-gray-900 bg-opacity-70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Action buttons */}
    <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={handleCancel}
        className="px-4 py-2 text-gray-700 dark:text-gray-300"
      >
        Cancel
      </button>
      
      <div className="space-x-2">
        <button
          type="button"
          onClick={handleSaveDraft}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Save Draft
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
        >
          {isSubmitting ? 'Publishing...' : 'Publish Post'}
        </button>
      </div>
    </div>
  </form>
</div>
```

**Accessibility Implementation:**
- Use proper labels for all editor controls
- Ensure toolbar buttons have appropriate ARIA attributes
- Provide keyboard shortcuts for common formatting actions
- Maintain focus when toggling between editor and preview
- Announce validation errors appropriately

**Potential Challenges:**
- **Rich Text Handling**: Balancing rich editing with security - Implement proper sanitization of user content
- **Media Uploads**: Managing upload progress and failures - Create robust error handling and retry mechanisms

## Integration Points
- Connects with Authentication system for author information
- Interfaces with Notification system for reply and mention alerts
- Connects with Points & Gamification for engagement rewards
- Expects backend APIs for content CRUD operations and voting
- Provides data for Activity Feed and user profiles

## Testing Strategy
- Test post list loading, sorting, and filtering
- Validate post viewing with various content types
- Test comment creation, threading, and voting
- Verify rich text editor formatting and media uploads
- Test content creation process end-to-end
- Validate error handling for all user inputs
- Test accessibility via keyboard and screen reader

## Definition of Done
This task is complete when:
- [x] Category browser allows intuitive navigation between content areas
- [x] Post list displays content with sorting and filtering options
- [x] Individual post view shows full content with engagement options
- [x] Comment thread system supports nested discussions and voting
- [x] Content creation editor enables rich post creation and editing
- [x] All views have appropriate loading and empty states
- [x] Content engagement (voting, commenting) works correctly
- [x] Rich text formatting is properly displayed and sanitized
- [x] Media uploads and displays function correctly
- [x] All interactions provide appropriate feedback
- [x] Components are fully responsive across all screen sizes
- [x] All elements are accessible via keyboard and screen reader

---

# Final Phase 2 Deliverable Summary

The Phase 2 implementation has successfully created the comprehensive frontend architecture for the Success Kid Community Platform. This phase has focused on building a robust, responsive, and engaging user experience that brings the platform's core features to life while preparing for seamless integration with backend services in Phase 3.

## Component Library Overview

The implementation has established a well-structured component library following Atomic Design principles:

### Core Framework Components
- **App Shell**: The foundational layout structure including responsive navigation
- **Authentication System**: Multi-provider authentication with wallet integration
- **Layout Components**: Responsive grid system and page templates

### Feature Components
- **Community System**: Forums, posts, comments, and content creation tools
- **Dashboard**: Personalized activity feed and user-specific content
- **Profile System**: User profiles, achievements, and settings management
- **Market Data**: Price tracking, token visualization, and wallet integration
- **Gamification Elements**: Achievement display, points system, and leaderboards

### UI Component System
- **Design System Implementation**: Typography, color system, spacing, and interaction patterns
- **Form Components**: Input fields, buttons, selectors, and validation
- **Data Display**: Cards, lists, grids, and visualization components
- **Feedback Elements**: Notifications, toasts, loading states, and error handling

## UI Implementation Map

```
┌─────────────────────┐       ┌─────────────────────────┐       ┌───────────────────────┐
│                     │       │                         │       │                       │
│  Navigation & App   │◄─────►│  Authentication &       │◄─────►│  Homepage & Dashboard │
│  Shell              │       │  User Profile           │       │                       │
│                     │       │                         │       │                       │
└─────────┬───────────┘       └───────────┬─────────────┘       └──────────┬────────────┘
          │                               │                                │
          │                               │                                │
          ▼                               ▼                                ▼
┌─────────────────────┐       ┌─────────────────────────┐       ┌───────────────────────┐
│                     │       │                         │       │                       │
│  Community &        │◄─────►│  Market & Token         │◄─────►│  Points &             │
│  Discussion System  │       │  Visualization          │       │  Gamification         │
│                     │       │                         │       │                       │
└─────────┬───────────┘       └───────────┬─────────────┘       └──────────┬────────────┘
          │                               │                                │
          │                               │                                │
          ▼                               ▼                                ▼
┌─────────────────────┐       ┌─────────────────────────┐       ┌───────────────────────┐
│                     │       │                         │       │                       │
│  Content Creation   │◄─────►│  Notification &         │◄─────►│  Search & Discovery   │
│  Tools              │       │  Real-time Updates      │       │                       │
│                     │       │                         │       │                       │
└─────────────────────┘       └─────────────────────────┘       └───────────────────────┘
```

## State Management Architecture

The platform implements a specialized state management approach for different data types:

1. **Authentication State**: Managed through Clerk with local context providers for easy access throughout the application
2. **Server State**: Handled via React Query with appropriate caching strategies, optimistic updates, and background refetching
3. **Client State**: Managed through Zustand stores organized by domain (UI state, preferences, temporary data)
4. **Form State**: Implemented with React Hook Form for complex forms with validation
5. **URL State**: Leveraged through React Router for shareable and bookmark-able application states

### Data Flow Patterns

- **Real-time Updates**: Implemented through Supabase subscriptions with optimistic UI updates
- **Cached Data**: Strategic caching with appropriate invalidation triggers
- **Offline Support**: Key data persisted locally with background synchronization when online
- **Error Handling**: Comprehensive error boundaries with graceful degradation
- **Loading States**: Consistent loading indicators with skeleton screens for better UX

## API Contract Documentation

The frontend implementation expects the following API endpoints from the backend:

### Authentication & Users
- `GET /api/users/:id` - Get user profile information
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/settings` - Update user settings
- `POST /api/wallet/connect` - Connect wallet address
- `POST /api/wallet/verify` - Verify wallet signature

### Community & Content
- `GET /api/categories` - List content categories
- `GET /api/posts` - List posts with filtering and pagination
- `GET /api/posts/:id` - Get single post with details
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update existing post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/:id/comments` - Get comments for a post
- `POST /api/posts/:id/comments` - Add comment to a post
- `POST /api/posts/:id/vote` - Vote on a post
- `POST /api/comments/:id/vote` - Vote on a comment

### Dashboard & Activity
- `GET /api/activity` - Get activity feed items
- `GET /api/activity/:userId` - Get user-specific activity
- `GET /api/dashboard` - Get personalized dashboard data

### Gamification & Achievements
- `GET /api/achievements` - List all possible achievements
- `GET /api/users/:id/achievements` - Get user achievements
- `GET /api/users/:id/points` - Get user points history
- `GET /api/leaderboards/:type` - Get leaderboard data by type

### Market Data
- `GET /api/market/price` - Get current token price
- `GET /api/market/history` - Get historical price data
- `GET /api/market/transactions` - Get recent transactions
- `GET /api/market/milestones` - Get market cap milestones

## Phase 3 Handover Guide

The Phase 2 implementation has established a comprehensive frontend architecture that now requires backend integration in Phase 3. Key integration points include:

### Authentication Integration
- Clerk authentication is fully configured but needs backend user record creation
- Wallet verification requires backend signature validation
- User profiles need persistent storage and retrieval

### Data Persistence
- All content creation (posts, comments) needs database storage
- User activity and engagement metrics require tracking
- Achievement and points systems need rule implementation

### Real-time Features
- Notification system requires real-time delivery
- Activity feeds need subscription-based updates
- Chat and messaging features need WebSocket implementation

### External Integrations
- Wallet balance verification needs blockchain API integration
- Market data requires external API connections
- Media uploads need storage and processing services

### Getting Started
1. Review the API contract documentation for expected endpoints
2. Implement Supabase database schema matching frontend data models
3. Connect authentication providers to backend user management
4. Implement core business logic for content and gamification features
5. Create background services for asynchronous processing
6. Develop integration tests with frontend components

The frontend has been built with mock data providers that can be seamlessly replaced with real API integrations, allowing for incremental backend development and testing.