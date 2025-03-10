import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })
  
  it('applies variant styles correctly', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button', { name: /secondary/i })
    expect(button).toHaveClass('bg-flow-blue')
  })
  
  it('applies size styles correctly', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByRole('button', { name: /large button/i })
    expect(button).toHaveClass('h-12')
  })
  
  it('shows loading state when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>)
    
    // Button should be disabled
    expect(screen.getByRole('button')).toBeDisabled()
    
    // Loading spinner should be present
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument()
    
    // Text should still be visible
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
  
  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button', { name: /click me/i }))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('applies animation variant correctly', () => {
    render(<Button animation="bounce">Bounce</Button>)
    const button = screen.getByRole('button', { name: /bounce/i })
    expect(button).toHaveClass('hover:animate-[bounce_0.5s_var(--easing-bounce)]')
  })
  
  it('should be disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled()
  })
  
  it('merges custom className with default styles', () => {
    render(<Button className="custom-class">Custom Class</Button>)
    const button = screen.getByRole('button', { name: /custom class/i })
    expect(button).toHaveClass('custom-class')
    // Should still have default variant classes
    expect(button).toHaveClass('bg-battle-yellow')
  })
})
