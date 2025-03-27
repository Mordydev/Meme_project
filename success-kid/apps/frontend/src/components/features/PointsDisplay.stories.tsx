import type { Meta, StoryObj } from '@storybook/react';
import { PointsDisplay } from './points/PointsDisplay';
import { useEffect, useState } from 'react';

const meta: Meta<typeof PointsDisplay> = {
  title: 'Features/PointsDisplay',
  component: PointsDisplay,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A component to display the user\'s Success Points total with animation effects when the points amount changes.'
      }
    }
  },
  argTypes: {
    points: { 
      control: { type: 'number' },
      description: 'The current points amount'
    },
    label: { 
      control: 'text',
      description: 'Optional label text'
    },
    variant: { 
      control: 'select',
      options: ['default', 'compact', 'highlight'],
      description: 'The visual style of the component'
    },
    animated: {
      control: 'boolean',
      description: 'Whether to animate points on mount and update'
    }
  }
};

export default meta;
type Story = StoryObj<typeof PointsDisplay>;

export const Default: Story = {
  args: {
    points: 1250,
    label: 'Success Points',
    variant: 'default',
    animated: true
  }
};

export const Compact: Story = {
  args: {
    points: 1250,
    label: 'Success Points',
    variant: 'compact',
    animated: true
  }
};

export const Highlight: Story = {
  args: {
    points: 1250,
    label: 'Success Points',
    variant: 'highlight',
    animated: true
  }
};

export const StaticWithoutAnimation: Story = {
  args: {
    points: 1250,
    label: 'Success Points',
    variant: 'default',
    animated: false
  }
};

// No direct equivalent for Large in the current implementation

// Interactive animation example
const AnimatedPointsTemplate: Story = {
  render: (args: any) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [points, setPoints] = useState(args.points);
    
    return (
      <div className="space-y-4">
        <PointsDisplay 
          {...args} 
          points={points} 
        />
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 bg-primary text-white rounded"
            onClick={() => setPoints((prev: number) => prev + 50)}
          >
            +50 Points
          </button>
          <button 
            className="px-3 py-1 bg-primary text-white rounded"
            onClick={() => setPoints((prev: number) => prev + 500)}
          >
            +500 Points
          </button>
          <button 
            className="px-3 py-1 bg-accent text-white rounded"
            onClick={() => setPoints((prev: number) => prev - 100)}
          >
            -100 Points
          </button>
        </div>
      </div>
    );
  },
  args: {
    points: 1000,
    label: 'Success Points',
    variant: 'default',
    animated: true
  }
};

export const WithAnimation = AnimatedPointsTemplate;
