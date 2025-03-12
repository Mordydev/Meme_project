'use client'

import { useRef, useEffect, useState } from 'react'

interface ParticleBackgroundProps {
  color?: string
  particleCount?: number
  particleSize?: number
  speed?: number
  className?: string
}

export default function ParticleBackground({
  color = '#E9E336', // battle-yellow
  particleCount = 300,
  particleSize = 2,
  speed = 0.02,
  className = '',
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return
    
    // Set canvas dimensions
    const updateCanvasSize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    
    // Parse color for particles
    const getColorComponents = (hexColor: string) => {
      const r = parseInt(hexColor.slice(1, 3), 16)
      const g = parseInt(hexColor.slice(3, 5), 16)
      const b = parseInt(hexColor.slice(5, 7), 16)
      return { r, g, b }
    }
    
    const colorComponents = getColorComponents(color)
    
    // Create particles
    type Particle = {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
    }
    
    const particles: Particle[] = []
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * particleSize + 0.5,
        speedX: (Math.random() - 0.5) * speed * 2,
        speedY: (Math.random() - 0.5) * speed * 2,
        opacity: Math.random() * 0.5 + 0.2
      })
    }
    
    // Mouse interaction
    let mouseX = 0
    let mouseY = 0
    const mouseMoveHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = event.clientX - rect.left
      mouseY = event.clientY - rect.top
    }
    
    canvas.addEventListener('mousemove', mouseMoveHandler)
    
    // Animation
    let animationId: number
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Update and draw particles
      particles.forEach(particle => {
        // Update position
        particle.x += particle.speedX
        particle.y += particle.speedY
        
        // Mouse influence - subtle attraction
        const dx = mouseX - particle.x
        const dy = mouseY - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 100) {
          particle.x += dx * 0.01
          particle.y += dy * 0.01
        }
        
        // Boundary check
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1
        }
        
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1
        }
        
        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${colorComponents.r}, ${colorComponents.g}, ${colorComponents.b}, ${particle.opacity})`
        ctx.fill()
      })
      
      animationId = requestAnimationFrame(animate)
    }
    
    // Start animation
    animate()
    setIsReady(true)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      canvas.removeEventListener('mousemove', mouseMoveHandler)
      cancelAnimationFrame(animationId)
    }
  }, [color, particleCount, particleSize, speed])
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-0'} ${className}`}
      aria-hidden="true"
    />
  )
}
