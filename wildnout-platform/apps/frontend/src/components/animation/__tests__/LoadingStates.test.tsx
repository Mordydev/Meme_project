import React from 'react'
import { render, screen } from '@testing-library/react'
import { Spinner, ProgressBar, Skeleton } from '../LoadingStates'

// Mock framer-motion
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div data-testid="motion-div" {...props}>{children}</div>,
      svg: ({ children, ...props }: any) => <svg data-testid="motion-svg" {...props}>{children}</svg>
    },
    useReducedMotion: () => false
  }
})

describe('Loading State Components', () => {
  describe('Spinner', () => {
    it('renders with default props', () => {
      render(<Spinner />)
      expect(screen.getByTestId('motion-svg')).toBeInTheDocument()
    })

    it('applies size class correctly', () => {
      render(<Spinner size="lg" />)
      expect(screen.getByTestId('motion-svg').parentElement).toHaveClass('size-12')
    })

    it('applies color class correctly', () => {
      render(<Spinner color="secondary" />)
      expect(screen.getByTestId('motion-svg')).toHaveClass('text-flow-blue')
    })

    it('applies custom className', () => {
      render(<Spinner className="test-class" />)
      expect(screen.getByTestId('motion-svg').parentElement).toHaveClass('test-class')
    })
  })

  describe('ProgressBar', () => {
    it('renders with progress value', () => {
      render(<ProgressBar progress={50} />)
      expect(screen.getByTestId('motion-div')).toBeInTheDocument()
    })

    it('applies color class correctly', () => {
      render(<ProgressBar progress={50} color="success" />)
      expect(screen.getByTestId('motion-div')).toHaveClass('bg-victory-green')
    })

    it('shows percentage when specified', () => {
      render(<ProgressBar progress={75} showPercentage />)
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('applies height class correctly', () => {
      render(<ProgressBar progress={50} height="lg" />)
      expect(screen.getByTestId('motion-div').parentElement).toHaveClass('h-3')
    })
  })

  describe('Skeleton', () => {
    it('renders with default props', () => {
      render(<Skeleton />)
      expect(screen.getByTestId('motion-div').parentElement).toBeInTheDocument()
    })

    it('applies circle class when specified', () => {
      render(<Skeleton circle />)
      expect(screen.getByTestId('motion-div').parentElement).toHaveClass('rounded-full')
    })

    it('applies custom width and height', () => {
      render(<Skeleton width="100px" height="50px" />)
      
      const skeleton = screen.getByTestId('motion-div').parentElement;
      expect(skeleton).toHaveStyle('width: 100px');
      expect(skeleton).toHaveStyle('height: 50px');
    })
  })
})
