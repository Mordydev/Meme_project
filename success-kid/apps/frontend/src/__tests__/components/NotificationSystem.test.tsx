/**
 * Tests for the Notification System components
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';
import { NotificationCenter } from '@/components/features/notifications/NotificationCenter';
import { ToastContainer, ToastNotification } from '@/components/features/notifications/ToastNotification';
import { NotificationSystem } from '@/components/features/notifications/NotificationSystem';
import { NotificationSettings } from '@/components/features/notifications/NotificationSettings';
import { PushNotification } from '@/components/features/notifications/PushNotification';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NotificationType } from '@/types';

// Mock the hooks
jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));

jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: jest.fn(() => false),
}));

jest.mock('@/components/providers/WebSocketProvider', () => ({
  useWebSocketContext: jest.fn(() => ({
    isConnected: true,
  })),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock data
const mockNotification: Notification = {
  id: 'notification-1',
  type: 'achievement' as NotificationType,
  title: 'Achievement Unlocked',
  message: 'You earned the "Content Creator" badge',
  read: false,
  createdAt: new Date().toISOString(),
  actions: [
    {
      label: 'View',
      action: 'view_achievement',
      url: '/achievements/content-creator',
    },
  ],
};

// Mock notification hook implementation
const mockUseNotifications = () => {
  return {
    notifications: [mockNotification],
    groupedNotifications: {
      [new Date().toLocaleDateString()]: [mockNotification],
    },
    unread: 1,
    settings: {
      categories: {
        achievement: true,
        social: true,
        system: true,
        content: true,
        market: true,
        points: true,
      },
      delivery: {
        inApp: true,
        email: false,
        push: false,
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC',
      },
    },
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    removeNotification: jest.fn(),
    clearAll: jest.fn(),
    updateSettings: jest.fn(),
    resetSettings: jest.fn(),
    handleAction: jest.fn(),
    getFilteredNotifications: jest.fn(() => [mockNotification]),
    getUnreadCount: jest.fn(() => 1),
    requestNotificationPermission: jest.fn(() => Promise.resolve(true)),
    isConnected: true,
  };
};

describe('NotificationBell', () => {
  beforeEach(() => {
    (useNotifications as jest.Mock).mockImplementation(mockUseNotifications);
  });

  it('renders the notification bell with badge when unread notifications exist', () => {
    render(<NotificationBell />);
    
    // Check bell icon
    expect(screen.getByLabelText('1 new notification')).toBeInTheDocument();
    
    // Check badge
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('opens the notification center when clicked', () => {
    render(<NotificationBell />);
    
    // Click the bell
    fireEvent.click(screen.getByLabelText('1 new notification'));
    
    // Check if notification center opens (header appears)
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders mobile variant correctly', () => {
    render(<NotificationBell variant="mobile" />);
    
    // Check that mobile text is shown
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });
});

describe('NotificationCenter', () => {
  beforeEach(() => {
    (useNotifications as jest.Mock).mockImplementation(mockUseNotifications);
  });

  it('displays notifications grouped by date', () => {
    render(<NotificationCenter isOpen={true} onClose={jest.fn()} />);
    
    // Check notification title
    expect(screen.getByText('Achievement Unlocked')).toBeInTheDocument();
    
    // Check notification message
    expect(screen.getByText('You earned the "Content Creator" badge')).toBeInTheDocument();
  });

  it('calls markAllAsRead when that button is clicked', () => {
    const mockNotificationsHook = mockUseNotifications();
    (useNotifications as jest.Mock).mockImplementation(() => mockNotificationsHook);
    
    render(<NotificationCenter isOpen={true} onClose={jest.fn()} />);
    
    // Click "Mark all as read" button
    fireEvent.click(screen.getByText('Mark all as read'));
    
    // Check if markAllAsRead was called
    expect(mockNotificationsHook.markAllAsRead).toHaveBeenCalled();
  });

  it('filters notifications when filter buttons are clicked', () => {
    const mockNotificationsHook = mockUseNotifications();
    mockNotificationsHook.getFilteredNotifications = jest.fn(() => [mockNotification]);
    (useNotifications as jest.Mock).mockImplementation(() => mockNotificationsHook);
    
    render(<NotificationCenter isOpen={true} onClose={jest.fn()} />);
    
    // Click on "Achievements" filter
    fireEvent.click(screen.getByText('Achievements'));
    
    // Check if getFilteredNotifications was called
    expect(mockNotificationsHook.getFilteredNotifications).toHaveBeenCalled();
  });
});

describe('ToastNotification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders a toast notification correctly', () => {
    render(
      <ToastNotification 
        notification={mockNotification} 
        onDismiss={jest.fn()} 
      />
    );
    
    // Check title and message
    expect(screen.getByText('Achievement Unlocked')).toBeInTheDocument();
    expect(screen.getByText('You earned the "Content Creator" badge')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = jest.fn();
    render(
      <ToastNotification 
        notification={mockNotification} 
        onDismiss={onDismiss} 
      />
    );
    
    // Click close button
    fireEvent.click(screen.getByLabelText('Close notification'));
    
    // Check if onDismiss was called
    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-dismisses after the specified duration', () => {
    const onDismiss = jest.fn();
    render(
      <ToastNotification 
        notification={mockNotification} 
        onDismiss={onDismiss} 
      />
    );
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(8000); // Achievement toasts stay for 8 seconds
    });
    
    // Check if onDismiss was called
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('NotificationSystem', () => {
  beforeEach(() => {
    (useNotifications as jest.Mock).mockImplementation(mockUseNotifications);
    
    // Mock window.navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('renders toast container when showToasts is true', () => {
    render(<NotificationSystem showToasts={true} />);
    
    // Check that toast container is in the document
    expect(document.querySelector('[aria-label="Notification region"]')).toBeInTheDocument();
  });

  it('shows offline status when navigator.onLine is false', () => {
    // Set navigator.onLine to false
    Object.defineProperty(navigator, 'onLine', {
      value: false,
    });
    
    render(<NotificationSystem showConnectionStatus={true} />);
    
    // Check for offline message
    expect(screen.getByText("You're offline. Some features may be unavailable.")).toBeInTheDocument();
  });
});

describe('NotificationSettings', () => {
  beforeEach(() => {
    const mockNotificationsHook = mockUseNotifications();
    (useNotifications as jest.Mock).mockImplementation(() => mockNotificationsHook);
  });

  it('renders all notification categories', () => {
    render(<NotificationSettings />);
    
    // Check category headings are rendered
    expect(screen.getByText('Notification Categories')).toBeInTheDocument();
    expect(screen.getByText('Delivery Methods')).toBeInTheDocument();
    expect(screen.getByText('Notification Frequency')).toBeInTheDocument();
    expect(screen.getByText('Quiet Hours')).toBeInTheDocument();
  });

  it('calls updateSettings when form is submitted', async () => {
    const mockNotificationsHook = mockUseNotifications();
    (useNotifications as jest.Mock).mockImplementation(() => mockNotificationsHook);
    
    const onSave = jest.fn();
    render(<NotificationSettings onSave={onSave} />);
    
    // Toggle a setting
    fireEvent.click(screen.getByLabelText('In-App Notifications'));
    
    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Check if updateSettings was called
    await waitFor(() => {
      expect(mockNotificationsHook.updateSettings).toHaveBeenCalled();
    });
    
    // Check if onSave callback was called
    expect(onSave).toHaveBeenCalled();
  });
});
