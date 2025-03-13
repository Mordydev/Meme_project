import { render, screen, fireEvent } from '@testing-library/react';
import { AppShellProvider, useAppShell, MainLayout, ContentContainer, NavigationContainer } from '@/components/layout/AppShell';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Mock the useMediaQuery hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: jest.fn()
}));

// Create a test component to expose the context values
function TestConsumer() {
  const { sidebarOpen, toggleSidebar, isMobile } = useAppShell();
  
  return (
    <div>
      <div data-testid="sidebar-open">{String(sidebarOpen)}</div>
      <div data-testid="is-mobile">{String(isMobile)}</div>
      <button onClick={toggleSidebar} data-testid="toggle-btn">Toggle</button>
    </div>
  );
}

describe('AppShell components', () => {
  beforeEach(() => {
    // Clear localStorage mock
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      jest.clearAllMocks();
    }
  });

  describe('AppShellProvider', () => {
    it('provides correct default state for desktop', () => {
      // Mock desktop device
      (useMediaQuery as jest.Mock).mockReturnValue(false);
      
      render(
        <AppShellProvider>
          <TestConsumer />
        </AppShellProvider>
      );
      
      // Verify default state
      expect(screen.getByTestId('sidebar-open').textContent).toBe('true');
      expect(screen.getByTestId('is-mobile').textContent).toBe('false');
    });
    
    it('provides correct default state for mobile', () => {
      // Mock mobile device
      (useMediaQuery as jest.Mock).mockReturnValue(true);
      
      render(
        <AppShellProvider>
          <TestConsumer />
        </AppShellProvider>
      );
      
      // Verify mobile default state (sidebar closed on mobile)
      expect(screen.getByTestId('sidebar-open').textContent).toBe('false');
      expect(screen.getByTestId('is-mobile').textContent).toBe('true');
    });
    
    it('toggles sidebar state when toggle function is called', () => {
      // Mock desktop device
      (useMediaQuery as jest.Mock).mockReturnValue(false);
      
      render(
        <AppShellProvider>
          <TestConsumer />
        </AppShellProvider>
      );
      
      // Initially sidebar is open
      expect(screen.getByTestId('sidebar-open').textContent).toBe('true');
      
      // Toggle sidebar
      fireEvent.click(screen.getByTestId('toggle-btn'));
      
      // Sidebar should now be closed
      expect(screen.getByTestId('sidebar-open').textContent).toBe('false');
    });
  });

  describe('MainLayout', () => {
    it('renders navigation and content correctly for desktop', () => {
      // Mock desktop device
      (useMediaQuery as jest.Mock).mockReturnValue(false);
      
      const { container } = render(
        <AppShellProvider>
          <MainLayout 
            navigation={<div data-testid="navigation">Navigation</div>}
            header={<div data-testid="header">Header</div>}
          >
            <div data-testid="content">Content</div>
          </MainLayout>
        </AppShellProvider>
      );
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      
      // Desktop layout should have a flex container
      expect(container.firstChild).toHaveClass('flex');
    });
    
    it('renders bottom navigation for mobile', () => {
      // Mock mobile device
      (useMediaQuery as jest.Mock).mockReturnValue(true);
      
      const { container } = render(
        <AppShellProvider>
          <MainLayout 
            navigation={<div data-testid="navigation">Navigation</div>}
            header={<div data-testid="header">Header</div>}
          >
            <div data-testid="content">Content</div>
          </MainLayout>
        </AppShellProvider>
      );
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      
      // Mobile layout should have fixed bottom navigation
      const navigationParent = screen.getByTestId('navigation').parentElement;
      expect(navigationParent).toHaveClass('fixed');
      expect(navigationParent).toHaveClass('bottom-0');
    });
  });

  describe('ContentContainer', () => {
    it('renders with correct padding for desktop', () => {
      // Mock desktop device
      (useMediaQuery as jest.Mock).mockReturnValue(false);
      
      const { container } = render(
        <AppShellProvider>
          <ContentContainer>
            <div data-testid="content">Content</div>
          </ContentContainer>
        </AppShellProvider>
      );
      
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('px-4');
      expect(container.firstChild).toHaveClass('py-6');
      
      // Should not have additional bottom padding for mobile
      expect(container.firstChild).not.toHaveClass('pb-20');
    });
    
    it('renders with extra bottom padding for mobile', () => {
      // Mock mobile device
      (useMediaQuery as jest.Mock).mockReturnValue(true);
      
      const { container } = render(
        <AppShellProvider>
          <ContentContainer>
            <div data-testid="content">Content</div>
          </ContentContainer>
        </AppShellProvider>
      );
      
      // Mobile should have extra bottom padding for bottom nav
      expect(container.firstChild).toHaveClass('pb-20');
    });
  });
});
