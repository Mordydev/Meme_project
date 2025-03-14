import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SocialSharing } from '@/components/features/referrals';
import { toast } from '@/components/ui/toast';

// Mock the toast component
jest.mock('@/components/ui/toast', () => ({
  toast: jest.fn(),
}));

// Mock window.open
const mockOpen = jest.fn();
window.open = mockOpen;

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

describe('SocialSharing', () => {
  const mockProps = {
    referralLink: 'https://example.com/join?ref=TEST123',
    defaultMessage: 'Join me on this platform!',
    onShare: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the social sharing options correctly', () => {
    render(<SocialSharing {...mockProps} />);
    
    // Check for default message in textarea
    const messageField = screen.getByLabelText('Customize your referral message');
    expect(messageField).toHaveValue('Join me on this platform!');
    
    // Check for sharing buttons
    expect(screen.getByLabelText('Share via Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Share via Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Share via Telegram')).toBeInTheDocument();
    expect(screen.getByLabelText('Share via WhatsApp')).toBeInTheDocument();
    expect(screen.getByLabelText('Share via Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Share via Copy Link')).toBeInTheDocument();
  });
  
  it('handles custom message changes', () => {
    render(<SocialSharing {...mockProps} />);
    
    const messageField = screen.getByLabelText('Customize your referral message');
    fireEvent.change(messageField, { target: { value: 'Check out my custom message!' } });
    
    expect(messageField).toHaveValue('Check out my custom message!');
  });
  
  it('handles social media sharing correctly', () => {
    render(<SocialSharing {...mockProps} />);
    
    // Click on Twitter share button
    fireEvent.click(screen.getByLabelText('Share via Twitter'));
    
    // Check if window.open was called with correct params
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://twitter.com/intent/tweet?url='),
      expect.anything(),
      expect.anything()
    );
    
    // Check if onShare callback was called
    expect(mockProps.onShare).toHaveBeenCalledWith('twitter');
  });
  
  it('handles copy link correctly', async () => {
    render(<SocialSharing {...mockProps} />);
    
    // Click on Copy Link button
    fireEvent.click(screen.getByLabelText('Share via Copy Link'));
    
    // Check if clipboard API was called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/join?ref=TEST123');
    
    // Check if toast was shown
    expect(toast).toHaveBeenCalled();
    
    // Check if onShare callback was called
    expect(mockProps.onShare).toHaveBeenCalledWith('copy');
  });
  
  it('renders only specified channels', () => {
    render(
      <SocialSharing 
        {...mockProps} 
        availableChannels={['twitter', 'facebook']} 
      />
    );
    
    // Check that only specified channels are rendered
    expect(screen.getByLabelText('Share via Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Share via Facebook')).toBeInTheDocument();
    expect(screen.queryByLabelText('Share via Telegram')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Share via WhatsApp')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Share via Email')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Share via Copy Link')).not.toBeInTheDocument();
  });
});
