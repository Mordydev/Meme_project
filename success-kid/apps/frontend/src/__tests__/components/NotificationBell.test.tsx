import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';
import { useNotifications } from '@/hooks/useNotifications';

// Mock the NotificationCenter component
jest.mock('@/components/features/notifications/NotificationCenter', () => ({
  NotificationCenter: jest.fn(({ isOpen, onClose }) => (
    isOpen ? <div data-testid="notification-center">Notification Center Mock</div> : null
  ))
}));

// Mock the Badge component
jest.mock('@/components/ui', () => ({
  Badge: jest.fn(({ count }) => (
    <span data-testid="badge">{count}</span>
  ))
}));

// Mock the useNotifications hook
jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: jest.fn()
}));

describe('NotificationBell Component', () => {
  beforeEach(() => {
    // Default mock implementation for useNotifications
    (useNotifications as jest.Mock).mockReturnValue({
      unread: 5
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders correctly with default props', () => {
    render(<NotificationBell />);
    
    // Bell icon should be rendered
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    // Badge should be rendered with count
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toHaveTextContent('5');
    
    // Notification center should not be visible initially
    expect(screen.queryByTestId('notification-center')).not.toBeInTheDocument();
  });
  
  test('toggles notification center when clicked', () => {
    render(<NotificationBell />);
    
    // Initially notification center is not visible
    expect(screen.queryByTestId('notification-center')).not.toBeInTheDocument();
    
    // Click on bell icon
    fireEvent.click(screen.getByRole('button'));
    
    // Notification center should be visible
    expect(screen.getByTestId('notification-center')).toBeInTheDocument();
    
    // Click again to close
    fireEvent.click(screen.getByRole('button'));
    
    // Notification center should be hidden again
    expect(screen.queryByTestId('notification-center')).not.toBeInTheDocument();
  });
  
  test('hides badge when unread count is zero', () => {
    // Mock 0 unread notifications
    (useNotifications as jest.Mock).mockReturnValue({
      unread: 0
    });
    
    render(<NotificationBell />);
    
    // Badge should not be rendered
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });
  
  test('renders mobile variant correctly', () => {
    render(<NotificationBell variant="mobile" />);
    
    // Should include text label in mobile mode
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });
  
  test('renders compact variant correctly', () => {
    render(<NotificationBell variant="compact" />);
    
    // Should have compact styling (could check class names if needed)
    expect(screen.getByRole('button')).toHaveClass('w-8 h-8');
  });
  
  test('has proper accessibility attributes', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      unread: 3
    });
    
    render(<NotificationBell />);
    
    // Should have appropriate aria-label
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', '3 new notifications');
  });
  
  test('has proper accessibility attributes with zero notifications', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      unread: 0
    });
    
    render(<NotificationBell />);
    
    // Should have appropriate aria-label for no notifications
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'No new notifications');
  });
  
  test('has proper accessibility attributes with one notification', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      unread: 1
    });
    
    render(<NotificationBell />);
    
    // Should have appropriate aria-label for one notification
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', '1 new notification');
  });
});
