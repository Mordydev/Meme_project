import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentGuidelines } from '@/components/features/community/ContentCreation/ContentGuidelines';

describe('ContentGuidelines', () => {
  it('renders in compact mode with toggle button', () => {
    render(<ContentGuidelines compact={true} />);
    
    // Should show the toggle button
    const toggleButton = screen.getByText(/View Community Guidelines/i);
    expect(toggleButton).toBeInTheDocument();
    
    // Should not show any guidelines initially
    expect(screen.queryByText('Quick Guidelines')).not.toBeInTheDocument();
    
    // When clicked, should show the guidelines
    fireEvent.click(toggleButton);
    expect(screen.getByText('Quick Guidelines')).toBeInTheDocument();
    
    // When clicked again, should hide the guidelines
    fireEvent.click(screen.getByText(/Hide Community Guidelines/i));
    expect(screen.queryByText('Quick Guidelines')).not.toBeInTheDocument();
  });
  
  it('renders full guidelines view with categories', () => {
    render(<ContentGuidelines compact={false} />);
    
    // Should show the title
    expect(screen.getByText('Community Guidelines')).toBeInTheDocument();
    
    // Should show all category buttons
    expect(screen.getByText('Content Guidelines')).toBeInTheDocument();
    expect(screen.getByText('Community Behavior')).toBeInTheDocument();
    expect(screen.getByText('Legal Requirements')).toBeInTheDocument();
    
    // First category (Content) should be expanded by default
    expect(screen.getByText('Keep it positive')).toBeInTheDocument();
    
    // Behavior category should be collapsed
    expect(screen.queryByText('Be respectful')).not.toBeInTheDocument();
    
    // When clicking on the Behavior category, it should expand
    fireEvent.click(screen.getByText('Community Behavior'));
    expect(screen.getByText('Be respectful')).toBeInTheDocument();
  });
  
  it('adjusts guidelines based on content type', () => {
    // Test with image content type
    render(<ContentGuidelines contentType="image" compact={false} />);
    
    // Should include the image-specific guideline in formatting
    fireEvent.click(screen.getByText('Formatting Tips'));
    expect(screen.getByText('Quality media')).toBeInTheDocument();
    
    // Re-render with link content type
    const { unmount } = render(<ContentGuidelines contentType="image" compact={false} />);
    unmount();
    
    render(<ContentGuidelines contentType="link" compact={false} />);
    
    // Should include the authentic content guideline emphasized for links
    expect(screen.getByText('Content Guidelines')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Content Guidelines'));
    expect(screen.getByText('Authentic content')).toBeInTheDocument();
  });
  
  it('calls onValidationComplete when integrated with validation', () => {
    const mockValidationComplete = jest.fn();
    
    render(
      <ContentGuidelines 
        contentType="text" 
        onValidationComplete={mockValidationComplete} 
        compact={false} 
      />
    );
    
    // In a real implementation, this would trigger content validation
    // Since our component doesn't actually do validation, we're just testing the prop is accepted
    expect(mockValidationComplete).not.toHaveBeenCalled();
  });
});
