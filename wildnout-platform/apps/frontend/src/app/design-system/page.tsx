import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-display mb-4">Wild 'n Out Design System</h1>
      <p className="text-xl mb-6 text-hype-white/70 max-w-3xl">
        A comprehensive design system for the Wild 'n Out Meme Coin Platform, ensuring visual consistency
        and a high-energy branded experience.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8 max-w-3xl">
        <h2 className="text-headline mb-4 text-battle-yellow">Implementation Status</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">Design Tokens</span>
              <span className="text-victory-green">Complete</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full">
              <div className="bg-victory-green h-full rounded-full w-full"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">Core UI Components</span>
              <span className="text-victory-green">Complete</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full">
              <div className="bg-victory-green h-full rounded-full w-full"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">Animation System</span>
              <span className="text-victory-green">Complete</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full">
              <div className="bg-victory-green h-full rounded-full w-full"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">Dark Mode Support</span>
              <span className="text-victory-green">Complete</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full">
              <div className="bg-victory-green h-full rounded-full w-full"></div>
            </div>
          </div>

          <div className="text-sm text-hype-white/60 mt-4">
            All design system components are now available for use across the platform.
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link href="/design-system/tokens" className="block">
          <Card className="h-full transition-all hover:border-battle-yellow/50 hover:shadow-lg hover:shadow-battle-yellow/5">
            <CardHeader>
              <CardTitle>Design Tokens</CardTitle>
              <CardDescription>Foundational elements that define the visual language</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-hype-white/70">
                <li>Colors - Primary, secondary, and semantic color tokens</li>
                <li>Typography - Font families, sizes, weights, and line heights</li>
                <li>Spacing - Consistent spacing scale and layout tokens</li>
                <li>Animation - Duration, easing, and animation patterns</li>
              </ul>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/design-system/components" className="block">
          <Card className="h-full transition-all hover:border-battle-yellow/50 hover:shadow-lg hover:shadow-battle-yellow/5">
            <CardHeader>
              <CardTitle>Component Library</CardTitle>
              <CardDescription>Reusable UI components built with design tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-hype-white/70">
                <li>Core UI - Buttons, cards, inputs, and other basic components</li>
                <li>Animation - Transitions, loading states, and celebrations</li>
                <li>Layout - Containers, grids, and responsive patterns</li>
                <li>Features - Battle, profile, and token-specific components</li>
              </ul>
            </CardContent>
          </Card>
        </Link>
      </div>
      
      <h2 className="text-headline mb-6">Usage Guidelines</h2>
      
      <div className="space-y-8 max-w-3xl mb-12">
        <div>
          <h3 className="text-subhead mb-2">Importing Design Tokens</h3>
          <div className="bg-zinc-900 p-4 rounded-md overflow-x-auto">
            <pre><code>{`// No need to import tokens directly as they're included in globals.css
// Access tokens via CSS variables:

// In CSS:
.my-element {
  color: var(--color-battle-yellow);
  font-family: var(--font-display);
  margin-bottom: var(--space-4);
  animation-duration: var(--duration-standard);
}

// In inline styles:
<div style={{ 
  color: 'rgb(var(--color-battle-yellow))',
  marginBottom: 'var(--space-4)'
}}>
  Content
</div>`}</code></pre>
          </div>
        </div>
        
        <div>
          <h3 className="text-subhead mb-2">Using Animation Components</h3>
          <div className="bg-zinc-900 p-4 rounded-md overflow-x-auto">
            <pre><code>{`// Import animation components
import { Transition, Celebration, Spinner } from '@/components/animation';

// Example usage
<Transition type="fade" duration="standard">
  <div>This content will fade in</div>
</Transition>

<Celebration type="achievement">
  <div>Celebration content</div>
</Celebration>

<Spinner size="md" color="primary" />
`}</code></pre>
          </div>
        </div>
        
        <div>
          <h3 className="text-subhead mb-2">Utility Classes</h3>
          <div className="bg-zinc-900 p-4 rounded-md overflow-x-auto">
            <pre><code>{`<!-- Using utility classes for text styling -->
<h1 class="text-display font-display text-battle-yellow">Heading</h1>

<!-- Using utility classes for spacing -->
<div class="space-y-4 p-6">
  <div>Spaced content</div>
  <div>With consistent gaps</div>
</div>

<!-- Animation utilities -->
<div class="animate-fade-in delay-medium">
  This appears with a fade-in animation
</div>`}</code></pre>
          </div>
        </div>
      </div>
      
      <h2 className="text-headline mb-6">Design Principles</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>High-Energy Entertainment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-hype-white/70">
              Every interaction should capture Wild 'n Out's spontaneous,
              vibrant energy while maintaining usability.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Battle Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-hype-white/70">
              Create fair, exciting competitive experiences that reward
              creativity while remaining accessible to all skill levels.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Community Spotlight</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-hype-white/70">
              Recognize and elevate user contributions throughout the experience
              to build a sense of belonging and status.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Mobile Momentum</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-hype-white/70">
              Optimize for on-the-go, single-handed mobile experiences with
              meaningful micro-sessions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
