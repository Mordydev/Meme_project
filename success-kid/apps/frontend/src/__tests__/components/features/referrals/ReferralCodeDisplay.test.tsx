import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReferralCodeDisplay } from '@/components/features/referrals';
import { toast } from '@/components/ui/toast';

// Mock the toast component
jest.mock('@/components/ui/toast', () => ({
  toast: jest.fn(),
}));

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

describe('ReferralCodeDisplay', () => {
  const mockProps = {
    referralCode: 'TEST123',
    referralLink: 'https://example.com/join?ref=TEST123',
    onRegenerateCode: jest.fn(() => Promise.resolve()),
    isLoading: false,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the referral code and link correctly', () => {
    render(<ReferralCodeDisplay {...mockProps} />);
    
    // Check for referral code
    expect(screen.getByLabelText('Your referral code')).toHaveValue('TEST123');
    
    // Check for referral link
    expect(screen.getByLabelText('Your referral link')).toHaveValue('https://example.com/join?ref=TEST123');
  });
  
  it('calls copy to clipboard when clicking the copy button', async () => {
    render(<ReferralCodeDisplay {...mockProps} />);
    
    // Click the copy button
    fireEvent.click(screen.getByLabelText('Copy referral link to clipboard'));
    
    // Verify clipboard API was called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/join?ref=TEST123');
    
    // Verify toast notification was shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });
  
  it('calls onRegenerateCode when clicking the regenerate button', async () => {
    render(<ReferralCodeDisplay {...mockProps} />);
    
    // Click the regenerate button
    fireEvent.click(screen.getByLabelText('Generate a new referral code'));
    
    // Verify onRegenerateCode was called
    expect(mockProps.onRegenerateCode).toHaveBeenCalled();
    
    // Verify toast notification was shown after regeneration
    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });
  
  it('disables the regenerate button when isLoading is true', () => {
    render(<ReferralCodeDisplay {...mockProps} isLoading={true} />);
    
    // Check that the button is disabled
    expect(screen.getByLabelText('Generate a new referral code')).toBeDisabled();
  });
  
  it('does not render regenerate button when onRegenerateCode is not provided', () => {
    const { onRegenerateCode, ...propsWithoutRegenerate } = mockProps;
    render(<ReferralCodeDisplay {...propsWithoutRegenerate} />);
    
    // Check that the regenerate button is not in the document
    expect(screen.queryByLabelText('Generate a new referral code')).not.toBeInTheDocument();
  });
});
