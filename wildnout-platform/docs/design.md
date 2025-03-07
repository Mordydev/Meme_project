# Wild 'n Out Platform Design System

This document outlines the design system for the Wild 'n Out meme platform, including design tokens, component usage, and styling guidelines.

## Table of Contents

1. [Design Tokens](#design-tokens)
   - [Colors](#colors)
   - [Typography](#typography)
   - [Spacing](#spacing)
   - [Animation](#animation)
   - [Shadows](#shadows)
   - [Border Radius](#border-radius)
2. [Component Library](#component-library)
   - [Button](#button)
   - [Card](#card)
   - [Input](#input)
   - [Badge](#badge)
   - [Avatar](#avatar)
   - [Dialog](#dialog)
   - [Progress](#progress)
   - [Switch](#switch)
   - [Tabs](#tabs)
   - [Toast](#toast)
3. [Usage Guidelines](#usage-guidelines)
   - [Layouts](#layouts)
   - [Responsive Design](#responsive-design)
   - [Accessibility](#accessibility)
4. [Example Usage](#example-usage)

## Design Tokens

### Colors

The Wild 'n Out platform uses a vibrant color scheme that reflects the energetic and bold nature of the brand:

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `wild-black` | `#121212` | `18 18 18` | Primary background |
| `battle-yellow` | `#E9E336` | `233 227 54` | Primary accent & CTA |
| `hype-white` | `#FFFFFF` | `255 255 255` | Text & foreground |
| `victory-green` | `#36E95C` | `54 233 92` | Success states |
| `roast-red` | `#E93636` | `233 54 54` | Error states |
| `flow-blue` | `#3654E9` | `54 84 233` | Secondary accent |

Usage in Tailwind:
```jsx
<div className="bg-wild-black text-hype-white">
  <span className="text-battle-yellow">Important highlight</span>
</div>
```

### Typography

The platform uses a combination of three font families:

| Font | Role | Usage |
|------|------|-------|
| `Knockout` | Display | Headlines, titles, and important callouts |
| `Inter` | Body | Main text content, UI elements, and descriptions |
| `Druk` | Accent | Special emphasis, badges, and buttons |

Font size tokens:

| Token | Size | Usage |
|-------|------|-------|
| `text-xs` | 0.75rem (12px) | Small UI elements, footnotes |
| `text-sm` | 0.875rem (14px) | Secondary text, form controls |
| `text-base` | 1rem (16px) | Body text, default size |
| `text-lg` | 1.125rem (18px) | Emphasis, subheadings |
| `text-xl` | 1.25rem (20px) | Section titles |
| `text-2xl` | 1.5rem (24px) | Major subheadings |
| `text-3xl` | 1.875rem (30px) | Minor headings |
| `text-4xl` | 2.25rem (36px) | Major headings |
| `text-5xl` | 3rem (48px) | Hero titles |

Usage in Tailwind:
```jsx
<h1 className="font-display text-4xl font-bold">Main Headline</h1>
<p className="font-body text-base">Body text content goes here</p>
<button className="font-accent text-sm">CLICK ME</button>
```

### Spacing

The platform uses a consistent spacing system based on `0.25rem` (4px) increments:

| Token | Size | Description |
|-------|------|-------------|
| `0` | 0px | No spacing |
| `0.5` | 0.125rem (2px) | Extra tight, decorative |
| `1` | 0.25rem (4px) | Very tight, icons, tight UI |
| `2` | 0.5rem (8px) | Tight, between related elements |
| `3` | 0.75rem (12px) | Compact spacing |
| `4` | 1rem (16px) | Standard spacing, within components |
| `6` | 1.5rem (24px) | Generous, between components |
| `8` | 2rem (32px) | Wide, major sections |
| `12` | 3rem (48px) | Very wide, page sections |
| `16` | 4rem (64px) | Extra wide, major page breaks |

### Animation

Animation durations and easing functions provide consistent motion design:

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | `100ms` | Micro-interactions, immediate feedback |
| `--duration-quick` | `200ms` | Fast transitions, UI state changes |
| `--duration-standard` | `300ms` | Regular transitions, most common usage |
| `--duration-emphasis` | `450ms` | Important state changes, focused attention |
| `--duration-celebration` | `800ms` | Special events, rewards, celebrations |
| `--easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Most interactions |
| `--easing-energetic` | `cubic-bezier(0.2, 0, 0, 1.3)` | Lively, energetic movements |
| `--easing-bounce` | `cubic-bezier(0.15, 1.15, 0.5, 1)` | Playful, exaggerated motions |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.1)` | Subtle elements |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Moderately elevated elements |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Highly elevated elements |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.25rem` (4px) | Small elements, tight UI |
| `--radius-md` | `0.5rem` (8px) | Medium elements, default |
| `--radius-lg` | `0.75rem` (12px) | Large elements, cards |
| `--radius-xl` | `1rem` (16px) | Extra large elements |
| `--radius-full` | `9999px` | Circular or pill shapes |

## Component Library

### Button

Buttons are the primary interactive elements that prompt users to take actions.

**Variants:**
- `primary`: Yellow background, black text (default)
- `secondary`: Blue background, white text
- `success`: Green background, black text
- `danger`: Red background, white text
- `outline`: Transparent with yellow border
- `ghost`: Transparent with hover effect
- `link`: Text-only with underline on hover

**Sizes:**
- `sm`: Small, compact buttons
- `default`: Standard size (default)
- `lg`: Large, prominent buttons
- `icon`: Square button for icons

**Example:**
```jsx
<Button variant="primary" size="default">Click Me</Button>
<Button variant="outline" size="sm">Small Button</Button>
<Button variant="secondary" size="lg" rightIcon={<ArrowRight size={16} />}>Next Page</Button>
```

### Card

Cards are containers that group related content and actions.

**Variants:**
- `default`: Semi-dark background with border (default)
- `outline`: Transparent with border
- `subtle`: Very dark background, no border

**Components:**
- `Card`: The main container
- `CardHeader`: Top section for title and description
- `CardTitle`: Card's heading
- `CardDescription`: Secondary text under title
- `CardContent`: Main content area
- `CardFooter`: Bottom area, often for actions

**Example:**
```jsx
<Card variant="default">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>This is a card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input

Form input fields for user data entry.

**Features:**
- Error state display
- Helper text
- Left/right icons
- Label integration

**Example:**
```jsx
<Input 
  label="Email Address"
  placeholder="you@example.com"
  helperText="We'll never share your email"
  leftIcon={<Mail size={16} />}
/>

<Input 
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>
```

### Badge

Badges are small visual indicators for status, counts, or categories.

**Variants:**
- `default`: Dark gray
- `primary`: Yellow
- `secondary`: Blue
- `success`: Green
- `danger`: Red
- `outline`: Transparent with border

**Example:**
```jsx
<Badge variant="primary">New</Badge>
<Badge variant="success">Completed</Badge>
<Badge variant="outline">Draft</Badge>
```

### Avatar

Avatars represent users or entities with images or initials.

**Sizes:**
- `sm`: Small (32px)
- `md`: Medium (40px)
- `lg`: Large (48px)
- `xl`: Extra large (64px)

**Features:**
- Image fallback to initials
- Status indicator (online, offline, away, busy)

**Example:**
```jsx
<Avatar 
  src="/path/to/image.jpg" 
  alt="User Name"
  size="md"
  status="online"
/>

<Avatar 
  fallback="JD" 
  size="lg"
/>
```

### Dialog

Modal dialogs for focused interactions or information.

**Example:**
```jsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        This is a description of the dialog content.
      </DialogDescription>
    </DialogHeader>
    <p>Main content of the dialog</p>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Progress

Progress indicators show completion status of operations.

**Variants:**
- `default`: Gray
- `primary`: Yellow
- `secondary`: Blue
- `success`: Green
- `danger`: Red

**Sizes:**
- `sm`: Small (4px)
- `md`: Medium (8px)
- `lg`: Large (12px)

**Example:**
```jsx
<Progress value={75} indicatorColor="primary" size="md" />
```

### Switch

Toggle switches for binary choices.

**Variants:**
- `default`: Gray
- `primary`: Yellow
- `success`: Green
- `danger`: Red

**Example:**
```jsx
<div className="flex items-center space-x-2">
  <Switch id="notifications" variant="primary" />
  <label htmlFor="notifications">Enable notifications</label>
</div>
```

### Tabs

Tabs organize content into separate views that can be navigated between.

**Variants:**
- `default`: Background container style
- `outline`: Bottom border style
- `pills`: Rounded button style

**Example:**
```jsx
<Tabs defaultValue="account">
  <TabsList variant="default">
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Account settings</TabsContent>
  <TabsContent value="password">Password settings</TabsContent>
  <TabsContent value="notifications">Notification settings</TabsContent>
</Tabs>
```

### Toast

Toasts display brief, non-disruptive messages.

**Variants:**
- `default`: Dark background
- `success`: Green
- `error`: Red
- `warning`: Yellow
- `info`: Blue

**Example:**
```jsx
<ToastProvider>
  {/* Elsewhere in your component */}
  <Toast variant="success">
    <ToastTitle>Success!</ToastTitle>
    <ToastDescription>Your action was completed successfully.</ToastDescription>
    <ToastClose />
  </Toast>
</ToastProvider>
```

## Usage Guidelines

### Layouts

- Use the container class for consistent page width: `<div className="container mx-auto px-4">`
- Employ flexbox and grid for complex layouts
- Maintain a consistent vertical rhythm using the spacing system
- Use the `space-y-*` and `space-x-*` utilities for even spacing

### Responsive Design

- Mobile-first approach with breakpoint modifiers:
  - `sm`: 640px and up
  - `md`: 768px and up
  - `lg`: 1024px and up
  - `xl`: 1280px and up
  - `2xl`: 1440px and up

- Example responsive text:
  ```jsx
  <h1 className="text-2xl md:text-4xl lg:text-5xl">Responsive Heading</h1>
  ```

### Accessibility

- Use proper semantic HTML elements
- Maintain sufficient color contrast
- Provide focus states for interactive elements
- Include proper ARIA attributes when needed
- Ensure keyboard navigation works

## Example Usage

Here's an example of a profile card using the design system:

```jsx
<Card className="max-w-md">
  <CardHeader>
    <div className="flex items-center space-x-4">
      <Avatar 
        src="/images/user.jpg" 
        alt="John Doe" 
        size="lg"
        status="online"
      />
      <div>
        <CardTitle>John Doe</CardTitle>
        <CardDescription>Battle Champion</CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex justify-between">
      <div>
        <h4 className="text-sm font-medium text-hype-white/60">Wins</h4>
        <p className="text-2xl font-display text-battle-yellow">42</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-hype-white/60">Losses</h4>
        <p className="text-2xl font-display">12</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-hype-white/60">Win Rate</h4>
        <p className="text-2xl font-display text-victory-green">78%</p>
      </div>
    </div>
    
    <div>
      <h4 className="text-sm font-medium text-hype-white/60 mb-2">Battle Rating</h4>
      <Progress value={78} indicatorColor="primary" size="md" />
    </div>
    
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary">Comedian</Badge>
      <Badge variant="secondary">Freestyle</Badge>
      <Badge variant="outline">VIP</Badge>
    </div>
  </CardContent>
  <CardFooter className="justify-between">
    <Button variant="outline">View Profile</Button>
    <Button>Challenge</Button>
  </CardFooter>
</Card>
```
