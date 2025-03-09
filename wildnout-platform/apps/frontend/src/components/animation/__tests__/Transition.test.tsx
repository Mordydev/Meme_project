import React from 'react'
import { render, screen } from '@testing-library/react'
import { Transition } from '../Transition'

// Mock framer-motion
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div data-testid="motion-div" {...props}>{children}</div>
    },
    useReducedMotion: () => false
  }
})

describe('Transition', () => {
  it('renders children', () => {
    render(
      <Transition>
        <p>Test Content</p>
      </Transition>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies className correctly', () => {
    render(
      <Transition className="test-class">
        <p>Test Content</p>
      </Transition>
    )

    expect(screen.getByTestId('motion-div')).toHaveClass('test-class')
  })

  it('uses fade animation by default', () => {
    render(
      <Transition>
        <p>Test Content</p>
      </Transition>
    )

    const motionDiv = screen.getByTestId('motion-div')
    expect(motionDiv).toHaveAttribute('initial')
    
    // Check that the initial attribute contains opacity
    // This is a simplification since we can't easily check object properties in Jest DOM
    const initialAttr = motionDiv.getAttribute('initial')
    expect(initialAttr).toContain('opacity')
  })

  it('passes additional props to motion div', () => {
    render(
      <Transition data-custom-attr="test-value">
        <p>Test Content</p>
      </Transition>
    )

    expect(screen.getByTestId('motion-div')).toHaveAttribute('data-custom-attr', 'test-value')
  })
})
