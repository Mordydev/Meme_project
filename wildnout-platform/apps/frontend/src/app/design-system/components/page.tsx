'use client'

import React from 'react'
import { 
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui'

import {
  Transition,
  Celebration,
  Spinner,
  ProgressBar,
  Skeleton,
  BattleLoading,
  Highlight,
  HoverEffect,
  Counter,
  NotificationBadge
} from '@/components/animation'

export default function ComponentsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-display mb-8">Design System Components</h1>
      
      {/* Core UI Components */}
      <section className="mb-12">
        <h2 className="text-headline mb-6">Core UI Components</h2>
        
        {/* Buttons */}
        <div className="mb-8">
          <h3 className="text-subhead mb-4">Buttons</h3>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="destructive">Destructive Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="link">Link Button</Button>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <Button variant="primary" size="sm">Small Button</Button>
            <Button variant="primary">Default Button</Button>
            <Button variant="primary" size="lg">Large Button</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" isLoading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </div>
        
        {/* Cards */}
        <div className="mb-8">
          <h3 className="text-subhead mb-4">Cards</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the main content of the card.</p>
              </CardContent>
              <CardFooter>
                <Button>Action</Button>
              </CardFooter>
            </Card>
            
            <Card variant="outline">
              <CardHeader>
                <CardTitle>Outline Variant</CardTitle>
                <CardDescription>With transparent background</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the main content of the card.</p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary">Action</Button>
              </CardFooter>
            </Card>
            
            <Card variant="subtle">
              <CardHeader>
                <CardTitle>Subtle Variant</CardTitle>
                <CardDescription>Lower contrast background</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the main content of the card.</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Animation Components */}
      <section className="mb-12">
        <h2 className="text-headline mb-6">Animation Components</h2>
        
        {/* Transitions */}
        <div className="mb-8">
          <h3 className="text-subhead mb-4">Transitions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border border-zinc-800 rounded-lg">
              <h4 className="font-medium mb-2">Fade Transition</h4>
              <Transition type="fade" className="p-4 bg-zinc-800 rounded-lg">
                <div>Fade In Content</div>
              </Transition>
            </div>
            
            <div className="p-4 border border-zinc-800 rounded-lg">
              <h4 className="font-medium mb-2">Slide Up Transition</h4>
              <Transition type="slide-up" className="p-4 bg-zinc-800 rounded-lg">
                <div>Slide Up Content</div>
              </Transition>
            </div>
            
            <div className="p-4 border border-zinc-800 rounded-lg">
              <h4 className="font-medium mb-2">Scale Transition</h4>
              <Transition type="scale" className="p-4 bg-zinc-800 rounded-lg">
                <div>Scale Content</div>
              </Transition>
            </div>
          </div>
        </div>
        
        {/* Loading States */}
        <div className="mb-8">
          <h3 className="text-subhead mb-4">Loading States</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border border-zinc-800 rounded-lg">
              <h4 className="font-medium mb-2">Spinners</h4>
              <div className="flex items-center gap-4">
                <Spinner size="sm" />
                <Spinner />
                <Spinner size="lg" color="secondary" />
              </div>
            </div>
            
            <div className="p-4 border border-zinc-800 rounded-lg">
              <h4 className="font-medium mb-2">Progress Bars</h4>
              <div className="space-y-4">
                <ProgressBar progress={30} />
                <ProgressBar progress={60} color="secondary" />
                <ProgressBar progress={90} color="success" showPercentage />
              </div>
            </div>
            
            <div className="p-4 border border-zinc-800 rounded-lg">
              <h4 className="font-medium mb-2">Skeletons</h4>
              <div className="space-y-2">
                <Skeleton width="100%" height="24px" />
                <Skeleton width="80%" height="24px" />
                <div className="flex items-center gap-2">
                  <Skeleton width="40px" height="40px" circle />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="100%" height="10px" />
                    <Skeleton width="60%" height="10px" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Micro-interactions */}
        <div className="mb-8">
          <h3 className="text-subhead mb-4">Micro-interactions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border border-zinc-800 rounded-lg">
              <h4 className="font-medium mb-2">Highlights</h4>
              <div className="space-y-4">
                <Highlight type="pulse" className="p-2 bg-zinc-800 rounded">Pulse Highlight</Highlight>
                <Highlight type="glow" className="p-2 bg-zinc-800 rounded">Glow Highlight</Highlight>
                <Highlight type="wiggle" className="p-2 bg-zinc-800 rounded">Wiggle Highlight</Highlight>
              </div>
            </div>
            
            <div className="p-4 border border-zinc-800 rounded-lg">
              <h4 className="font-medium mb-2">Hover Effects</h4>
              <div className="flex flex-wrap gap-4">
                <HoverEffect type="float">
                  <div className="p-4 bg-zinc-800 rounded">Float on Hover</div>
                </HoverEffect>
                
                <HoverEffect type="grow">
                  <div className="p-4 bg-zinc-800 rounded">Grow on Hover</div>
                </HoverEffect>
                
                <HoverEffect type="glow">
                  <div className="p-4 bg-zinc-800 rounded">Glow on Hover</div>
                </HoverEffect>
              </div>
            </div>
            
            <div className="p-4 border border-zinc-800 rounded-lg">
              <h4 className="font-medium mb-2">Counters & Badges</h4>
              <div className="space-y-4">
                <div>
                  <Counter value={1234} prefix="$" />
                </div>
                <div className="flex items-center gap-2">
                  <span>Notifications</span>
                  <NotificationBadge count={5} />
                </div>
                <div className="flex items-center gap-2">
                  <span>Messages</span>
                  <NotificationBadge count={99} maxCount={99} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Special Components */}
        <div>
          <h3 className="text-subhead mb-4">Special Components</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-zinc-800 rounded-lg">
              <h4 className="font-medium mb-2">Battle Loading</h4>
              <BattleLoading text="Preparing your battle..." />
            </div>
            
            <div className="p-4 border border-zinc-800 rounded-lg">
              <h4 className="font-medium mb-2">Celebration</h4>
              <div className="flex justify-center">
                <Celebration type="achievement">
                  <div className="text-center">
                    <div className="size-16 rounded-full bg-gradient-to-br from-battle-yellow to-victory-green flex items-center justify-center text-wild-black text-xl font-bold mx-auto">
                      🏆
                    </div>
                    <h4 className="mt-2 text-lg font-medium">Achievement Unlocked!</h4>
                    <p className="text-sm text-zinc-400">Battle Champion</p>
                  </div>
                </Celebration>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
