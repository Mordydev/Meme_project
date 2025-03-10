import React from 'react';
import { render, screen } from '@testing-library/react';
import { MilestoneTracker } from '../milestone-tracker';
import { getTokenMarketCap } from '@/lib/blockchain/web3';

// Mock the web3 module
jest.mock('@/lib/blockchain/web3', () => ({
  getTokenMarketCap: jest.fn()
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('MilestoneTracker', () => {
  const mockMilestones = [
    { id: 'test-1', target: 1000000, label: '$1M', description: 'Test milestone 1' },
    { id: 'test-2', target: 2000000, label: '$2M', description: 'Test milestone 2' },
    { id: 'test-3', target: 3000000, label: '$3M', description: 'Test milestone 3' },
  ];

  beforeEach(() => {
    // Set up default mock implementation
    (getTokenMarketCap as jest.Mock).mockResolvedValue({
      marketCap: 1500000,
      fullyDiluted: 2000000
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state when fetching data', () => {
    render(<MilestoneTracker />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should display market cap value', async () => {
    render(<MilestoneTracker initialMarketCap={1500000} milestones={mockMilestones} />);
    
    // Wait for component to load
    expect(await screen.findByText('$1,500,000')).toBeInTheDocument();
  });

  it('should calculate progress correctly', async () => {
    render(<MilestoneTracker initialMarketCap={1500000} milestones={mockMilestones} />);
    
    // The progress should be 50% (halfway between $1M and $2M)
    expect(await screen.findByText('50.0% complete')).toBeInTheDocument();
  });

  it('should display the next milestone', async () => {
    render(<MilestoneTracker initialMarketCap={1500000} milestones={mockMilestones} />);
    
    // The next milestone should be $2M
    expect(await screen.findByText('Next Milestone: $2M')).toBeInTheDocument();
  });

  it('should render compact view when compact prop is true', async () => {
    const { queryByText } = render(
      <MilestoneTracker 
        initialMarketCap={1500000} 
        milestones={mockMilestones} 
        compact 
      />
    );
    
    // Market Cap Journey should not be visible in compact mode
    expect(queryByText('Market Cap Journey')).not.toBeInTheDocument();
  });
});
