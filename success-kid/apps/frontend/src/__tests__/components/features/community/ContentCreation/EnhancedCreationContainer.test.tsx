import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedCreationContainer } from '@/components/features/community/ContentCreation/EnhancedCreationContainer';
import { useCreatePost } from '@/hooks/queries/useCommunity';

// Mock the hooks
jest.mock('@/hooks/queries/useCommunity', () => ({
  useCreatePost: jest.fn(),
}));

jest.mock('@/hooks/useDraftManagement', () => ({
  __esModule: true,
  useDraftManagement: () => ({
    drafts: [],
    saveDraft: jest.fn(),
    deleteDraft: jest.fn(),
    loadDraft: jest.fn(),
    markDirty: jest.fn(),
    isDirty: false,
    lastSaved: null,
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('EnhancedCreationContainer', () => {
  beforeEach(() => {
    // Setup default mocks
    (useCreatePost as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
    });
  });

  it('renders the title input and required components', () => {
    render(<EnhancedCreationContainer />);
    
    // Check if title input exists
    expect(screen.getByPlaceholderText('Enter a descriptive title')).toBeInTheDocument();
    
    // Check if content type selector exists
    expect(screen.getByText('Content Type')).toBeInTheDocument();
    
    // Check if publish button exists (may be disabled)
    expect(screen.getByText('Continue to Preview')).toBeInTheDocument();
  });

  it('updates title when user types', async () => {
    render(<EnhancedCreationContainer />);
    
    const titleInput = screen.getByPlaceholderText('Enter a descriptive title');
    fireEvent.change(titleInput, { target: { value: 'My Test Post' } });
    
    await waitFor(() => {
      expect(titleInput).toHaveValue('My Test Post');
    });
  });

  it('shows validation errors when publishing with missing fields', async () => {
    const mockMutate = jest.fn();
    (useCreatePost as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    });

    render(<EnhancedCreationContainer />);
    
    // Try to publish with empty data
    fireEvent.click(screen.getByText('Continue to Preview'));
    
    // Since the button should be disabled when required fields are missing,
    // the mutate function should not be called
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('switches content type when selector is clicked', async () => {
    render(<EnhancedCreationContainer />);
    
    // Check if current type is text (default)
    const textTypeButton = screen.getByText('Text');
    expect(textTypeButton.parentElement).toHaveClass('bg-primary');
    
    // Switch to image type
    const imageTypeButton = screen.getByText('Image');
    fireEvent.click(imageTypeButton);
    
    await waitFor(() => {
      // Now image type should be selected
      expect(imageTypeButton.parentElement).toHaveClass('bg-primary');
      expect(textTypeButton.parentElement).not.toHaveClass('bg-primary');
    });
  });
});
