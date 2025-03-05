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