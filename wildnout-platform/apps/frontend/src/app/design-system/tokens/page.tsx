import React from 'react'

export default function DesignTokensPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-display mb-8">Design System Tokens</h1>
      
      {/* Color Tokens */}
      <section className="mb-12">
        <h2 className="text-headline mb-4">Color Tokens</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Primary Colors */}
          <div className="space-y-4">
            <h3 className="text-subhead">Primary Colors</h3>
            
            <div className="flex flex-col gap-2">
              <ColorSwatch name="Wild Black" variable="--color-wild-black" hex="#121212" />
              <ColorSwatch name="Battle Yellow" variable="--color-battle-yellow" hex="#E9E336" />
              <ColorSwatch name="Hype White" variable="--color-hype-white" hex="#FFFFFF" />
            </div>
          </div>
          
          {/* Secondary Colors */}
          <div className="space-y-4">
            <h3 className="text-subhead">Secondary Colors</h3>
            
            <div className="flex flex-col gap-2">
              <ColorSwatch name="Victory Green" variable="--color-victory-green" hex="#36E95C" />
              <ColorSwatch name="Roast Red" variable="--color-roast-red" hex="#E93636" />
              <ColorSwatch name="Flow Blue" variable="--color-flow-blue" hex="#3654E9" />
            </div>
          </div>
          
          {/* Semantic Colors */}
          <div className="space-y-4">
            <h3 className="text-subhead">Semantic Colors</h3>
            
            <div className="flex flex-col gap-2">
              <ColorSwatch name="Background" variable="--color-background" hex="#121212" />
              <ColorSwatch name="Foreground" variable="--color-foreground" hex="#FFFFFF" />
              <ColorSwatch name="Primary" variable="--color-primary" hex="#E9E336" />
              <ColorSwatch name="Secondary" variable="--color-secondary" hex="#3654E9" />
              <ColorSwatch name="Accent" variable="--color-accent" hex="#36E95C" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Typography Tokens */}
      <section className="mb-12">
        <h2 className="text-headline mb-4">Typography Tokens</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Font Families */}
          <div>
            <h3 className="text-subhead mb-4">Font Families</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-caption mb-1">--font-display</p>
                <p className="font-display text-2xl">Knockout (Display)</p>
              </div>
              
              <div>
                <p className="text-caption mb-1">--font-body</p>
                <p className="font-body text-2xl">Inter (Body)</p>
              </div>
              
              <div>
                <p className="text-caption mb-1">--font-accent</p>
                <p className="font-accent text-2xl">DRUK (ACCENT)</p>
              </div>
            </div>
          </div>
          
          {/* Font Sizes */}
          <div>
            <h3 className="text-subhead mb-4">Font Sizes</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-caption mb-1">--text-display</p>
                <p style={{ fontSize: 'var(--text-display)' }}>Display Text (2rem)</p>
              </div>
              
              <div>
                <p className="text-caption mb-1">--text-headline</p>
                <p style={{ fontSize: 'var(--text-headline)' }}>Headline Text (1.5rem)</p>
              </div>
              
              <div>
                <p className="text-caption mb-1">--text-subhead</p>
                <p style={{ fontSize: 'var(--text-subhead)' }}>Subhead Text (1.125rem)</p>
              </div>
              
              <div>
                <p className="text-caption mb-1">--text-body</p>
                <p style={{ fontSize: 'var(--text-body)' }}>Body Text (1rem)</p>
              </div>
              
              <div>
                <p className="text-caption mb-1">--text-caption</p>
                <p style={{ fontSize: 'var(--text-caption)' }}>Caption Text (0.875rem)</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Spacing Tokens */}
      <section className="mb-12">
        <h2 className="text-headline mb-4">Spacing Tokens</h2>
        
        <div className="space-y-6">
          <div>
            <p className="text-subhead mb-2">Base Spacing Unit</p>
            <p className="text-body mb-2">--spacing: 0.25rem (4px)</p>
            <div className="w-4 h-4 bg-battle-yellow"></div>
          </div>
          
          <div className="space-y-3">
            <p className="text-subhead">Common Spacing Values</p>
            
            <div className="flex flex-wrap gap-8">
              <SpacingExample name="space-1" value="0.25rem" />
              <SpacingExample name="space-2" value="0.5rem" />
              <SpacingExample name="space-4" value="1rem" />
              <SpacingExample name="space-6" value="1.5rem" />
              <SpacingExample name="space-8" value="2rem" />
              <SpacingExample name="space-12" value="3rem" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Animation Tokens */}
      <section className="mb-12">
        <h2 className="text-headline mb-4">Animation Tokens</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Durations */}
          <div>
            <h3 className="text-subhead mb-4">Durations</h3>
            
            <div className="space-y-4">
              <AnimationDuration name="duration-instant" value="100ms" />
              <AnimationDuration name="duration-quick" value="200ms" />
              <AnimationDuration name="duration-standard" value="300ms" />
              <AnimationDuration name="duration-emphasis" value="450ms" />
              <AnimationDuration name="duration-celebration" value="800ms" />
            </div>
          </div>
          
          {/* Easings */}
          <div>
            <h3 className="text-subhead mb-4">Easing Functions</h3>
            
            <div className="space-y-4">
              <AnimationEasing name="easing-standard" value="cubic-bezier(0.2, 0, 0, 1)" />
              <AnimationEasing name="easing-energetic" value="cubic-bezier(0.2, 0, 0, 1.3)" />
              <AnimationEasing name="easing-bounce" value="cubic-bezier(0.15, 1.15, 0.5, 1)" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Helper Components
function ColorSwatch({ name, variable, hex }: { name: string; variable: string; hex: string }) {
  return (
    <div className="flex items-center space-x-3">
      <div 
        className="w-12 h-12 rounded-md border border-zinc-700 flex-shrink-0" 
        style={{ backgroundColor: hex }}
      ></div>
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-zinc-400">{variable}</p>
        <p className="text-sm text-zinc-400">{hex}</p>
      </div>
    </div>
  )
}

function SpacingExample({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-2">
        <div 
          className="bg-battle-yellow" 
          style={{ 
            width: value,
            height: '24px'
          }}
        ></div>
      </div>
      <p className="text-sm font-medium">{name}</p>
      <p className="text-xs text-zinc-400">{value}</p>
    </div>
  )
}

function AnimationDuration({ name, value }: { name: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <p className="font-medium">--{name}</p>
        <p className="text-zinc-400">{value}</p>
      </div>
      <div className="relative h-6 bg-zinc-800 rounded-md overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-battle-yellow/30 animate-pulse"
          style={{ 
            animationDuration: value
          }}
        ></div>
      </div>
    </div>
  )
}

function AnimationEasing({ name, value }: { name: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <p className="font-medium">--{name}</p>
        <p className="text-zinc-400">{value}</p>
      </div>
      <div className="h-12 bg-zinc-800 rounded-md overflow-hidden">
        {/* Visual representation of the easing curve would go here in a real implementation */}
        <div className="h-full p-2">
          <div className="h-full w-full border-b-2 border-l-2 border-zinc-600 relative">
            <div className="absolute right-0 bottom-0 w-2 h-2 bg-battle-yellow rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
