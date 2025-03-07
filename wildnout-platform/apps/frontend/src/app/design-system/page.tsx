'use client'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Skeleton
} from "@/components/ui"

import { BattleCard } from "@/components/features/battle"

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <h1 className="text-4xl font-display mb-8 text-battle-yellow">Wild 'n Out Design System</h1>
      
      <Tabs defaultValue="colors">
        <TabsList className="mb-8">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="patterns">UI Patterns</TabsTrigger>
        </TabsList>
      
        <TabsContent value="colors" className="space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-display">Color Palette</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <ColorCard name="Wild Black" variable="--color-wild-black" color="#121212" />
              <ColorCard name="Battle Yellow" variable="--color-battle-yellow" color="#E9E336" />
              <ColorCard name="Hype White" variable="--color-hype-white" color="#FFFFFF" />
              <ColorCard name="Victory Green" variable="--color-victory-green" color="#36E95C" />
              <ColorCard name="Roast Red" variable="--color-roast-red" color="#E93636" />
              <ColorCard name="Flow Blue" variable="--color-flow-blue" color="#3654E9" />
            </div>
          </section>
        </TabsContent>
      
        <TabsContent value="typography" className="space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-display">Typography</h2>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl text-battle-yellow">Headings</h3>
                <div className="space-y-3">
                  <div className="font-display text-4xl">Display (4xl)</div>
                  <div className="font-display text-3xl">Headline (3xl)</div>
                  <div className="font-display text-2xl">Subheadline (2xl)</div>
                  <div className="font-display text-xl">Title (xl)</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl text-battle-yellow">Body</h3>
                <div className="space-y-3">
                  <div className="text-base">Body Text (base) - The Wild 'n Out Meme Coin platform brings the energy of the show into the digital world.</div>
                  <div className="text-sm">Small Text (sm) - Perfect for secondary information and supporting content.</div>
                  <div className="text-xs">Extra Small (xs) - Used for captions, footnotes, and metadata.</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl text-battle-yellow">Font Families</h3>
                <div className="space-y-3">
                  <div className="font-display text-xl">Display Font (Knockout)</div>
                  <div className="font-body text-xl">Body Font (Inter)</div>
                  <div className="font-accent text-xl">Accent Font (Druk)</div>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>
      
        <TabsContent value="components" className="space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-display">Buttons</h2>
            
            <div className="space-y-4">
              <h3 className="text-xl text-battle-yellow">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl text-battle-yellow">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg">Large</Button>
                <Button>Default</Button>
                <Button size="sm">Small</Button>
                <Button size="icon" aria-label="Icon button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl text-battle-yellow">States</h3>
              <div className="flex flex-wrap gap-4">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
                <Button isLoading>Loading</Button>
              </div>
            </div>
          </section>
          
          <section className="space-y-6">
            <h2 className="text-2xl font-display">Form Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-medium">Input</label>
                <Input placeholder="Enter some text" />
                <Input placeholder="Error state" error="This field is required" />
                <Input placeholder="Disabled" disabled />
              </div>
              
              <div className="space-y-4">
                <label className="text-sm font-medium">Textarea</label>
                <Textarea placeholder="Enter longer text here..." />
                <Textarea placeholder="Error state" error="Please enter at least 10 characters" />
                <Textarea placeholder="Disabled" disabled />
              </div>
            </div>
          </section>
          
          <section className="space-y-6">
            <h2 className="text-2xl font-display">Badges</h2>
            
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="primary" animation="pulse">Animated</Badge>
            </div>
          </section>
          
          <section className="space-y-6">
            <h2 className="text-2xl font-display">Avatar</h2>
            
            <div className="flex flex-wrap gap-4">
              <Avatar>
                <AvatarImage src="https://i.pravatar.cc/150?img=1" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              
              <Avatar className="h-12 w-12">
                <AvatarImage src="https://i.pravatar.cc/150?img=2" alt="User" />
                <AvatarFallback>MC</AvatarFallback>
              </Avatar>
              
              <Avatar className="h-16 w-16">
                <AvataratarFallback>WO</AvatarFallback>
              </Avatar>
            </div>
          </section>
          
          <section className="space-y-6">
            <h2 className="text-2xl font-display">Card</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>This is a basic card component.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card content goes here. This can contain any UI elements.</p>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline" size="sm">Cancel</Button>
                  <Button size="sm">Confirm</Button>
                </CardFooter>
              </Card>
              
              <Card variant="outline">
                <CardHeader>
                  <CardTitle>Outline Variant</CardTitle>
                  <CardDescription>A more subtle card style.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card with outline variant for less visual emphasis.</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm">Learn more</Button>
                </CardFooter>
              </Card>
            </div>
          </section>
          
          <section className="space-y-6">
            <h2 className="text-2xl font-display">Loading States</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </section>
        </TabsContent>
      
        <TabsContent value="patterns" className="space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-display">Tooltips</h2>
            
            <div className="py-8 flex justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Useful additional information</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </section>
          
          <section className="space-y-6">
            <h2 className="text-2xl font-display">Dialogs/Modals</h2>
            
            <div className="py-8 flex justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Battle Confirmation</DialogTitle>
                    <DialogDescription>
                      Are you ready to enter this battle? Once submitted, your entry will be visible to the community.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Submitting to: <strong>Friday Night Showdown</strong></p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Let's Go!</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </section>
          
          <section className="space-y-6">
            <h2 className="text-2xl font-display">Battle Card Component</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <BattleCard
                id="battle-1"
                title="Friday Night Freestyle"
                type="wildStyle"
                status="active"
                participants={42}
                timeRemaining="2 hours left"
                onActionClick={() => alert('Battle action clicked!')}
              />
              
              <BattleCard
                id="battle-2"
                title="Celebrity Impersonation Battle"
                type="pickUpKillIt"
                status="voting"
                participants={68}
                hasParticipated={true}
                onActionClick={() => alert('Battle action clicked!')}
              />
              
              <BattleCard
                id="battle-3"
                title="Hip Hop Classics Showdown"
                type="rAndBeef"
                status="upcoming"
                participants={12}
                timeRemaining="Starts in 3 days"
                onActionClick={() => alert('Battle action clicked!')}
              />
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ColorCard({ name, variable, color }: { name: string, variable: string, color: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-zinc-800">
      <div className="h-24" style={{ backgroundColor: color }}></div>
      <div className="p-3 bg-zinc-900">
        <h3 className="font-medium text-hype-white">{name}</h3>
        <p className="text-sm text-zinc-400">{variable}</p>
        <p className="text-sm font-mono text-zinc-400">{color}</p>
      </div>
    </div>
  )
}
