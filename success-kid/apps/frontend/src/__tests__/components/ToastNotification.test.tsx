import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastNotification, ToastContainer } from '@/components/features/notifications/ToastNotification';
import { useNotifications } from '@/hooks/useNotifications';

// Mock the useNotifications hook
jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: jest.fn()
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock the Button component
jest.mock('@/components/ui', () => ({
  Button: jest.fn(({ children, onClick }) => (
    <button onClick={onClick} data-testid="action-button">{children}</button>
  ))
}));

describe('ToastNotification Component', () => {
  // Sample notification for testing
  const sampleNotification = {
    id: 'test-notification-1',
    type: 'achievement',
    title: 'Achievement Unlocked',
    message: 'You earned the Content Creator badge',
    read: false,
    createdAt: new Date().toISOString(),
    actions: [
      {
        label: 'View Achievement',
        action: 'view_achievement',
        url: '/achievements/content-creator'
      }
    ]
  };
  
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });
  
  test('renders notification correctly', () => {
    const onDismiss = jest.fn();
    
    render(
      <ToastNotification 
        notification={sampleNotification} 
        onDismiss={onDismiss} 
      />
    );
    
    // Should render the notification title and message
    expect(screen.getByText('Achievement Unlocked')).toBeInTheDocument();
    expect(screen.getByText('You earned the Content Creator badge')).toBeInTheDocument();
    
    // Should render action button
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
    expect(screen.getByText('View Achievement')).toBeInTheDocument();
  });
  
  test('auto-dismisses after timeout', () => {
    const onDismiss = jest.fn();
    
    render(
      <ToastNotification 
        notification={sampleNotification} 
        onDismiss={onDismiss} 
      />
    );
    
    // Should not call onDismiss immediately
    expect(onDismiss).not.toHaveBeenCalled();
    
    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Should call onDismiss after timeout
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
  
  test('dismisses when close button is clicked', () => {
    const onDismiss = jest.fn();
    
    render(
      <ToastNotification 
        notification={sampleNotification} 
        onDismiss={onDismiss} 
      />
    );
    
    // Find close button (the button with X icon)
    const closeButton = screen.getByRole('button', { name: /close notification/i });
    fireEvent.click(closeButton);
    
    // Should call onDismiss
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
  
  test('calls action handler when action button is clicked', () => {
    const onDismiss = jest.fn();
    const handleAction = jest.fn().mockReturnValue({ url: '/achievements/content-creator' });
    
    // Mock the useNotifications hook to return handleAction
    (useNotifications as jest.Mock).mockReturnValue({
      handleAction
    });
    
    render(
      <ToastNotification 
        notification={sampleNotification} 
        onDismiss={onDismiss} 
      />
    );
    
    // Find and click action button
    const actionButton = screen.getByTestId('action-button');
    fireEvent.click(actionButton);
    
    // Should call handleAction with notification and index 0
    expect(handleAction).toHaveBeenCalledWith(sampleNotification, 0);
    
    // Should call onDismiss after action
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
  
  test('pauses timeout on hover and resumes on leave', () => {
    const onDismiss = jest.fn();
    
    render(
      <ToastNotification 
        notification={sampleNotification} 
        onDismiss={onDismiss} 
      />
    );
    
    // Find notification element (role="alert")
    const notification = screen.getByRole('alert');
    
    // Mouse enter to pause timeout
    fireEvent.mouseEnter(notification);
    
    // Fast-forward 10 seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    // Should not call onDismiss yet (paused on hover)
    expect(onDismiss).not.toHaveBeenCalled();
    
    // Mouse leave to resume timeout
    fireEvent.mouseLeave(notification);
    
    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Should call onDismiss after resuming timeout
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('ToastContainer Component', () => {
  // Sample notifications for testing
  const sampleNotifications = [
    {
      id: 'test-notification-1',
      type: 'achievement',
      title: 'Achievement Unlocked',
      message: 'You earned the Content Creator badge',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'test-notification-2',
      type: 'social',
      title: 'New Follower',
      message: 'User123 is now following you',
      read: false,
      createdAt: new Date().toISOString(),
    }
  ];
  
  beforeEach(() => {
    // Mock the useNotifications hook
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: sampleNotifications,
      markAsRead: jest.fn()
    });
  });
  
  test('renders notifications correctly', () => {
    render(<ToastContainer />);
    
    // Should render both notifications
    expect(screen.getByText('Achievement Unlocked')).toBeInTheDocument();
    expect(screen.getByText('New Follower')).toBeInTheDocument();
  });
  
  test('respects position prop', () => {
    render(<ToastContainer position="bottom-left" />);
    
    // Check for correct position class
    const container = screen.getByRole('region');
    expect(container).toHaveClass('bottom-4 left-4 items-start');
  });
  
  test('respects limit prop', () => {
    // Add more notifications
    const manyNotifications = [
      ...sampleNotifications,
      {
        id: 'test-notification-3',
        type: 'system',
        title: 'System Update',
        message: 'The system has been updated',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'test-notification-4',
        type: 'points',
        title: 'Points Earned',
        message: 'You earned 50 points',
        read: false,
        createdAt: new Date().toISOString(),
      }
    ];
    
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: manyNotifications,
      markAsRead: jest.fn()
    });
    
    // Render with limit of 2
    render(<ToastContainer limit={2} />);
    
    // Should only render the first 2 unread notifications
    expect(screen.getByText('Achievement Unlocked')).toBeInTheDocument();
    expect(screen.getByText('New Follower')).toBeInTheDocument();
    expect(screen.queryByText('System Update')).not.toBeInTheDocument();
  });
  
  test('marks notification as read on dismiss', () => {
    const markAsRead = jest.fn();
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: sampleNotifications,
      markAsRead
    });
    
    render(<ToastContainer />);
    
    // Find and click close button on first notification
    const closeButtons = screen.getAllByRole('button', { name: /close notification/i });
    fireEvent.click(closeButtons[0]);
    
    // Should call markAsRead with the notification ID
    expect(markAsRead).toHaveBeenCalledWith(['test-notification-1']);
  });
});
