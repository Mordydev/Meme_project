import { render, screen } from '@testing-library/react';
import { BottomTabBar, NavItem } from '@/components/layout/BottomTabBar';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock the framer-motion component to avoid issues with jest
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: React.PropsWithChildren<any>) => (
      <div {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<any>) => <>{children}</>,
}));

// Get the mocked usePathname function
const usePathname = jest.requireMock('next/navigation').usePathname;

describe('BottomTabBar component', () => {
  // Sample navigation items
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: <span data-testid="dashboard-icon">Dashboard Icon</span>,
    },
    {
      id: 'community',
      label: 'Community',
      href: '/community',
      icon: <span data-testid="community-icon">Community Icon</span>,
      badgeCount: 3,
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: <span data-testid="profile-icon">Profile Icon</span>,
    },
  ];

  it('renders all navigation items correctly', () => {
    // Mock pathname to be a non-matching route
    usePathname.mockReturnValue('/other');
    
    render(<BottomTabBar items={navItems} />);
    
    // Check that all items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    
    // Check that icons are rendered
    expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
    expect(screen.getByTestId('community-icon')).toBeInTheDocument();
    expect(screen.getByTestId('profile-icon')).toBeInTheDocument();
  });

  it('shows badge count when provided', () => {
    // Mock pathname to be a non-matching route
    usePathname.mockReturnValue('/other');
    
    render(<BottomTabBar items={navItems} />);
    
    // Check badge is present
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('highlights the active item based on current pathname', () => {
    // Mock pathname to match community route
    usePathname.mockReturnValue('/community');
    
    render(<BottomTabBar items={navItems} />);
    
    // Get all nav items
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const communityLink = screen.getByText('Community').closest('a');
    const profileLink = screen.getByText('Profile').closest('a');
    
    // Community should have active class, others should not
    expect(communityLink).toHaveClass('text-primary');
    expect(dashboardLink).not.toHaveClass('text-primary');
    expect(profileLink).not.toHaveClass('text-primary');
  });

  it('renders with proper ARIA attributes for accessibility', () => {
    // Mock pathname to match dashboard route
    usePathname.mockReturnValue('/dashboard');
    
    render(<BottomTabBar items={navItems} />);
    
    // Check ARIA labels are properly set
    expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Community')).toBeInTheDocument();
    expect(screen.getByLabelText('Profile')).toBeInTheDocument();
  });
});
