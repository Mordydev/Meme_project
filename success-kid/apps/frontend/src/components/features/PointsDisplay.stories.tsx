import type { Meta, StoryObj } from '@storybook/react';
import { PointsDisplay } from './PointsDisplay';
import { useEffect, useState } from 'react';

const meta: Meta<typeof PointsDisplay> = {
  title: 'Features/PointsDisplay',
  component: PointsDisplay,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A component to display the user\'s Success Points balance with animation effects when the balance changes.'
      }
    }
  },
  argTypes: {
    balance: { 
      control: { type: 'number' },
      description: 'The current points balance'
    },
    initialBalance: { 
      control: { type: 'number' },
      description: 'Optional initial balance for animation purposes'
    },
    showLabel: { 
      control: 'boolean',
      description: 'Whether to show the "SP" label after the balance'
    },
    size: { 
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the component'
    },
    variant: { 
      control: 'select',
      options: ['default', 'minimal', 'detailed'],
      description: 'The visual style of the component'
    },
    onBalanceClick: { 
      action: 'balanceClicked',
      description: 'Function called when the balance is clicked'
    }
  }
};

export default meta;
type Story = StoryObj<typeof PointsDisplay>;

export const Default: Story = {
  args: {
    balance: 1250,
    showLabel: true,
    size: 'md',
    variant: 'default'
  }
};

export const Minimal: Story = {
  args: {
    balance: 1250,
    showLabel: true,
    size: 'md',
    variant: 'minimal'
  }
};

export const Detailed: Story = {
  args: {
    balance: 1250,
    showLabel: true,
    size: 'md',
    variant: 'detailed'
  }
};

export const Small: Story = {
  args: {
    balance: 1250,
    showLabel: true,
    size: 'sm',
    variant: 'default'
  }
};

export const Large: Story = {
  args: {
    balance: 1250,
    showLabel: true,
    size: 'lg',
    variant: 'default'
  }
};

// Interactive animation example
const AnimatedPointsTemplate: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [balance, setBalance] = useState(args.balance);
    
    return (
      <div className="space-y-4">
        <PointsDisplay 
          {...args} 
          balance={balance} 
        />
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 bg-primary text-white rounded"
            onClick={() => setBalance(prev => prev + 50)}
          >
            +50 Points
          </button>
          <button 
            className="px-3 py-1 bg-primary text-white rounded"
            onClick={() => setBalance(prev => prev + 500)}
          >
            +500 Points
          </button>
          <button 
            className="px-3 py-1 bg-accent text-white rounded"
            onClick={() => setBalance(prev => prev - 100)}
          >
            -100 Points
          </button>
        </div>
      </div>
    );
  },
  args: {
    balance: 1000,
    showLabel: true,
    size: 'md',
    variant: 'default'
  }
};

export const WithAnimation = AnimatedPointsTemplate;
